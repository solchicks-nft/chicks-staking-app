/* eslint-disable no-empty,@typescript-eslint/no-empty-function */
import React, {
  JSXElementConstructor,
  ReactChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {
  Idl,
  Program,
  Provider as AnchorProvider,
} from '@project-serum/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import axios from 'axios';
import { getTokenBalance, toPublicKey } from '../utils/solanaHelper';
import { toTokenBalanceString } from '../utils/solchickHelper';
import ConsoleHelper from '../utils/consoleHelper';
import {
  IStakeBalance,
  IStakeInfo,
  SOLCHICK_DECIMALS_ON_SOL,
  SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL,
  SOLCHICK_STAKING_LOCKED_PROGRAM_IDL,
  SOLCHICK_TOKEN_MINT_ON_SOL,
  URL_SUBMIT_FLEX_LIST,
} from '../utils/solchickConsts';
import { useSolanaWallet } from './SolanaWalletContext';
import { SOLANA_HOST } from '../utils/consts';
import { STATUS_STAKED } from '../utils/stakeHelper';

interface IStakePoolContext {
  getBalance(): void;
  refreshLockedPool(): void;
  refreshFlexiblePool(): void;
  tokenBalance: string;
  lockedTotalInfo: IStakeBalance | undefined;
  lockedUserInfo: IStakeBalance | undefined;
  flexibleTotalInfo: IStakeBalance | undefined;
  flexibleUserInfo: IStakeBalance | undefined;
  flexibleStakeList: IStakeInfo[] | undefined;
}

const StackPoolContext = React.createContext<IStakePoolContext>({
  getBalance: () => {},
  refreshLockedPool: () => {},
  refreshFlexiblePool: () => {},
  tokenBalance: '',
  lockedTotalInfo: undefined,
  lockedUserInfo: undefined,
  flexibleTotalInfo: undefined,
  flexibleUserInfo: undefined,
  flexibleStakeList: undefined,
});
export const StakePoolProvider = ({
  children,
}: {
  children: ReactElement<
    ReactChildren,
    string | JSXElementConstructor<unknown>
  >;
}) => {
  const walletSolana = useSolanaWallet();
  const [tokenBalance, setTokenBalance] = useState('');
  const [lockedTotalInfo, setLockedTotalInfo] = useState<IStakeBalance>();
  const [lockedUserInfo, setLockedUserInfo] = useState<IStakeBalance>();
  const [flexibleTotalInfo, setFlexibleTotalInfo] = useState<IStakeBalance>();
  const [flexibleUserInfo, setFlexibleUserInfo] = useState<IStakeBalance>();
  const [flexibleStakeList, setFlexibleStakeList] = useState<IStakeInfo[]>();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  const { publicKey: walletPublicKey } = walletSolana;

  const getAnchorProvider = useCallback(async () => {
    const opts = {
      preflightCommitment: 'confirmed',
    };

    return new AnchorProvider(
      solanaConnection,
      walletSolana as unknown as AnchorWallet,
      opts.preflightCommitment as unknown as ConfirmOptions,
    );
  }, [solanaConnection, walletSolana]);

  const tokenMintPubkey = useMemo(
    () => toPublicKey(SOLCHICK_TOKEN_MINT_ON_SOL),
    [],
  );

  const getBalance = useCallback(async () => {
    let returnVal = '';
    if (walletPublicKey) {
      const mintPubkey = new PublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
      const splBalance = await solanaConnection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          mint: mintPubkey,
        },
      );

      returnVal =
        splBalance.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
    }

    ConsoleHelper(returnVal);
    setTokenBalance(returnVal);
  }, [solanaConnection, walletPublicKey]);

  const refreshLockedPool = useCallback(async () => {
    if (!solanaConnection) {
      return;
    }
    const provider = await getAnchorProvider();
    const programIdl = SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;
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
        program.programId,
      );
    ConsoleHelper(
      `refreshLockedPool -> stakingPubkey: ${stakingPubkey.toString()}`,
    );
    ConsoleHelper(`refreshLockedPool -> stakingBump: ${stakingBump}`);
    try {
      const stakingAccount = await program.account.stakingAccount.fetch(
        stakingPubkey,
      );

      const [vaultPubkey, vaultBump] =
          await anchor.web3.PublicKey.findProgramAddress(
              [tokenMintPubkey.toBuffer()],
              program.programId,
          );
      ConsoleHelper(
          `refreshLockedPool -> vaultPubkey: ${vaultPubkey.toString()}`,
      );
      ConsoleHelper(`refreshLockedPool -> vaultBump: ${vaultBump}`);

      if (stakingAccount) {
        const totalXToken = toTokenBalanceString(stakingAccount.totalXToken);
        ConsoleHelper(`refreshLockedPool -> totalXToken: ${totalXToken}`);

        const totalBalance = await getTokenBalance(solanaConnection, vaultPubkey);
        if (totalBalance) {
          const totalToken = toTokenBalanceString(totalBalance);
          ConsoleHelper(`refreshLockedPool -> totalToken: ${totalToken}`);
          setLockedTotalInfo({
            chicksAmount: totalToken,
            xChicksAmount: totalXToken,
          });
        }
      }
    } catch (e) {
      ConsoleHelper(`refreshLockedPool -> error: `, e);
    }

    if (walletPublicKey) {
      try {
        const [userStakingPubkey, userStakingBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [walletPublicKey.toBuffer()],
            program.programId,
          );
        const userStakingAccount =
          await program.account.userStakingAccount.fetch(userStakingPubkey);
        ConsoleHelper(
          `refreshLockedPool -> userStakingPubkey: ${userStakingPubkey}`,
        );
        ConsoleHelper(
          `refreshLockedPool -> userStakingBump: ${userStakingBump}`,
        );

        if (userStakingAccount) {
          const userTokenAmount = toTokenBalanceString(
            userStakingAccount.amount,
          );
          const userXTokenAmount = toTokenBalanceString(
            userStakingAccount.xTokenAmount,
          );
          ConsoleHelper(
            `refreshLockedPool -> userTokenAmount: ${userTokenAmount}`,
          );
          setLockedUserInfo({
            chicksAmount: userTokenAmount,
            xChicksAmount: userXTokenAmount,
          });
        }
        ConsoleHelper(
          `refreshLockedPool -> userStakingAccount: ${userStakingAccount}`,
        );
      } catch (e) {
        ConsoleHelper(`refreshLockedPool -> error: ${JSON.stringify(e)}`);
      }
    } else {
      setLockedUserInfo({ chicksAmount: '', xChicksAmount: '' });
    }
  }, [getAnchorProvider, solanaConnection, tokenMintPubkey, walletPublicKey]);

  const refreshFlexiblePool = useCallback(async () => {
    ConsoleHelper(
        `refreshFlexiblePool -> start`,
    );
    if (!solanaConnection) {
      return;
    }
    const provider = await getAnchorProvider();
    const programIdl = SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL;
    if (!provider) {
      return;
    }
    const program = new Program(
      programIdl as unknown as Idl,
      toPublicKey(programIdl.metadata.address),
      provider,
    );

    ConsoleHelper(
        `refreshFlexiblePool -> program id`,
        program.programId.toString()
    );

    const [stakingPubkey, stakingBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))],
        program.programId,
      );
    const stakingAccount = await program.account.stakingAccount.fetch(
      stakingPubkey,
    );
    ConsoleHelper(
      `refreshFlexiblePool -> stakingPubkey: ${stakingPubkey.toString()}`,
    );
    ConsoleHelper(`refreshFlexiblePool -> stakingBump: ${stakingBump}`);

    const [vaultPubkey, vaultBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [tokenMintPubkey.toBuffer()],
        program.programId,
      );
    ConsoleHelper(
      `refreshFlexiblePool -> vaultPubkey: ${vaultPubkey.toString()}`,
    );
    ConsoleHelper(`refreshFlexiblePool -> vaultBump: ${vaultBump}`);

    if (stakingAccount) {
      const totalXToken = toTokenBalanceString(stakingAccount.totalXToken);
      ConsoleHelper(`refreshFlexiblePool -> totalXToken: ${totalXToken}`);

      const totalBalance = await getTokenBalance(solanaConnection, vaultPubkey);
      if (totalBalance) {
        const totalToken = toTokenBalanceString(totalBalance);
        ConsoleHelper(`refreshFlexiblePool -> totalToken: ${totalToken}`);
        setFlexibleTotalInfo({
          chicksAmount: totalToken,
          xChicksAmount: totalXToken,
        });
      }
    }

    if (walletPublicKey) {
      try {
        const url = URL_SUBMIT_FLEX_LIST(walletPublicKey.toString());
        const results = await axios.get(url);
        ConsoleHelper(
          `refreshFlexiblePool -> flexList: ${JSON.stringify(
            results.data.data,
          )}`,
        );

        if (results.data.data) {
          let userTotalChicks = BigNumber.from(0);
          let userTotalXChicks = BigNumber.from(0);
          const stakeList: IStakeInfo[] = [];
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          results.data.data.forEach((item) => {
            const amount = parseUnits(
              item.amount.toString(),
              SOLCHICK_DECIMALS_ON_SOL,
            );
            if (item.status === STATUS_STAKED) {
              userTotalChicks = userTotalChicks.add(amount);
              userTotalXChicks = userTotalXChicks.add(
                BigNumber.from(item.x_token),
              );
            }
            stakeList.push({
              chicksAmount: amount.toString(),
              xChicksAmount: item.x_token,
              handle: item.handle,
              stakeTxHash: item.stake_tx_hash,
              unstakeTxHash: item.unstake_tx_hash,
              stakeStartDate: item.stake_start_date,
              stakeClaimDate: item.stake_claim_date,
              stakeEndDate: item.stake_end_date,
            });
          });
          ConsoleHelper(`stakeList -> ${JSON.stringify(stakeList)}`);
          ConsoleHelper(`userTotalChicks -> ${userTotalChicks}`);
          ConsoleHelper(
            `userTotalXChicks -> ${JSON.stringify(userTotalXChicks)}`,
          );
          setFlexibleStakeList(stakeList);
          setFlexibleUserInfo({
            chicksAmount: (
              Math.round(userTotalChicks.toNumber()) / 1000000000
            ).toFixed(1),
            xChicksAmount: (
              Math.round(userTotalXChicks.toNumber()) / 1000000000
            ).toFixed(1),
          });
        }
      } catch (e) {
        ConsoleHelper(`refreshFlexiblePool -> error: ${JSON.stringify(e)}`);
      }
    } else {
      setFlexibleUserInfo({ chicksAmount: '', xChicksAmount: '' });
    }
  }, [getAnchorProvider, solanaConnection, tokenMintPubkey, walletPublicKey]);

  useEffect(() => {
    refreshLockedPool().then();
    refreshFlexiblePool().then();
  }, [
    refreshFlexiblePool,
    refreshLockedPool,
    solanaConnection,
    walletPublicKey,
  ]);

  const contextValue = useMemo(
    () => ({
      getBalance,
      refreshLockedPool,
      refreshFlexiblePool,
      tokenBalance,
      lockedTotalInfo,
      lockedUserInfo,
      flexibleTotalInfo,
      flexibleUserInfo,
      flexibleStakeList,
    }),
    [
      getBalance,
      refreshLockedPool,
      refreshFlexiblePool,
      tokenBalance,
      lockedTotalInfo,
      lockedUserInfo,
      flexibleTotalInfo,
      flexibleUserInfo,
      flexibleStakeList,
    ],
  );
  return (
    <StackPoolContext.Provider value={contextValue}>
      {children}
    </StackPoolContext.Provider>
  );
};
export const useStakePool = () => useContext(StackPoolContext);
