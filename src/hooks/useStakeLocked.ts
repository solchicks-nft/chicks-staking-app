import {useMemo, useState} from 'react';
import axios from 'axios';
import BN from 'bn.js';
import {ConfirmOptions, Connection, ParsedAccountData,} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {Idl, Program, Provider as AnchorProvider} from '@project-serum/anchor';
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {parseUnits} from 'ethers/lib/utils';
import {AnchorWallet} from '@solana/wallet-adapter-react';
import {BigNumber} from "ethers";
import {useSolanaWallet} from '../contexts/SolanaWalletContext';
import {SOLANA_HOST} from '../utils/consts';
import {
  SOLCHICK_DECIMALS_ON_SOL,
  SOLCHICK_STAKING_LOCKED_PROGRAM_IDL,
  SOLCHICK_STAKING_LOCKED,
  SOLCHICK_TOKEN_MINT_ON_SOL,
  URL_SERVER_INFO,
  URL_SUBMIT_LOCKED_STAKE,
  URL_SUBMIT_LOCKED_UNSTAKE,
} from '../utils/solchickConsts';
import {getTransactionInfoOnSol, pubkeyToString, toPublicKey} from '../utils/solanaHelper';
import {getSolChicksAssociatedAddress} from '../utils/solchickHelper';
import {sleep} from '../utils/helper';
import ConsoleHelper from '../helpers/ConsoleHelper';

export enum StakeStatusCode {
  NONE = 0,
  START,
  TOKEN_AMOUNT_CHECKING,
  PROCESSING,
  SUBMITTING,
  SUCCESS,
  FAILED = 101,
}

export enum StakeErrorCode {
  NO_ERROR,
  CANT_CONNECT_SOLANA,
  TOKEN_AMOUNT_NOT_ENOUGH,
  STAKE_FAILED,
  SOLANA_NO_ASSOC_ACCOUNT,
  SERVER_INVALID,
  SUBMIT_FAILED,
}

interface IStakeStatus {
  stake(amount: number): void;
  unstake(handle: string, amount: string): void;
  isProcessing: boolean;
  statusCode: StakeStatusCode;
  errorCode: StakeErrorCode;
  lastError: string | null;
  sourceTxId: string;
}

const createStakeStatus = (
  stake: (amount: number) => void,
  unstake: (handle: string, amount: string) => void,
  isProcessing: boolean,
  statusCode = StakeStatusCode.NONE,
  errorCode: StakeErrorCode,
  lastError: string | null,
  sourceTxId: string,
) => ({
  stake,
  unstake,
  isProcessing,
  statusCode,
  errorCode,
  lastError,
  sourceTxId,
});

function useStakeLocked(): IStakeStatus {
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

  const getServerInfo = async () => {
    try {
      const result = await axios.get(URL_SERVER_INFO());
      if (result && result.data && result.data.success) {
        return true;
      }
    } catch (e) {
      ConsoleHelper(`getServerInfo: ${e}`);
    }
    return false;
  };

  const submitStakeResult = async (
    address: string,
    amount: number,
    txId: string,
    xTokenAmount: string
  ) => {
    const url = URL_SUBMIT_LOCKED_STAKE(address, amount, txId, xTokenAmount);
    ConsoleHelper(`submitStakeResult: ${url}`);
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
  };

  const submitUnstakeResult = async (
    address: string,
    txId: string,
    xAmount: string
  ) => {
    const url = URL_SUBMIT_LOCKED_UNSTAKE(address, txId, xAmount);
    ConsoleHelper(`submitStakeResult: ${url}`);
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
  };

  const isEnoughTokenOnSolana = async (address: string, amount: string) => {
    if (!solanaConnection) {
      return false;
    }
    const bnStakeAmount = new BN(amount);
    const associatedKey = await getSolChicksAssociatedAddress(address);
    ConsoleHelper(
      `isEnoughTokenOnSolana -> associatedKey: ${pubkeyToString(
        associatedKey,
      )}`,
    );
    let tokenAmount: BN = new BN(0);
    try {
      const parsedAccount = await solanaConnection.getParsedAccountInfo(
        associatedKey,
      );
      if (parsedAccount.value) {
        tokenAmount = new BN(
          (
            parsedAccount.value.data as ParsedAccountData
          ).parsed.info.tokenAmount.amount,
        );
        ConsoleHelper(`isEnoughTokenOnSolana -> parsedAccount`, parsedAccount);
        ConsoleHelper(
          `isEnoughTokenOnSolana -> tokenAmount`,
          tokenAmount.toString(),
        );
      }
    } catch (e) {
      ConsoleHelper(`isEnoughTokenOnSolana: ${e}`);
    }

    if (tokenAmount.cmp(bnStakeAmount) >= 0) {
    } else {
      return false;
    }
    return true;
  };

  const stakeTokenOnSol = async (stakeAmount: number) => {
    const { publicKey: walletPublicKey} = walletSolana;
    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const provider = await getAnchorProvider();
    if (!provider) {
      return false;
    }

    const programIdl = SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;

    if (programIdl.metadata.address !== SOLCHICK_STAKING_LOCKED) {
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

    const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [tokenMintPubkey.toBuffer()],
      program.programId
    );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
        program.programId
      );

    const [userStakingPubkey, userStakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [walletPublicKey.toBuffer()],
        program.programId
      );


    const userStakingAccountPrev = await program.account.userStakingAccount.fetch(
      userStakingPubkey
    );
    const xTokenAmountPrev = BigNumber.from(userStakingAccountPrev.xTokenAmount.toString());

    let txId = '';
    let userStakingAccount: any;
    let xTokenAmount:BigNumber;
    try {
      txId = await program.rpc.stake(
        vaultBump,
        stakingBump,
        userStakingBump,
        new anchor.BN(bnStakeAmount),
        {
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
        },
      );
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
        userStakingPubkey
      );
      xTokenAmount = BigNumber.from(userStakingAccount.xTokenAmount);

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
      xTokenAmount.sub(xTokenAmountPrev).toString()
    );
    return true;
  };

  const unstakeTokenOnSol = async (xAmount: string) => {
    const { publicKey: walletPublicKey} = walletSolana;
    if (!walletPublicKey || !solanaConnection) {
      return false;
    }

    const provider = await getAnchorProvider();
    if (!provider) {
      return false;
    }

    const programIdl = SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;

    if (programIdl.metadata.address !== SOLCHICK_STAKING_LOCKED) {
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

    const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
      [tokenMintPubkey.toBuffer()],
      program.programId
    );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
        program.programId
      );

    const [userStakingPubkey, userStakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [walletPublicKey.toBuffer()],
        program.programId
      );

    let txId = '';
    try {
      txId = await program.rpc.unstake(
        vaultBump,
        stakingBump,
        userStakingBump,
        new anchor.BN(xAmount),
        {
          accounts: {
            tokenMint: tokenMintPubkey,
            xTokenFromAuthority: walletPublicKey,
            tokenVault: vaultPubkey,
            stakingAccount: stakingPubkey,
            userStakingAccount: userStakingPubkey,
            tokenTo: associatedKey,
            tokenProgram: TOKEN_PROGRAM_ID
          },
        },
      );
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
      xAmount
    );
    return true;
  };

  const stake = async (amount: number) => {
    setSourceTxId('');
    ConsoleHelper('stake -- start');

    await stakeTokenOnSol(amount);
  };

  const unstake = async (amount: string) => {
    setSourceTxId('');
    ConsoleHelper('unstake -- start');

    await unstakeTokenOnSol(amount);
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

export default useStakeLocked;
