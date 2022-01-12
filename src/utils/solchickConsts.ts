import { ChainId } from '../lib/consts';

export const SOLCHICK_TOKEN_MINT_ON_SOL = process.env
  .REACT_APP_SOLCHICK_TOKEN_MINT_ON_SOL as string;

export const SOLCHICK_TOKEN_CONTRACT_ON_BSC = process.env
  .REACT_APP_SOLCHICK_TOKEN_CONTRACT_ON_BSC as string;

export const SOLCHICK_TOKEN_CONTRACT_ON_ETH = process.env
  .REACT_APP_SOLCHICK_TOKEN_CONTRACT_ON_ETH as string;

export const SOLCHICK_DECIMALS_ON_SOL: number = parseInt(
  process.env.REACT_APP_SOLCHICK_DECIMALS as string,
  10,
);
export const SOLCHICK_DECIMALS_ON_ETH: number = parseInt(
  process.env.REACT_APP_SOLCHICK_DECIMALS as string,
  10,
);

const URL_VALIDATOR_BASE = process.env.REACT_APP_VALIDATOR_URL as string;

export const URL_VALIDATOR = (
  sChainId: ChainId,
  sAddress: string,
  tChainId: ChainId,
  tAddress: string,
  amount: string,
  hash: string,
  txId: string,
) => {
  const url = `${URL_VALIDATOR_BASE}/api/migrate`;
  return (
    `${url}?tchid=${tChainId}&taddr=${tAddress}&schid=${sChainId}&saddr=${sAddress}&amount=${amount}` +
    `&code=${hash}&txid=${txId}`
  );
};

export const URL_REDEEM = (sourceChainId: ChainId, sourceAddressId: string) => {
  const url = `${URL_VALIDATOR_BASE}/api/redeem`;
  return `${url}?schid=${sourceChainId}&txid=${sourceAddressId}`;
};

export const URL_SERVER_INFO = (
  sourceChainId: ChainId,
  targetChainId: ChainId,
) => {
  const url = `${URL_VALIDATOR_BASE}/api/status`;
  return `${url}?schid=${sourceChainId}&tchid=${targetChainId}`;
};
