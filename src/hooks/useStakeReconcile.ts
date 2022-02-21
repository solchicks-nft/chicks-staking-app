import {useMemo, useState} from 'react';
import axios from 'axios';
import BN from 'bn.js';
import bs58 from 'bs58';
import {ConfirmOptions, Connection, PublicKey, TransactionResponse,} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {Idl, Program, Provider as AnchorProvider} from '@project-serum/anchor';
import {Buffer} from 'buffer';
import {formatUnits} from '@ethersproject/units';
import {AnchorWallet} from '@solana/wallet-adapter-react';
import {useSolanaWallet} from '../contexts/SolanaWalletContext';
import {SOLANA_HOST} from '../utils/consts';
import {
  SOLCHICK_STAKING_FLEXIBLE,
  SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL,
  SOLCHICK_STAKING_LOCKED,
  SOLCHICK_STAKING_LOCKED_PROGRAM_IDL,
  URL_SUBMIT_FLEX_STAKE,
  URL_SUBMIT_LOCKED_STAKE,
} from '../utils/solchickConsts';
import {getTransactionInfoOnSol, pubkeyToString, toPublicKey,} from '../utils/solanaHelper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  getServerInfo,
  StakeLockedPoolLength,
  StakeMode,
} from '../utils/stakeHelper';

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
  reconcile(
    mode: StakeMode,
    lockedPoolLength: StakeLockedPoolLength | null,
    txId: string,
  ): void;
  isReconcileProcessing: boolean;
  reconcileStatusCode: ReconcileStatusCode;
  reconcileErrorCode: ReconcileErrorCode;
  reconcileLastError: string | null;
}

const createReconcileStatus = (
  reconcile: (
    mode: StakeMode,
    lockedPoolLength: StakeLockedPoolLength | null,
    txId: string,
  ) => void,
  isReconcileProcessing: boolean,
  reconcileStatusCode = ReconcileStatusCode.NONE,
  reconcileErrorCode: ReconcileErrorCode,
  reconcileLastError: string | null,
) => ({
  reconcile,
  isReconcileProcessing,
  reconcileStatusCode,
  reconcileErrorCode,
  reconcileLastError,
});

function useStakeReconcile(): IReconcileStatus {
  const [isReconcileProcessing, setIsReconcileProcessing] = useState(false);
  const [reconcileStatusCode, setReconcileStatusCode] = useState(
    ReconcileStatusCode.NONE,
  );
  const [reconcileErrorCode, setReconcileErrorCode] = useState(
    ReconcileErrorCode.NO_ERROR,
  );
  const [reconcileLastError, setReconcileLastError] = useState('');
  const walletSolana = useSolanaWallet();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  async function getAnchorProvider() {
    const opts = {
      preflightCommitment: 'confirmed',
    };
    if (!solanaConnection) {
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
    setReconcileStatusCode(ReconcileStatusCode.FAILED);
    setReconcileErrorCode(error);
    setIsReconcileProcessing(false);
  };

  const submitStakeResult = async (
    mode: StakeMode,
    stakePool: StakeLockedPoolLength | null,
    address: string,
    amount: number,
    txId: string,
    handle: string,
    xTokenAmount: string,
    startTime: string,
  ) => {
    const url =
      mode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_STAKE(
            address,
            amount,
            txId,
            handle,
            xTokenAmount,
            startTime,
          )
        : URL_SUBMIT_LOCKED_STAKE(
            stakePool,
            address,
            amount,
            txId,
            handle,
            xTokenAmount,
            startTime,
          );

    axios.get(url).then(
      (results) => {
        ConsoleHelper(`processStakeResult: ${JSON.stringify(results)}`);
        if (results.data.success) {
          setReconcileStatusCode(ReconcileStatusCode.SUCCESS);
          setIsReconcileProcessing(false);
        } else {
          const errorMessage = results.data.error_message || 'Unknown error';
          setReconcileLastError(
            `${errorMessage} (Error code: ${results.data.error_code})`,
          );
          setError(ReconcileErrorCode.SUBMIT_FAILED);
        }
      },
      (error) => {
        ConsoleHelper(`processStakeResult: ${error}`);
        setReconcileLastError(`Unknown error`);
        setError(ReconcileErrorCode.SUBMIT_FAILED);
      },
    );
  };

  const parseTransaction = (
    mode: StakeMode,
    txInfo: TransactionResponse,
    programId: PublicKey,
  ) => {
    ConsoleHelper(`parseTransaction: ${txInfo}`);

    const { accountKeys, instructions: txInstructions } =
      txInfo.transaction.message;

    ConsoleHelper(
      `parseTransaction -> accountKeys[0]: ${accountKeys[0].toString()}`,
      accountKeys[0].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[1]: ${accountKeys[1].toString()}`,
      accountKeys[1].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[2]: ${accountKeys[2].toString()}`,
      accountKeys[2].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[3]: ${accountKeys[3].toString()}`,
      accountKeys[3].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[4]: ${accountKeys[4].toString()}`,
      accountKeys[4].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[5]: ${accountKeys[5].toString()}`,
      accountKeys[5].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[6]: ${accountKeys[6].toString()}`,
      accountKeys[6].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[7]: ${accountKeys[7].toString()}`,
      accountKeys[7].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[8]: ${accountKeys[8].toString()}`,
      accountKeys[8].toString(),
    );
    ConsoleHelper(
      `parseTransaction -> accountKeys[9]: ${accountKeys[9].toString()}`,
      accountKeys[9].toString(),
    );

    if (mode === StakeMode.FLEXIBLE) {
      if (!accountKeys[9].equals(programId)) {
        ConsoleHelper('accountKeys -> error: Invalid program id', programId.toString());
        return { success: false };
      }
    } else if (!accountKeys[6].equals(programId)) {
        ConsoleHelper('accountKeys -> error: Invalid program id', programId.toString());
        return { success: false };
      }

    ConsoleHelper('txInstructions', txInstructions);
    if (!Array.isArray(txInstructions) || txInstructions.length !== 1) {
      ConsoleHelper('accountKeys -> error: Invalid instruction');
      return { success: false };
    }

    const inputData = bs58.decode(txInstructions[0].data);
    ConsoleHelper('inputData', inputData);

    let handle = '';
    let strAmount;
    if (mode === StakeMode.FLEXIBLE) {
      if (inputData.length !== 55) {
        ConsoleHelper('accountKeys -- error: length', inputData);
        return { success: false };
      }
      handle = inputData.slice(15, 15 + 32).toString();
      strAmount = inputData.slice(47);
    } else {
      if (inputData.length !== 64) {
        ConsoleHelper('accountKeys -- error: length', inputData);
        return { success: false };
      }
      handle = inputData.slice(24, 24 + 32).toString();
      strAmount = inputData.slice(56);
    }

    ConsoleHelper('hash', handle);

    const bnTxAmount = new BN(Buffer.from(strAmount), 'hex', 'le');
    ConsoleHelper('bnTxAmount', bnTxAmount.toString());
    const txAmount = formatUnits(bnTxAmount.toString(), 9);
    ConsoleHelper('txAmount', txAmount);

    return { success: true, handle, amount: txAmount, wallet: accountKeys[0] };
  };

  const processReconcile = async (
    mode: StakeMode,
    lockedKind: StakeLockedPoolLength | null,
    txId: string,
  ) => {
    setReconcileErrorCode(ReconcileErrorCode.NO_ERROR);
    setReconcileLastError('');
    const provider = await getAnchorProvider();
    if (!provider) {
      return false;
    }

    if (!solanaConnection) {
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
      ConsoleHelper(
        `Invalid program id`,
        envProgramId,
        programIdl.metadata.address,
      );
      return false;
    }

    const program = new Program(
      programIdl as unknown as Idl,
      toPublicKey(programIdl.metadata.address),
      provider,
    );

    setIsReconcileProcessing(true);
    setReconcileStatusCode(ReconcileStatusCode.START);

    setReconcileStatusCode(ReconcileStatusCode.PROCESSING);
    const outcome = await getServerInfo();
    if (!outcome) {
      setError(ReconcileErrorCode.SERVER_INVALID);
      return false;
    }

    let xTokenAmountStr;
    let handle = '';
    let stakeAmount = 0;
    let startTime;
    let walletPublicKey: PublicKey;

    try {
      ConsoleHelper(`txId: ${txId}`);
      if (!txId) {
        ConsoleHelper(`getTransactionInfoOnSol: invalid txId`);
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      const txInfo = await getTransactionInfoOnSol(solanaConnection, txId);
      ConsoleHelper(`getTransactionInfoOnSol: txId: ${txId}`, txInfo);
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      const ret = parseTransaction(
        mode,
        txInfo,
        toPublicKey(programIdl.metadata.address),
      );
      ConsoleHelper(`parseTransaction: result: `, ret);
      if (!ret.success) {
        setError(ReconcileErrorCode.RECONCILE_FAILED);
        return false;
      }

      handle = ret.handle as string;
      stakeAmount = ret.amount as unknown as number;
      walletPublicKey = ret.wallet as unknown as PublicKey;
      const [userStakingPubkey] =
        await anchor.web3.PublicKey.findProgramAddress(
          [walletPublicKey.toBuffer(), handle] as Array<Buffer | Uint8Array>,
          program.programId,
        );

      const userStakingAccount = await program.account.userStakingAccount.fetch(
        userStakingPubkey,
      );
      xTokenAmountStr = userStakingAccount.xTokenAmount.toString();
      startTime = userStakingAccount.startTime.toString();
      ConsoleHelper(`parseTransaction: result: `, xTokenAmountStr, startTime);
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(ReconcileErrorCode.RECONCILE_FAILED);
      return false;
    }

    setReconcileStatusCode(ReconcileStatusCode.SUBMITTING);
    await submitStakeResult(
      mode,
      lockedKind,
      pubkeyToString(walletPublicKey),
      stakeAmount,
      txId,
      handle,
      xTokenAmountStr,
      startTime,
    );
    return true;
  };

  const reconcile = async (
    mode: StakeMode,
    lockedKind: StakeLockedPoolLength | null,
    txId: string,
  ) => {
    ConsoleHelper('stake -> start', mode, lockedKind, txId);
    await processReconcile(mode, lockedKind, txId);
  };

  return createReconcileStatus(
    reconcile,
    isReconcileProcessing,
    reconcileStatusCode,
    reconcileErrorCode,
    reconcileLastError,
  );
}

export default useStakeReconcile;
