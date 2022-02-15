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
  URL_SUBMIT_FLEX_UNSTAKE,
  URL_SUBMIT_LOCKED_STAKE,
  URL_SUBMIT_LOCKED_UNSTAKE,
} from '../utils/solchickConsts';
import {
  getTransactionInfoOnSol,
  pubkeyToString,
  toPublicKey,
} from '../utils/solanaHelper';
import { getSolChicksAssociatedAddress } from '../utils/solchickHelper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  createStakeStatus, getPoolHandle,
  getServerInfo,
  isEnoughTokenOnSolana,
  IStakeStatus,
  StakeErrorCode, StakeLockedKind,
  StakeMode,
  StakeStatusCode,
  StakeStepMode,
} from '../utils/stakeHelper';
import { sleep } from '../utils/helper';
import { useStakePool } from '../contexts/StakePoolContext';

function useStake(mode: StakeMode, tab: StakeStepMode, pool: StakeLockedKind | null = null): IStakeStatus {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceTxId, setSourceTxId] = useState('');
  const [currentMode, setCurrentMode] = useState<StakeMode>(StakeMode.FLEXIBLE);
  const [currentTab, setCurrentTab] = useState<StakeStepMode>(
    StakeStepMode.STAKE,
  );
  const [currentPool, setCurrentPool] = useState<StakeLockedKind | null>(null);
  const [statusCode, setStatusCode] = useState(StakeStatusCode.NONE);
  const [errorCode, setErrorCode] = useState(StakeErrorCode.NO_ERROR);
  const [lastError, setLastError] = useState('');
  const walletSolana = useSolanaWallet();

  const { refreshFlexiblePool, refreshLockedPool } = useStakePool();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  useEffect(() => {
    if (mode !== currentMode) {
      setCurrentMode(mode);
      setSourceTxId('');
      setStatusCode(StakeStatusCode.NONE);
    }
    if (tab !== currentTab) {
      setCurrentTab(tab);
      setSourceTxId('');
      setStatusCode(StakeStatusCode.NONE);
    }
    if (pool !== currentPool) {
      setCurrentPool(pool);
      setSourceTxId('');
      setStatusCode(StakeStatusCode.NONE);
    }
  }, [mode, currentMode, currentTab, tab, pool, currentPool]);

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

  const setError = (error: StakeErrorCode) => {
    ConsoleHelper('useStake setError', error);
    setStatusCode(StakeStatusCode.FAILED);
    setErrorCode(error);
    setIsProcessing(false);
  };

  function processStakeResult(
    url: string,
    txId: string,
    stakeStepMode: StakeStepMode,
  ) {
    ConsoleHelper(
      `${
        stakeStepMode === StakeStepMode.STAKE ? 'stake' : 'unstake'
      }Result: ${url}`,
    );
    setSourceTxId(txId);
    axios.get(url).then(
      (results) => {
        ConsoleHelper(`processStakeResult: ${JSON.stringify(results)}`);
        if (results.data.success) {
          setStatusCode(StakeStatusCode.SUCCESS);
          setIsProcessing(false);
          if (currentMode === StakeMode.FLEXIBLE) {
            refreshFlexiblePool();
          } else {
            refreshLockedPool();
          }
        } else {
          const errorMessage = results.data.error_message || 'Unknown error';
          setLastError(
            `${errorMessage} (Error code: ${results.data.error_code})`,
          );
          setError(StakeErrorCode.SUBMIT_FAILED);
        }
      },
      (error) => {
        ConsoleHelper(`processStakeResult: ${error}`);
        setLastError(`Unknown error`);
        setError(StakeErrorCode.SUBMIT_FAILED);
      },
    );
  }

  const submitStakeResult = async (
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
    processStakeResult(url, txId, StakeStepMode.STAKE);
  };

  const submitUnstakeResult = async (
    stakePool: StakeLockedKind | null,
    address: string,
    txId: string,
    handle: string,
    xAmount: string,
  ) => {
    const url =
      mode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_UNSTAKE(address, txId, handle, xAmount)
        : URL_SUBMIT_LOCKED_UNSTAKE(stakePool, address, txId, xAmount);
    processStakeResult(url, txId, StakeStepMode.UNSTAKE);
  };

  const processTokenOnSol = async (
    stakeStepMode: StakeStepMode,
    stakeAmount = 0,
    xAmount = '',
    handle = '',
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
    setStatusCode(StakeStatusCode.START);

    const associatedKey = await getSolChicksAssociatedAddress(walletPublicKey);
    ConsoleHelper(
      stakeStepMode === StakeStepMode.STAKE
        ? `stakeTokenOnSol -> associatedKey: ${pubkeyToString(associatedKey)}`
        : `unstakeTokenOnSol -> associatedKey: ${pubkeyToString(
            associatedKey,
          )}`,
    );

    let bnStakeAmount;
    if (stakeStepMode === StakeStepMode.STAKE) {
      setStatusCode(StakeStatusCode.TOKEN_AMOUNT_CHECKING);
      bnStakeAmount = new BN(
        parseUnits(stakeAmount.toString(), SOLCHICK_DECIMALS_ON_SOL).toString(),
      );

      const isEnough = await isEnoughTokenOnSolana(
        solanaConnection,
        walletPublicKey.toString(),
        bnStakeAmount.toString(),
      );
      if (!isEnough) {
        setError(StakeErrorCode.TOKEN_AMOUNT_NOT_ENOUGH);
        return false;
      }
    }

    setStatusCode(StakeStatusCode.PROCESSING);
    const outcome = await getServerInfo();
    if (!outcome) {
      setError(StakeErrorCode.SERVER_INVALID);
      return false;
    }

    const tokenMintPubkey = toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
    const poolHandle = getPoolHandle(pool);

    const [vaultPubkey, vaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mode === StakeMode.FLEXIBLE
          ? [tokenMintPubkey.toBuffer()]
          : [tokenMintPubkey.toBuffer(), poolHandle],
        program.programId,
      );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mode === StakeMode.FLEXIBLE
          ? [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))]
          : [Buffer.from(anchor.utils.bytes.utf8.encode('staking')), poolHandle],
        program.programId,
      );

    if (stakeStepMode === StakeStepMode.STAKE) {
      const hashString = `${new Date().getTime()}_${Math.random()}`;
      handle = Md5.init(hashString).toLowerCase();
    }

    // noinspection TypeScriptValidateJSTypes
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

    let xTokenAmountPrev: BigNumber;
    if (stakeStepMode === StakeStepMode.STAKE) {
      if (mode === StakeMode.LOCKED) {
        const userStakingAccountPrev =
          await program.account.userStakingAccount.fetch(userStakingPubkey);
        xTokenAmountPrev = BigNumber.from(
          userStakingAccountPrev.xTokenAmount.toString(),
        );
      }
    }

    let xTokenAmountStr;
    let xTokenAmount: BigNumber;

    const accounts = {
      accounts: {
        tokenMint: tokenMintPubkey,
        tokenFrom: associatedKey,
        tokenFromAuthority: walletPublicKey,
        tokenVault: vaultPubkey,
        stakingAccount: stakingPubkey,
        userStakingAccount: userStakingPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    };

    let txId;
    try {
      if (mode === StakeMode.FLEXIBLE) {
        txId =
          stakeStepMode === StakeStepMode.STAKE
            ? await program.rpc.stake(
                vaultBump,
                stakingBump,
                userStakingBump,
                handle,
                new anchor.BN(bnStakeAmount as unknown as BN),
                accounts as unknown as Context,
              )
            : await program.rpc.unstake(
                vaultBump,
                stakingBump,
                userStakingBump,
                handle,
                new anchor.BN(xAmount as unknown as BN),
                accounts as unknown as Context,
              );
      } else {
        txId =
          stakeStepMode === StakeStepMode.STAKE
            ? await program.rpc.stake(
                vaultBump,
                stakingBump,
                userStakingBump,
                poolHandle,
                handle,
                new anchor.BN(bnStakeAmount as unknown as BN),
                accounts as unknown as Context,
              )
            : await program.rpc.unstake(
              vaultBump,
              stakingBump,
              userStakingBump,
              poolHandle,
              handle,
              new anchor.BN(xAmount as unknown as BN),
              accounts as unknown as Context,
            );
      }

      ConsoleHelper(`txId: ${txId}`);
      if (!txId) {
        ConsoleHelper(`getTransactionInfoOnSol: invalid txId`);
        setError(StakeErrorCode.STAKE_FAILED);
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
        setError(StakeErrorCode.STAKE_FAILED);
        return false;
      }

      let userStakingAccount;
      if (stakeStepMode === StakeStepMode.STAKE) {
        userStakingAccount = await program.account.userStakingAccount.fetch(
          userStakingPubkey,
        );
        if (mode === StakeMode.LOCKED) {
          xTokenAmount = BigNumber.from(userStakingAccount.xTokenAmount);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          xTokenAmountStr = xTokenAmount.sub(xTokenAmountPrev).toString();
        } else {
          xTokenAmountStr = userStakingAccount.xTokenAmount.toString();
        }
      }
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(StakeErrorCode.STAKE_FAILED);
      return false;
    }

    setStatusCode(StakeStatusCode.SUBMITTING);
    if (stakeStepMode === StakeStepMode.STAKE) {
      await submitStakeResult(
        pool,
        pubkeyToString(walletPublicKey),
        stakeAmount,
        txId,
        handle,
        xTokenAmountStr,
      );
    } else {
      await submitUnstakeResult(
        pool,
        pubkeyToString(walletPublicKey),
        txId,
        handle,
        xAmount,
      );
    }
    return true;
  };

  const stake = async (stakeAmount: number) => {
    setSourceTxId('');
    ConsoleHelper('stake -> start');
    await processTokenOnSol(StakeStepMode.STAKE, stakeAmount, '', '');
  };

  const unstake = async (xAmount: string, handle = '') => {
    setSourceTxId('');
    ConsoleHelper('unstake -> start');
    await processTokenOnSol(StakeStepMode.UNSTAKE, 0, xAmount, handle);
  };

  return createStakeStatus(
    stake,
    unstake,
    isProcessing,
    statusCode,
    errorCode,
    lastError,
    sourceTxId,
  );
}

export default useStake;
