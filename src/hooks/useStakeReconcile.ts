import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BN from 'bn.js';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
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

enum ReconcileStatusCode {
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
        `getTransactionInfoOnSol: txId: ${txId} - result ${JSON.stringify(
          txInfo,
        )}`,
      );
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      // todo get handle, x_amount
      handle = 'test';
      stakeAmount = 1;
      const [userStakingPubkey, userStakingBump] =
        mode === StakeMode.FLEXIBLE
          ? await anchor.web3.PublicKey.findProgramAddress(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            [walletPublicKey.toBuffer(), handle],
            program.programId,
          )
          : await anchor.web3.PublicKey.findProgramAddress(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            [walletPublicKey.toBuffer()],
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
