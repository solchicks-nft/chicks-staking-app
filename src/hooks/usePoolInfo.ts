import {useEffect, useMemo, useState} from 'react';
import axios from 'axios';
import BN from 'bn.js';
import {
  Connection,
  ParsedAccountData,
  ConfirmOptions,
  Transaction, PublicKey,
} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {
  Idl,
  Program,
  Provider as AnchorProvider,
} from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { parseUnits } from 'ethers/lib/utils';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_HOST } from '../utils/consts';
import {
  IStakeBalance,
  SOLCHICK_DECIMALS_ON_SOL, SOLCHICK_STAKING_PROGRAM, SOLCHICK_STAKING_PROGRAM_IDL, SOLCHICK_TOKEN_MINT_ON_SOL,
  URL_SERVER_INFO,
  URL_SUBMIT_STAKE,
} from '../utils/solchickConsts';
import {getTokenBalance, getTransactionInfoOnSol, pubkeyToString, toPublicKey} from '../utils/solanaHelper';
import {getSolChicksAssociatedAddress, toTokenBalanceString} from '../utils/solchickHelper';
import { sleep } from '../utils/helper';
import ConsoleHelper from '../helpers/ConsoleHelper';

interface IPoolStatus {
  totalInfo?: IStakeBalance;
  myInfo?: IStakeBalance
}

const createPoolInfoStatus = (
  totalInfo?: IStakeBalance,
  myInfo?: IStakeBalance,
) => ({
  totalInfo,
  myInfo});

function usePoolInfo(): IPoolStatus {
  const walletSolana = useSolanaWallet();
  const [totalInfo, setTotalInfo] = useState<IStakeBalance>();
  const [myInfo, setMyInfo] = useState<IStakeBalance>();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  const { publicKey: walletPublicKey} = walletSolana;
  async function getAnchorProvider() {
    const opts = {
      preflightCommitment: 'confirmed',
    };

    return new AnchorProvider(
      solanaConnection,
      walletSolana as unknown as AnchorWallet,
      opts.preflightCommitment as unknown as ConfirmOptions,
    );
  }

  const tokenMintPubkey = useMemo( () => toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL), []);



  useEffect(() => {
    if (!solanaConnection) {
      return;
    }
    (async () => {
      const provider = await getAnchorProvider();
      const programIdl = SOLCHICK_STAKING_PROGRAM_IDL;
      if (!provider) {
        return;
      }
      const program = new Program(
        programIdl as unknown as Idl,
        toPublicKey(programIdl.metadata.address),
        provider,
      );

      const [stakingPubkey, stakingBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
          program.programId
        );
      const stakingAccount = await program.account.stakingAccount.fetch(
        stakingPubkey
      );

      const [vaultPubkey, vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
        [tokenMintPubkey.toBuffer()],
        program.programId
      );

      if (stakingAccount) {
        const totalXToken = toTokenBalanceString(stakingAccount.totalXToken);
        ConsoleHelper(`totalXToken: `, totalXToken);
      }

      const totalBalance = await getTokenBalance(solanaConnection, vaultPubkey);
      if (totalBalance) {
        const totalToken = toTokenBalanceString(totalBalance);
        ConsoleHelper(`totalToken: `, totalToken);
      }

      if (walletPublicKey) {
        try {
          const [userStakingPubkey, userStakingBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [walletPublicKey.toBuffer()],
              program.programId
            );
          const userStakingAccount = await program.account.userStakingAccount.fetch(
            userStakingPubkey
          );

          if (userStakingAccount) {
            ConsoleHelper(`userStakeToken: `, toTokenBalanceString(userStakingAccount.amount));
            ConsoleHelper(`userXToken: `, toTokenBalanceString(userStakingAccount.xTokenAmount));
          }
          ConsoleHelper(`userStakingAccount: `, userStakingAccount);
        } catch(e) {
          ConsoleHelper(`userStakingAccount: no yet`);
        }
      }
    })();

  }, [solanaConnection, walletPublicKey])


  return createPoolInfoStatus(totalInfo, myInfo);

}

export default usePoolInfo;
