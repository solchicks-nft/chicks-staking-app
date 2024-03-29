import { StakeLockedPoolLength } from './stakeHelper';

export const SOLCHICK_TOKEN_MINT_ON_SOL = process.env
  .REACT_APP_SOLCHICK_TOKEN_MINT_ON_SOL as string;

export const SOLCHICK_STAKING_FLEXIBLE = process.env
  .REACT_APP_SOLCHICK_STAKING_FLEXIBLE as string;

export const SOLCHICK_STAKING_LOCKED = process.env
  .REACT_APP_SOLCHICK_STAKING_LOCKED as string;

export const SOLCHICK_DECIMALS_ON_SOL = 9;
const URL_BACKEND_BASE = process.env.REACT_APP_BACKEND_URL as string;

const FLEXIBLE_PROGRAM_IDL =
  process.env.REACT_APP_CLUSTER === 'mainnet'
    ? require('../idl/chicks_staking_flexible_prod.json')
    : require('../idl/chicks_staking_flexible_dev.json');

const LOCKED_PROGRAM_IDL =
  process.env.REACT_APP_CLUSTER === 'mainnet'
    ? require('../idl/chicks_staking_locked_prod.json')
    : require('../idl/chicks_staking_locked_dev.json');

export const SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL = FLEXIBLE_PROGRAM_IDL;
export const SOLCHICK_STAKING_LOCKED_PROGRAM_IDL = LOCKED_PROGRAM_IDL;

export interface IStakeBalance {
  chicksAmount: string;
  xChicksAmount: string;
}

export interface IStakeInfo {
  chicksAmount: string;
  xChicksAmount: string;
  stakeTxHash: string;
  unstakeTxHash: string;
  stakeStartDate: string;
  stakeClaimDate: string;
  stakeEndDate: string;
  rewardStartDate?: string;
  status?: string;
  handle: string;
}

export const URL_SERVER_INFO = () => `${URL_BACKEND_BASE}/api/status`;

export const URL_SUBMIT_FLEX_STAKE = (
  address: string,
  amount: number,
  txId: string,
  handle: string,
  xTokenAmount: string,
  startTime = '',
) =>
  // eslint-disable-next-line max-len
  `${URL_BACKEND_BASE}/api/flex_stake/?address=${address}&amount=${amount}&tx_id=${txId}&handle=${handle}&x_token=${xTokenAmount}&start_time=${startTime}`;

export const URL_SUBMIT_FLEX_UNSTAKE = (
  address: string,
  txId: string,
  handle: string,
  xAmount: string,
) =>
  `${URL_BACKEND_BASE}/api/flex_unstake/?address=${address}&tx_id=${txId}&handle=${handle}&x_token=${xAmount}`;

export const URL_SUBMIT_LOCKED_STAKE = (
  stakePool: StakeLockedPoolLength | null,
  address: string,
  amount: number,
  txId: string,
  handle: string,
  xTokenAmount: string,
  startTime = '',
) =>
  // eslint-disable-next-line max-len
  `${URL_BACKEND_BASE}/api/locked_stake/?pool=${stakePool}&address=${address}&amount=${amount}&tx_id=${txId}&handle=${handle}&x_token=${xTokenAmount}&start_time=${startTime}`;

export const URL_SUBMIT_LOCKED_UNSTAKE = (
  stakePool: StakeLockedPoolLength | null,
  address: string,
  txId: string,
  xAmount: string,
) =>
  `${URL_BACKEND_BASE}/api/locked_reward/?pool=${stakePool}&address=${address}&tx_id=${txId}&x_token=${xAmount}`;


export const URL_SUBMIT_LOCKED_REWARD = (
  stakePool: StakeLockedPoolLength | null,
  address: string,
  txId: string
) =>
  `${URL_BACKEND_BASE}/api/locked_unstake/?pool=${stakePool}&address=${address}&tx_id=${txId}`;

    
export const URL_SUBMIT_FLEX_LIST = (address: string) =>
  `${URL_BACKEND_BASE}/api/flex_list/?address=${address}`;

export const URL_SUBMIT_LOCKED_LIST = (
  stakePool: StakeLockedPoolLength | null,
  address: string,
) => `${URL_BACKEND_BASE}/api/locked_list/?pool=${stakePool}&address=${address}`;
