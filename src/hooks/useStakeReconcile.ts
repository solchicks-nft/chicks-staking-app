import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BN from 'bn.js';
import bs58 from 'bs58';
import {ConfirmOptions, Connection, PublicKey, TransactionResponse} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {Buffer} from "buffer";
import {formatUnits} from "@ethersproject/units";
import {
  Context,
  Idl,
  Program,
  Provider as AnchorProvider,
} from '@project-serum/anchor';
import { parseUnits } from 'ethers/lib/utils';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Md5 } from 'md5-typescript';
import { BigNumber } from 'ethers';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_HOST } from '../utils/consts';
import {
  SOLCHICK_DECIMALS_ON_SOL,
  SOLCHICK_STAKING_FLEXIBLE,
  SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL,
  SOLCHICK_STAKING_LOCKED,
  SOLCHICK_STAKING_LOCKED_PROGRAM_IDL,
  SOLCHICK_TOKEN_MINT_ON_SOL,
  URL_SUBMIT_FLEX_STAKE,
  URL_SUBMIT_LOCKED_STAKE,
} from '../utils/solchickConsts';
import {
  getTransactionInfoOnSol,
  pubkeyToString,
  toPublicKey,
} from '../utils/solanaHelper';
import { getSolChicksAssociatedAddress } from '../utils/solchickHelper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  getPoolHandle,
  getServerInfo,
  isEnoughTokenOnSolana,
  StakeLockedKind,
  StakeMode,
  StakeStepMode,
} from '../utils/stakeHelper';
import { sleep } from '../utils/helper';
import { useStakePool } from '../contexts/StakePoolContext';

export enum ReconcileStatusCode {
  NONE = 0,
  START,
  PROCESSING,
  SUBMITTING,
  SUCCESS,
  FAILED = 101,
}

export enum ReconcileErrorCode {
  NO_ERROR,
  CANT_CONNECT_SOLANA,
  TOKEN_AMOUNT_NOT_ENOUGH,
  RECONCILE_FAILED,
  SOLANA_NO_ASSOC_ACCOUNT,
  SERVER_INVALID,
  SUBMIT_FAILED,
}

interface IReconcileStatus {
  reconcile(mode: StakeMode, lockedKind: StakeLockedKind | null, txId: string): void;
  isProcessing: boolean;
  statusCode: ReconcileStatusCode;
  errorCode: ReconcileErrorCode;
  lastError: string | null;
}

const createReconcileStatus = (
  reconcile: (mode: StakeMode, lockedKind: StakeLockedKind | null, txId: string) => void,
  isProcessing: boolean,
  statusCode = ReconcileStatusCode.NONE,
  errorCode: ReconcileErrorCode,
  lastError: string | null,
) => ({
  reconcile,
  isProcessing,
  statusCode,
  errorCode,
  lastError,
});

function useStakeReconcile(): IReconcileStatus {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusCode, setStatusCode] = useState(ReconcileStatusCode.NONE);
  const [errorCode, setErrorCode] = useState(ReconcileErrorCode.NO_ERROR);
  const [lastError, setLastError] = useState('');
  const walletSolana = useSolanaWallet();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  async function getAnchorProvider() {
    const opts = {
      preflightCommitment: 'confirmed',
    };
    if (!solanaConnection || !walletSolana) {
      return null;
    }
    return new AnchorProvider(
      solanaConnection,
      walletSolana as unknown as AnchorWallet,
      opts.preflightCommitment as unknown as ConfirmOptions,
    );
  }

  const setError = (error: ReconcileErrorCode) => {
    ConsoleHelper('useStake setError', error);
    setStatusCode(ReconcileStatusCode.FAILED);
    setErrorCode(error);
    setIsProcessing(false);
  };

  const submitStakeResult = async (
    mode: StakeMode,
    stakePool: StakeLockedKind | null,
    address: string,
    amount: number,
    txId: string,
    handle: string,
    xTokenAmount: string,
  ) => {
    const url =
      mode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_STAKE(address, amount, txId, handle, xTokenAmount)
        : URL_SUBMIT_LOCKED_STAKE(stakePool, address, amount, txId, xTokenAmount);

    axios.get(url).then(
      (results) => {
        ConsoleHelper(`processStakeResult: ${JSON.stringify(results)}`);
        if (results.data.success) {
          setStatusCode(ReconcileStatusCode.SUCCESS);
          setIsProcessing(false);
        } else {
          const errorMessage = results.data.error_message || 'Unknown error';
          setLastError(
            `${errorMessage} (Error code: ${results.data.error_code})`,
          );
          setError(ReconcileErrorCode.SUBMIT_FAILED);
        }
      },
      (error) => {
        ConsoleHelper(`processStakeResult: ${error}`);
        setLastError(`Unknown error`);
        setError(ReconcileErrorCode.SUBMIT_FAILED);
      },
    );
  };

  const parseTransaction = (txInfo: TransactionResponse, programId: PublicKey) => {
    ConsoleHelper('parseTransaction', txInfo);

    const {accountKeys, instructions: txInstructions} = txInfo.transaction.message;

    // if (accountKeys.length !== 10) {
    //   ConsoleHelper('accountKeys -- error');
    //   return {success: false}
    // }
    ConsoleHelper('parseTransaction - accountKeys[0]', accountKeys[0].toString());
    ConsoleHelper('parseTransaction - accountKeys[1]', accountKeys[1].toString());
    ConsoleHelper('parseTransaction - accountKeys[2]', accountKeys[2].toString());
    ConsoleHelper('parseTransaction - accountKeys[3]', accountKeys[3].toString());
    ConsoleHelper('parseTransaction - accountKeys[4]', accountKeys[4].toString());
    ConsoleHelper('parseTransaction - accountKeys[5]', accountKeys[5].toString());
    ConsoleHelper('parseTransaction - accountKeys[6]', accountKeys[6].toString());
    ConsoleHelper('parseTransaction - accountKeys[7]', accountKeys[7].toString());
    ConsoleHelper('parseTransaction - accountKeys[8]', accountKeys[8].toString());
    ConsoleHelper('parseTransaction - accountKeys[9]', accountKeys[9].toString());
    if (!accountKeys[9].equals(programId)) {
      ConsoleHelper('accountKeys -- error: Invalid program id');
      return {success: false}
    }

    ConsoleHelper('txInstructions', txInstructions);
    if (!Array.isArray(txInstructions) || txInstructions.length !== 1) {
      ConsoleHelper('accountKeys -- error: Invalid instruction');
      return {success: false}
    }

    const inputData = bs58.decode(txInstructions[0].data);
    if (inputData.length !== 55) {
      ConsoleHelper('accountKeys -- error: length', inputData);
      return {success: false}
    }
    ConsoleHelper('inputData', inputData);

    const handle = inputData.slice(15, 47).toString();
    ConsoleHelper('hash', handle);

    const bnTxAmount = new BN(Buffer.from(inputData.slice(47)), 'hex', 'le');
    ConsoleHelper('bnTxAmount', bnTxAmount.toString());
    const txAmount = formatUnits(bnTxAmount.toString(), 9);
    // const txAmount = formatUnits('6123456789', 9);
    ConsoleHelper('txAmount', txAmount);

    return {success: true, handle, amount: txAmount}
  }

  const processReconcile = async (
    mode: StakeMode,
    lockedKind: StakeLockedKind | null,
    txId: string,
  ) => {
    const { publicKey: walletPublicKey } = walletSolana;

    const provider = await getAnchorProvider();
    if (!provider) {
      return false;
    }

    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const programIdl =
      mode === StakeMode.FLEXIBLE
        ? SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL
        : SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;

    const envProgramId =
      mode === StakeMode.FLEXIBLE
        ? SOLCHICK_STAKING_FLEXIBLE
        : SOLCHICK_STAKING_LOCKED;

    if (programIdl.metadata.address !== envProgramId) {
      ConsoleHelper(`Invalid program id`);
      return false;
    }

    const program = new Program(
      programIdl as unknown as Idl,
      toPublicKey(programIdl.metadata.address),
      provider,
    );

    setIsProcessing(true);
    setStatusCode(ReconcileStatusCode.START);

    setStatusCode(ReconcileStatusCode.PROCESSING);
    const outcome = await getServerInfo();
    if (!outcome) {
      setError(ReconcileErrorCode.SERVER_INVALID);
      return false;
    }

    let xTokenAmountStr;
    let handle = '';
    let stakeAmount = 0;

    try {
      ConsoleHelper(`txId: ${txId}`);
      if (!txId) {
        ConsoleHelper(`getTransactionInfoOnSol: invalid txId`);
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      await sleep(5000);
      const txInfo = await getTransactionInfoOnSol(solanaConnection, txId);
      ConsoleHelper(
        `getTransactionInfoOnSol: txId: ${txId}`,
          txInfo,
      );
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      const ret = parseTransaction(txInfo, toPublicKey(programIdl.metadata.address));
      ConsoleHelper(
        `parseTransaction: result: `,
        ret,
      );
      if (!ret.success) {
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handle = ret.handle;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      stakeAmount = ret.amount;
      const [userStakingPubkey, userStakingBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          [walletPublicKey.toBuffer(), handle],
          program.programId,
        );

      const userStakingAccount = await program.account.userStakingAccount.fetch(
        userStakingPubkey,
      );
      xTokenAmountStr = userStakingAccount.xTokenAmount.toString();
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(ReconcileErrorCode.RECONCILE_FAILED);
      return false;
    }

    setStatusCode(ReconcileStatusCode.SUBMITTING);
    await submitStakeResult(
      mode,
      lockedKind,
      pubkeyToString(walletPublicKey),
      stakeAmount,
      txId,
      handle,
      xTokenAmountStr,
    );
    return true;
  };

  const reconcile = async (mode: StakeMode, lockedKind: StakeLockedKind | null, txId: string) => {
    ConsoleHelper('stake -> start');
    await processReconcile(mode, lockedKind, txId);
  };

  return createReconcileStatus(
    reconcile,
    isProcessing,
    statusCode,
    errorCode,
    lastError,
  );
}

export default useStakeReconcile;
