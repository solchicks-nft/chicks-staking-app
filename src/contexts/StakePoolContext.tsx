/* eslint-disable no-empty,@typescript-eslint/no-empty-function,camelcase,@typescript-eslint/no-explicit-any */
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
  URL_SUBMIT_LOCKED_LIST,
} from '../utils/solchickConsts';
import { useSolanaWallet } from './SolanaWalletContext';
import { SOLANA_HOST } from '../utils/consts';
import {
  getPoolHandle,
  StakeLockedPoolLength,
  StakeMode,
  STATUS_STAKED,
} from '../utils/stakeHelper';

interface IStakePoolContext {
  getBalance(): void;
  refreshLockedPool(): void;
  refreshFlexiblePool(): void;
  setStakeMode(mode: StakeMode): void;
  setLockedPoolLength(Length: StakeLockedPoolLength): void;
  tokenBalance: string;
  totalInfo: IStakeBalance | undefined;
  userInfo: IStakeBalance | undefined;
  stakeList: IStakeInfo[] | undefined;
}

const StackPoolContext = React.createContext<IStakePoolContext>({
  getBalance: () => {},
  refreshLockedPool: () => {},
  refreshFlexiblePool: () => {},
  setStakeMode: () => {},
  setLockedPoolLength: () => {},
  tokenBalance: '',
  totalInfo: undefined,
  userInfo: undefined,
  stakeList: undefined,
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
  const [currentStakeMode, setCurrentStakeMode] = useState<StakeMode | null>(
    StakeMode.FLEXIBLE,
  );
  const [currentLockedPoolLength, setCurrentLockedPoolLength] =
    useState<StakeLockedPoolLength | null>(null);
  const [totalInfo, setTotalInfo] = useState<IStakeBalance>();
  const [userInfo, setUserInfo] = useState<IStakeBalance>();
  const [stakeList, setStakeList] = useState<IStakeInfo[]>();

  const solanaConnection = useMemo(
    () => new Connection(SOLANA_HOST, 'confirmed'),
    [],
  );

  const { publicKey: walletPublicKey } = walletSolana;

  ConsoleHelper(
    `stakePoolContext -> currentStakeMode: ${currentStakeMode}, currentLockedPoolLength: ${currentLockedPoolLength}`,
  );
  ConsoleHelper(`stakePoolContext -> walletPublicKey: ${walletPublicKey}`);

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
    let walletTokenBalance = '';
    if (walletPublicKey) {
      const mintPubkey = new PublicKey(SOLCHICK_TOKEN_MINT_ON_SOL);
      const splBalance = await solanaConnection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          mint: mintPubkey,
        },
      );
      walletTokenBalance =
        splBalance.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
    }
    ConsoleHelper(`getBalance -> ${walletTokenBalance}`);
    setTokenBalance(walletTokenBalance);
  }, [solanaConnection, walletPublicKey]);

  const refreshPool = useCallback(
    async (
      stakeMode: StakeMode,
      poolLength: StakeLockedPoolLength | null = null,
    ) => {
      if (!solanaConnection) {
        return;
      }

      if (stakeMode === StakeMode.LOCKED && !poolLength) {
        return;
      }

      const provider = await getAnchorProvider();
      const programIdl =
        stakeMode === StakeMode.FLEXIBLE
          ? SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL
          : SOLCHICK_STAKING_LOCKED_PROGRAM_IDL;

      if (!provider) {
        return;
      }

      const program = new Program(
        programIdl as unknown as Idl,
        toPublicKey(programIdl.metadata.address),
        provider,
      );

      ConsoleHelper(`refreshPool -> program id`, program.programId.toString());

      const poolHandle = getPoolHandle(poolLength);

      const [stakingPubkey, stakingBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          stakeMode === StakeMode.FLEXIBLE
            ? [Buffer.from(anchor.utils.bytes.utf8.encode('staking'))]
            : ([
                Buffer.from(anchor.utils.bytes.utf8.encode('staking')),
                poolHandle,
              ] as Array<Buffer | Uint8Array>),
          program.programId,
        );

      ConsoleHelper(
        `refreshPool -> stakingPubkey: ${stakingPubkey.toString()}`,
      );
      ConsoleHelper(`refreshPool -> stakingBump: ${stakingBump}`);

      const [vaultPubkey, vaultBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          stakeMode === StakeMode.FLEXIBLE
            ? [tokenMintPubkey.toBuffer()]
            : ([tokenMintPubkey.toBuffer(), poolHandle] as Array<
                Buffer | Uint8Array
              >),
          program.programId,
        );
      ConsoleHelper(`refreshPool -> vaultPubkey: ${vaultPubkey.toString()}`);
      ConsoleHelper(`refreshPool -> vaultBump: ${vaultBump}`);

      try {
        const stakingAccount = await program.account.stakingAccount.fetch(
          stakingPubkey,
        );
        if (stakingAccount) {
          const totalXToken = toTokenBalanceString(stakingAccount.totalXToken);
          ConsoleHelper(`refreshPool -> totalXToken: ${totalXToken}`);

          const totalBalance = await getTokenBalance(
            solanaConnection,
            vaultPubkey,
          );
          if (totalBalance) {
            const totalToken = toTokenBalanceString(totalBalance);
            ConsoleHelper(`refreshPool -> totalToken: ${totalToken}`);
            setTotalInfo({
              chicksAmount: totalToken,
              xChicksAmount: totalXToken,
            });
          }
        }
      } catch (e) {
        ConsoleHelper(`refreshPool -> Failed to fetch staking account`);
      }

      if (walletPublicKey) {
        try {
          const url =
            stakeMode === StakeMode.FLEXIBLE
              ? URL_SUBMIT_FLEX_LIST(walletPublicKey.toString())
              : URL_SUBMIT_LOCKED_LIST(poolLength, walletPublicKey.toString());
          const results = await axios.get(url);
          ConsoleHelper(
            `refreshPool -> list: ${JSON.stringify(results.data.data)}`,
          );

          if (results.data.data) {
            let userTotalChicks = BigNumber.from(0);
            let userTotalXChicks = BigNumber.from(0);
            const list: IStakeInfo[] = [];
            results.data.data.forEach((item: any) => {
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
              list.push({
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
            ConsoleHelper(`stakeList`, list);
            ConsoleHelper(`userTotalChicks -> ${userTotalChicks}`);
            ConsoleHelper(
              `userTotalXChicks -> ${JSON.stringify(userTotalXChicks)}`,
            );
            setStakeList(list);
            setUserInfo({
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
        setUserInfo({ chicksAmount: '', xChicksAmount: '' });
      }
    },
    [getAnchorProvider, solanaConnection, tokenMintPubkey, walletPublicKey],
  );

  const refreshLockedPool = useCallback(async () => {
    ConsoleHelper(`refreshLockedPool -> start`);
    await refreshPool(StakeMode.LOCKED);
  }, [refreshPool]);

  const refreshFlexiblePool = useCallback(async () => {
    ConsoleHelper(`refreshFlexiblePool -> start`);
    await refreshPool(StakeMode.FLEXIBLE);
  }, [refreshPool]);

  const setLockedPoolLength = useCallback(
    async (StakeLockedPoolType: StakeLockedPoolLength) => {
      setCurrentLockedPoolLength(StakeLockedPoolType);
    },
    [setCurrentLockedPoolLength],
  );

  const setStakeMode = useCallback(
    async (mode: StakeMode) => {
      setCurrentStakeMode(mode);
      if (mode === StakeMode.LOCKED) {
        setCurrentLockedPoolLength(StakeLockedPoolLength.MONTH4);
      }
      refreshPool(mode, StakeLockedPoolLength.MONTH4).then();
    },
    [refreshPool],
  );

  useEffect(() => {
    if (!currentStakeMode) {
      return;
    }
    refreshPool(currentStakeMode, currentLockedPoolLength).then();
  }, [currentStakeMode, currentLockedPoolLength, walletPublicKey, refreshPool]);

  const contextValue = useMemo(
    () => ({
      getBalance,
      refreshLockedPool,
      refreshFlexiblePool,
      setStakeMode,
      setLockedPoolLength,
      tokenBalance,
      totalInfo,
      userInfo,
      stakeList,
    }),
    [
      getBalance,
      refreshLockedPool,
      refreshFlexiblePool,
      setStakeMode,
      setLockedPoolLength,
      tokenBalance,
      totalInfo,
      userInfo,
      stakeList,
    ],
  );
  return (
    <StackPoolContext.Provider value={contextValue}>
      {children}
    </StackPoolContext.Provider>
  );
};
export const useStakePool = () => useContext(StackPoolContext);
