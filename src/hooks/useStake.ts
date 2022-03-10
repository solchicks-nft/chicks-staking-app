import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BN from 'bn.js';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Context, Idl, Program, Provider as AnchorProvider } from '@project-serum/anchor';
import { parseUnits } from 'ethers/lib/utils';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Md5 } from 'md5-typescript';
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
  URL_SUBMIT_LOCKED_REWARD,
} from '../utils/solchickConsts';
import { getTransactionInfoOnSol, pubkeyToString, toPublicKey } from '../utils/solanaHelper';
import { getSolChicksAssociatedAddress } from '../utils/solchickHelper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  createStakeStatus,
  getPoolHandle,
  getServerInfo,
  isEnoughTokenOnSolana,
  IStakeStatus,
  StakeErrorCode,
  StakeLockedPoolLength,
  StakeMode,
  StakeStatusCode,
  StakeStepMode,
} from '../utils/stakeHelper';
import { sleep } from '../utils/helper';
import { useStakePool } from '../contexts/StakePoolContext';

function useStake(
  stakeMode: StakeMode,
  selectedTab: StakeStepMode,
  lockedPoolLength: StakeLockedPoolLength | null = null,
): IStakeStatus {
  const [isStakeProcessing, setIsStakeProcessing] = useState(false);
  const [sourceTxId, setSourceTxId] = useState('');
  const [currentMode, setCurrentMode] = useState<StakeMode>(StakeMode.FLEXIBLE);
  const [currentTab, setCurrentTab] = useState<StakeStepMode>(StakeStepMode.STAKE);
  const [currentPool, setCurrentPool] = useState<StakeLockedPoolLength | null>(null);
  const [stakeStatusCode, setStakeStatusCode] = useState(StakeStatusCode.NONE);
  const [stakeErrorCode, setStakeErrorCode] = useState(StakeErrorCode.NO_ERROR);
  const [stakeLastError, setStakeLastError] = useState('');
  const walletSolana = useSolanaWallet();

  const { refreshFlexiblePool, refreshLockedPool } = useStakePool();

  const solanaConnection = useMemo(() => new Connection(SOLANA_HOST, 'confirmed'), []);

  useEffect(() => {
    if (stakeMode !== currentMode) {
      setCurrentMode(stakeMode);
      setSourceTxId('');
      setStakeStatusCode(StakeStatusCode.NONE);
    }
    if (selectedTab !== currentTab) {
      setCurrentTab(selectedTab);
      setSourceTxId('');
      setStakeStatusCode(StakeStatusCode.NONE);
    }
    if (lockedPoolLength !== currentPool) {
      setCurrentPool(lockedPoolLength);
      setSourceTxId('');
      setStakeStatusCode(StakeStatusCode.NONE);
    }
  }, [stakeMode, currentMode, currentTab, selectedTab, lockedPoolLength, currentPool]);

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
    ConsoleHelper(`setError: ${error}`);
    setStakeStatusCode(StakeStatusCode.FAILED);
    setStakeErrorCode(error);
    setIsStakeProcessing(false);
  };

  function processStakeResult(url: string, txId: string, stakeStepMode: StakeStepMode) {
    ConsoleHelper(`${stakeStepMode === StakeStepMode.STAKE ? 'stake' : 'unstake'}Result: ${url}`);
    setSourceTxId(txId);
    axios.get(url).then(
      (results) => {
        ConsoleHelper(`processStakeResult: ${JSON.stringify(results)}`);
        if (results.data.success) {
          setStakeStatusCode(StakeStatusCode.SUCCESS);
          setIsStakeProcessing(false);
          if (currentMode === StakeMode.FLEXIBLE) {
            refreshFlexiblePool();
          } else {
            refreshLockedPool();
          }
        } else {
          const errorMessage = results.data.error_message || 'Unknown error';
          setStakeLastError(`${errorMessage} (Error code: ${results.data.error_code})`);
          setError(StakeErrorCode.SUBMIT_FAILED);
        }
      },
      (error) => {
        ConsoleHelper(`processStakeResult: ${error}`);
        setStakeLastError(`Unknown error`);
        setError(StakeErrorCode.SUBMIT_FAILED);
      },
    );
  }

  const submitStakeResult = async (
    stakePool: StakeLockedPoolLength | null,
    address: string,
    amount: number,
    txId: string,
    handle: string,
    xTokenAmount: string,
  ) => {
    const url =
      stakeMode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_STAKE(address, amount, txId, handle, xTokenAmount)
        : URL_SUBMIT_LOCKED_STAKE(stakePool, address, amount, txId, handle, xTokenAmount);
    processStakeResult(url, txId, StakeStepMode.STAKE);
  };

  const submitUnstakeResult = async (
    stakePool: StakeLockedPoolLength | null,
    address: string,
    txId: string,
    handle: string,
    xAmount: string,
  ) => {
    const url =
      stakeMode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_UNSTAKE(address, txId, handle, xAmount)
        : URL_SUBMIT_LOCKED_UNSTAKE(stakePool, address, txId, xAmount);
    processStakeResult(url, txId, StakeStepMode.UNSTAKE);
  };

  const submitRewardResult = async (stakePool: StakeLockedPoolLength | null, address: string, txId: string) => {
    const url = URL_SUBMIT_LOCKED_REWARD(stakePool, address, txId);
    processStakeResult(url, txId, StakeStepMode.REWARD);
  };

  const processTokenOnSol = async (stakeStepMode: StakeStepMode, stakeAmount = 0, xAmount = '', handle = '') => {
    // noinspection DuplicatedCode
    const { publicKey: walletPublicKey } = walletSolana;

    const provider = await getAnchorProvider();
    if (!provider) {
      return false;
    }

    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const programIdl =
      stakeMode === StakeMode.FLEXIBLE ? SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL : SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;

    const envProgramId = stakeMode === StakeMode.FLEXIBLE ? SOLCHICK_STAKING_FLEXIBLE : SOLCHICK_STAKING_LOCKED;

    if (programIdl.metadata.address !== envProgramId) {
      ConsoleHelper(`Invalid program id`);
      return false;
    }

    const program = new Program(programIdl as unknown as Idl, toPublicKey(programIdl.metadata.address), provider);

    setIsStakeProcessing(true);
    setStakeStatusCode(StakeStatusCode.START);

    const associatedKey = await getSolChicksAssociatedAddress(walletPublicKey);
    ConsoleHelper(
      stakeStepMode === StakeStepMode.STAKE
        ? `stakeTokenOnSol -> associatedKey: ${pubkeyToString(associatedKey)}`
        : `unstakeTokenOnSol -> associatedKey: ${pubkeyToString(associatedKey)}`,
    );

    let bnStakeAmount;
    if (stakeStepMode === StakeStepMode.STAKE) {
      setStakeStatusCode(StakeStatusCode.TOKEN_AMOUNT_CHECKING);
      bnStakeAmount = new BN(parseUnits(stakeAmount.toString(), SOLCHICK_DECIMALS_ON_SOL).toString());

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

    setStakeStatusCode(StakeStatusCode.PROCESSING);
    const outcome = await getServerInfo();
    if (!outcome) {
      setError(StakeErrorCode.SERVER_INVALID);
      return false;
    }

    const tokenMintPubkey = toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
    const poolHandle = getPoolHandle(lockedPoolLength);

    const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      stakeMode === StakeMode.FLEXIBLE
        ? [tokenMintPubkey.toBuffer()]
        : ([tokenMintPubkey.toBuffer(), poolHandle] as Array<Buffer | Uint8Array>),
      program.programId,
    );

    const [stakingPubkey, stakingBump] = await anchor.web3.PublicKey.findProgramAddress(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      stakeMode === StakeMode.FLEXIBLE
        ? [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))]
        : ([Buffer.from(anchor.utils.bytes.utf8.encode('staking')), poolHandle] as Array<Buffer | Uint8Array>),
      program.programId,
    );

    if (stakeStepMode === StakeStepMode.STAKE) {
      const hashString = `${new Date().getTime()}_${Math.random()}`;
      handle = Md5.init(hashString).toLowerCase();
    }

    // noinspection TypeScriptValidateJSTypes
    const [userStakingPubkey, userStakingBump] = await anchor.web3.PublicKey.findProgramAddress(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [walletPublicKey.toBuffer(), handle],
      program.programId,
    );

    let xTokenAmountStr;

    const accounts =
      stakeStepMode === StakeStepMode.STAKE
        ? {
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
          }
        : {
            accounts: {
              tokenMint: tokenMintPubkey,
              xTokenFromAuthority: walletPublicKey,
              tokenVault: vaultPubkey,
              stakingAccount: stakingPubkey,
              userStakingAccount: userStakingPubkey,
              tokenTo: associatedKey,
              tokenProgram: TOKEN_PROGRAM_ID,
            },
          };

    let txId;
    try {
      if (stakeMode === StakeMode.FLEXIBLE) {
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
        switch (stakeStepMode) {
          case StakeStepMode.STAKE:
            txId = await program.rpc.stake(
              vaultBump,
              stakingBump,
              userStakingBump,
              poolHandle,
              handle,
              new anchor.BN(bnStakeAmount as unknown as BN),
              accounts as unknown as Context,
            );
            break;
          case StakeStepMode.UNSTAKE:
            txId = await program.rpc.unstake(
              vaultBump,
              stakingBump,
              userStakingBump,
              poolHandle,
              handle,
              new anchor.BN(amount as unknown as BN),
              new anchor.BN(xAmount as unknown as BN),
              accounts as unknown as Context,
            );
            break;
          case StakeStepMode.REWARD:
            txId = await program.rpc.reward(
              vaultBump,
              stakingBump,
              userStakingBump,
              poolHandle,
              handle,
              accounts as unknown as Context,
            );
            break;
        }
      }
      ConsoleHelper(`txId: ${txId}`);
      if (!txId) {
        ConsoleHelper(`getTransactionInfoOnSol: invalid txId`);
        setError(StakeErrorCode.STAKE_FAILED);
        return false;
      }

      await sleep(5000);
      const txInfo = await getTransactionInfoOnSol(solanaConnection, txId);
      ConsoleHelper(`getTransactionInfoOnSol: txId: ${txId} - result ${JSON.stringify(txInfo)}`);
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(StakeErrorCode.STAKE_FAILED);
        return false;
      }

      let userStakingAccount;
      if (stakeStepMode === StakeStepMode.STAKE) {
        userStakingAccount = await program.account.userStakingAccount.fetch(userStakingPubkey);
        xTokenAmountStr = userStakingAccount.xTokenAmount.toString();
      }
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(StakeErrorCode.STAKE_FAILED);
      return false;
    }

    setStakeStatusCode(StakeStatusCode.SUBMITTING);
    if (stakeStepMode === StakeStepMode.STAKE) {
      await submitStakeResult(
        lockedPoolLength,
        pubkeyToString(walletPublicKey),
        stakeAmount,
        txId,
        handle,
        xTokenAmountStr,
      );
    } else if (stakeStepMode === StakeStepMode.UNSTAKE) {
      await submitUnstakeResult(lockedPoolLength, pubkeyToString(walletPublicKey), txId, handle, xAmount);
    } else {
      await submitRewardResult(lockedPoolLength, pubkeyToString(walletPublicKey), txId);
    }
    return true;
  };

  const stake = async (stakeAmount: number) => {
    setSourceTxId('');
    ConsoleHelper('stake -> start');
    await processTokenOnSol(StakeStepMode.STAKE, stakeAmount, '', '');
  };

  const unstake = async (amount: number, xAmount: string, handle = '') => {
    setSourceTxId('');
    ConsoleHelper('unstake -> start');
    await processTokenOnSol(StakeStepMode.UNSTAKE, amount, xAmount, handle);
  };

  const reward = async (handle = '') => {
    setSourceTxId('');
    ConsoleHelper('reward -> start');
    await processTokenOnSol(StakeStepMode.REWARD, 0, '', handle);
  };

  return createStakeStatus(
    stake,
    unstake,
    reward,
    isStakeProcessing,
    stakeStatusCode,
    stakeErrorCode,
    stakeLastError,
    sourceTxId,
  );
}

export default useStake;
