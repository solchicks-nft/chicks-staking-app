import web3 from 'web3';
import { Provider } from '@ethersproject/abstract-provider';
// import { formatUnits } from "@ethersproject/units";

import ERC721 from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json';
import ERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import SOLCHICK_ERC20 from '../artifacts/contracts/WChickToken.sol/WChickToken.json';

const ZERO_ADDRESS = '0x000000000000000000000000000000000000dead';
export { SOLCHICK_ERC20, ERC20, ERC721, ZERO_ADDRESS };

export const getBalanceEvm = async (
  walletAddress: string,
  provider: Provider,
) => provider.getBalance(walletAddress).then((result) => result.toBigInt());

export const isAddress = (address: string): boolean =>
  web3.utils.isAddress(address);
