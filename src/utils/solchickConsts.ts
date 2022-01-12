import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  ChainId,
} from '../lib/consts';

export const SOLCHICK_TOKEN_MINT_ON_SOL =
  'DWsBxBMpChPFK2M32qtPVAPTxcRGLEcNaJPTWHyHcHUn';
export const SOLCHICK_TOKEN_CONTRACT_ON_BSC =
  '0x0fFD8bD0C072AFbEECeD816273642969ebD6aA44';
export const SOLCHICK_TOKEN_CONTRACT_ON_ETH =
  '0xc8Da1Ab4a4D081D8A400A28736684C61564a03Bd';
export const SOLCHICK_DECIMALS_ON_SOL = 2;
export const SOLCHICK_DECIMALS_ON_ETH = 18;
const URL_VALIDATOR_BASE = 'http://localhost:8080';

export const URL_VALIDATOR = (
  sourceChainId: ChainId,
  targetChainId: ChainId,
  targetAddress: string,
  amount: number,
  txId: string,
) => {
  let url = `${URL_VALIDATOR_BASE}/api/validate/`;
  switch (sourceChainId) {
    case CHAIN_ID_SOLANA:
      url += 'solana';
      break;
    case CHAIN_ID_BSC:
      url += 'binance';
      break;
    case CHAIN_ID_ETH:
      url += 'binance';
      break;
    default:
      break;
  }
  return `${url}?chain_id=${targetChainId}&address=${targetAddress}&amount=${amount}&tx_id=${txId}`;
};
