import { useMemo, useState } from 'react';
import axios from 'axios';
import BN from 'bn.js';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Idl, Program, Provider as AnchorProvider } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { parseUnits } from 'ethers/lib/utils';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Md5 } from 'md5-typescript';
import { BigNumber } from 'ethers';

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
import { getTransactionInfoOnSol, pubkeyToString, toPublicKey } from '../utils/solanaHelper';
import { getSolChicksAssociatedAddress } from '../utils/solchickHelper';
import { sleep } from '../utils/helper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  createStakeStatus,
  getServerInfo,
  isEnoughTokenOnSolana,
  IStakeStatus,
  StakeErrorCode,
  StakeMode,
  StakeStatusCode, StakeStepMode,
} from '../utils/stakeHelper';

function useStake(mode: StakeMode): IStakeStatus {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceTxId, setSourceTxId] = useState('');
  const [statusCode, setStatusCode] = useState(StakeStatusCode.NONE);
  const [errorCode, setErrorCode] = useState(StakeErrorCode.NO_ERROR);
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

  const setError = (error: StakeErrorCode) => {
    ConsoleHelper('useStake setError', error);
    setStatusCode(StakeStatusCode.FAILED);
    setErrorCode(error);
    setIsProcessing(false);
  };

  function processStakeResult(url: string, txId: string, stakeStepMode: StakeStepMode) {
    ConsoleHelper(`${stakeStepMode === StakeStepMode.STAKE ? 'stake' : 'unstake'}Result: ${url}`);
    setSourceTxId(txId);
    axios.get(url).then(
      (results) => {
        ConsoleHelper(`submitStakeResult: ${results}`);
        if (results.data.success) {
          setStatusCode(StakeStatusCode.SUCCESS);
          setIsProcessing(false);
        } else {
          const errorMessage = results.data.error_message || 'Unknown error';
          setLastError(
            `${errorMessage} (Error code: ${results.data.error_code})`,
          );
          setError(StakeErrorCode.SUBMIT_FAILED);
        }
      },
      (error) => {
        ConsoleHelper(`submitStakeResult: ${error}`);
        setLastError(`Unknown error`);
        setError(StakeErrorCode.SUBMIT_FAILED);
      },
    );
  }

  const submitStakeResult = async (
    address: string,
    amount: number,
    txId: string,
    handle: string,
    xTokenAmount: string,
  ) => {
    const url =
      mode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_STAKE(address, amount, txId, handle, xTokenAmount)
        : URL_SUBMIT_LOCKED_STAKE(address, amount, txId, xTokenAmount);
    processStakeResult(url, txId, StakeStepMode.STAKE);
  };

  const submitUnstakeResult = async (
    address: string,
    txId: string,
    handle: string,
    xAmount: string,
  ) => {
    const url =
      mode === StakeMode.FLEXIBLE
        ? URL_SUBMIT_FLEX_UNSTAKE(address, txId, handle, xAmount)
        : URL_SUBMIT_LOCKED_UNSTAKE(address, txId, xAmount);
    processStakeResult(url, txId, StakeStepMode.UNSTAKE);
  };

  const stakeTokenOnSol = async (stakeAmount: number) => {
    const { publicKey: walletPublicKey } = walletSolana;
    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const provider = await getAnchorProvider();
    if (!provider) {
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

    setStatusCode(StakeStatusCode.TOKEN_AMOUNT_CHECKING);
    const bnStakeAmount = new BN(
      parseUnits(stakeAmount.toString(), SOLCHICK_DECIMALS_ON_SOL).toString(),
    );

    const associatedKey = await getSolChicksAssociatedAddress(walletPublicKey);
    ConsoleHelper(
      `stakeTokenOnSol -> associatedKey: ${pubkeyToString(associatedKey)}`,
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

    setStatusCode(StakeStatusCode.PROCESSING);
    const ret = await getServerInfo();
    if (!ret) {
      setError(StakeErrorCode.SERVER_INVALID);
      return false;
    }

    const tokenMintPubkey = toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);

    const [vaultPubkey, vaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [tokenMintPubkey.toBuffer()],
        program.programId,
      );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
        program.programId,
      );

    const hashString = `${new Date().getTime()}_${Math.random()}`;
    const handle = Md5.init(hashString).toLowerCase();

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
    if (mode === StakeMode.LOCKED) {
      const userStakingAccountPrev =
        await program.account.userStakingAccount.fetch(userStakingPubkey);
      xTokenAmountPrev = BigNumber.from(
        userStakingAccountPrev.xTokenAmount.toString(),
      );
    }

    let txId = '';
    let userStakingAccount;
    let xTokenAmountStr = '';
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
    try {
      if (mode === StakeMode.FLEXIBLE) {
        txId = await program.rpc.stake(
          vaultBump,
          stakingBump,
          userStakingBump,
          handle,
          new anchor.BN(bnStakeAmount),
          accounts,
        );
      } else {
        txId = await program.rpc.stake(
          vaultBump,
          stakingBump,
          userStakingBump,
          new anchor.BN(bnStakeAmount),
          accounts,
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
      ConsoleHelper(`getTransactionInfoOnSol: txId: ${txId} - result`, txInfo);
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(StakeErrorCode.STAKE_FAILED);
        return false;
      }

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
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(StakeErrorCode.STAKE_FAILED);
      return false;
    }
    setStatusCode(StakeStatusCode.SUBMITTING);
    await sleep(5000);
    await submitStakeResult(
      pubkeyToString(walletPublicKey),
      stakeAmount,
      txId,
      handle,
      xTokenAmountStr,
    );
    return true;
  };

  const unstakeTokenOnSol = async (xAmount: string, handle: string) => {
    const { publicKey: walletPublicKey } = walletSolana;
    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const provider = await getAnchorProvider();
    if (!provider) {
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

    setStatusCode(StakeStatusCode.PROCESSING);
    const ret = await getServerInfo();
    if (!ret) {
      setError(StakeErrorCode.SERVER_INVALID);
      return false;
    }

    const associatedKey = await getSolChicksAssociatedAddress(walletPublicKey);
    ConsoleHelper(
      `stakeTokenOnSol -> associatedKey: ${pubkeyToString(associatedKey)}`,
    );

    const tokenMintPubkey = toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);

    const [vaultPubkey, vaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [tokenMintPubkey.toBuffer()],
        program.programId,
      );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
        program.programId,
      );

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

    let txId = '';
    const accounts = {
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
    try {
      if (mode === StakeMode.FLEXIBLE) {
        txId = await program.rpc.unstake(
          vaultBump,
          stakingBump,
          userStakingBump,
          handle,
          new anchor.BN(xAmount),
          accounts,
        );
      } else {
        txId = await program.rpc.unstake(
          vaultBump,
          stakingBump,
          userStakingBump,
          new anchor.BN(xAmount),
          accounts,
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
      ConsoleHelper(`getTransactionInfoOnSol: txId: ${txId} - result`, txInfo);
      if (!txInfo || !txInfo.meta || txInfo.meta.err) {
        setError(StakeErrorCode.STAKE_FAILED);
        return false;
      }
    } catch (e) {
      ConsoleHelper(`error: `, e);
      setError(StakeErrorCode.STAKE_FAILED);
      return false;
    }
    setStatusCode(StakeStatusCode.SUBMITTING);
    await sleep(5000);
    await submitUnstakeResult(
      pubkeyToString(walletPublicKey),
      txId,
      handle,
      xAmount,
    );
    return true;
  };

  const stake = async (amount: number) => {
    setSourceTxId('');
    ConsoleHelper('stake -- start');
    await stakeTokenOnSol(amount);
  };

  const unstake = async (amount: string, handle = '') => {
    setSourceTxId('');
    ConsoleHelper('unstake -- start');
    await unstakeTokenOnSol(amount, handle);
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
