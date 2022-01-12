import { Provider } from '@ethersproject/abstract-provider';
import web3 from 'web3';

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';

export const getBalanceEvm = async (
  walletAddress: string,
  provider: Provider,
) => provider.getBalance(walletAddress).then((result) => result.toBigInt());

export const isAddress = (address: string): boolean =>
  web3.utils.isAddress(address);
