
export const SOLCHICK_TOKEN_MINT_ON_SOL = process.env
  .REACT_APP_SOLCHICK_TOKEN_MINT_ON_SOL as string;

export const SOLCHICK_STAKING_FLEXIBLE = process.env
  .REACT_APP_SOLCHICK_STAKING_FLEXIBLE as string;

export const SOLCHICK_STAKING_LOCKED = process.env
  .REACT_APP_SOLCHICK_STAKING_LOCKED as string;

export const SOLCHICK_DECIMALS_ON_SOL = 9;
const URL_BACKEND_BASE = process.env.REACT_APP_BACKEND_URL as string;

const FLEXIBLE_PROGRAM_IDL =
  process.env.NODE_ENV === 'production' ?
    require('../idl/chicks_staking_flexible_prod.json') : require('../idl/chicks_staking_flexible_dev.json');

const LOCKED_PROGRAM_IDL =
  process.env.NODE_ENV === 'production' ?
    require('../idl/chicks_staking_locked_prod.json') : require('../idl/chicks_staking_locked_dev.json');

export const SOLCHICK_STAKING_FLEXIBLE_PROGRAM_IDL = FLEXIBLE_PROGRAM_IDL;
export const SOLCHICK_STAKING_LOCKED_PROGRAM_IDL = LOCKED_PROGRAM_IDL;

export enum SOLCHICK_BALANCE_TAB_STATE {
  STAKE = 1,
  UNSTAKE = 2,
}

export interface IStakeBalance {
  chicks: string,
  xChicks: string,
}

export const URL_SERVER_INFO = () => `${URL_BACKEND_BASE}/api/status`;

export const URL_SUBMIT_STAKE_FLEX = (address: string, amount: number, txId: string, handle: string, xTokenAmount: string) =>
  // eslint-disable-next-line max-len
  `${URL_BACKEND_BASE}/api/stake_flex/?address=${address}&amount=${amount}&tx_id=${txId}&handle=${handle}&x_token=${xTokenAmount}`;

export const URL_SUBMIT_UNSTAKE_FLEX = (address: string, amount: number, txId: string) =>
  `${URL_BACKEND_BASE}/api/unstake_flex/?address=${address}&amount=${amount}&tx_id=${txId}`;