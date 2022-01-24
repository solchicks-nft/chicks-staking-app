/* eslint-disable no-empty,@typescript-eslint/no-empty-function */
import React, {
  JSXElementConstructor,
  ReactChildren,
  ReactElement,
  useCallback,
  useContext, useEffect,
  useMemo,
  useState,
} from 'react';
import {ConfirmOptions, Connection} from "@solana/web3.js";
import {Idl, Program, Provider as AnchorProvider} from "@project-serum/anchor";
import {AnchorWallet} from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import {getTokenBalance, toPublicKey} from "../utils/solanaHelper";
import {toTokenBalanceString} from "../utils/solchickHelper";
import ConsoleHelper from "../helpers/ConsoleHelper";
import {IStakeBalance, SOLCHICK_STAKING_PROGRAM_IDL, SOLCHICK_TOKEN_MINT_ON_SOL} from "../utils/solchickConsts";
import {useSolanaWallet} from "./SolanaWalletContext";
import {SOLANA_HOST} from "../utils/consts";

interface IStakePoolContext {
  refresh(): void;

  totalInfo: IStakeBalance | undefined;
  userInfo: IStakeBalance | undefined;
}

const StackPoolContext = React.createContext<IStakePoolContext>({
  refresh: () => {
  },
  totalInfo: undefined,
  userInfo: undefined
});
export const StakePoolProvider = ({
                                    children,
                                  }: {
  children: ReactElement<ReactChildren,
    string | JSXElementConstructor<unknown>>;
}) => {
  const walletSolana = useSolanaWallet();
  const [totalInfo, setTotalInfo] = useState<IStakeBalance>();
  const [userInfo, setUserInfo] = useState<IStakeBalance>();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  const {publicKey: walletPublicKey} = walletSolana;

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

  const tokenMintPubkey = useMemo(() => toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL), []);

  const refresh = async () => {
    if (!solanaConnection) {
      return;
    }
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

      const totalBalance = await getTokenBalance(solanaConnection, vaultPubkey);
      if (totalBalance) {
        const totalToken = toTokenBalanceString(totalBalance);
        ConsoleHelper(`totalToken: `, totalToken);
        setTotalInfo({chicks: totalToken, xChicks: totalXToken});
      }
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
          const userTokenAmount = toTokenBalanceString(userStakingAccount.amount);
          const userXTokenAmount = toTokenBalanceString(userStakingAccount.xTokenAmount);
          ConsoleHelper(`userStakeToken: `, userTokenAmount);
          ConsoleHelper(`userXToken: `,);
          setUserInfo({chicks: userTokenAmount, xChicks: userXTokenAmount});
        }
        ConsoleHelper(`userStakingAccount: `, userStakingAccount);
      } catch (e) {
        ConsoleHelper(`userStakingAccount: no yet`);
      }
    } else {
      setUserInfo({chicks: '', xChicks: ''});
    }
  }

  useEffect(() => {
    refresh();
  }, [solanaConnection, walletPublicKey])

  const contextValue = useMemo(
    () => ({
      refresh,
      totalInfo,
      userInfo
    }),
    [
      refresh,
      totalInfo,
      userInfo
    ],
  );
  return (
    <StackPoolContext.Provider value={contextValue}>
      {children}
    </StackPoolContext.Provider>
  );
};
export const useStakePool = () => useContext(StackPoolContext);
