
export const SOLCHICK_TOKEN_MINT_ON_SOL = process.env
  .REACT_APP_SOLCHICK_TOKEN_MINT_ON_SOL as string;

export const SOLCHICK_STAKING_PROGRAM = process.env
  .REACT_APP_SOLCHICK_STAKING_PROGRAM as string;

export const SOLCHICK_DECIMALS_ON_SOL = 9;
const URL_BACKEND_BASE = process.env.REACT_APP_BACKEND_URL as string;

const PROGRAM_IDL =
  process.env.NODE_ENV === 'production' ?
    require('../idl/chicks_staking_prod.json') : require('../idl/chicks_staking_dev.json');

export const SOLCHICK_STAKING_PROGRAM_IDL = PROGRAM_IDL;

export enum SOLCHICK_BALANCE_TAB_STATE {
  STAKE = 1,
  UNSTAKE = 2,
}

export interface IStakeBalance {
  chicks: number,
  xChicks: number,
}

export const URL_SERVER_INFO = () => `${URL_BACKEND_BASE}/api/status`;

export const URL_SUBMIT_STAKE = (address: string, amount: number, txId: string) =>
  `${URL_BACKEND_BASE}/api/stake/?address=${address}&amount=${amount}&tx_id=${txId}`;

export const URL_SUBMIT_UNSTAKE = (address: string, amount: number, txId: string) =>
  `${URL_BACKEND_BASE}/api/stake/?address=${address}&amount=${amount}&tx_id=${txId}`;