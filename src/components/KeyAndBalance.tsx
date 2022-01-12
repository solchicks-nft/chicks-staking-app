import React from 'react';
import { ChainId, CHAIN_ID_SOLANA } from '../lib/consts';
import { isEVMChain } from '../lib/array';
import EthereumSignerKey from './EthereumSignerKey';
import SolanaWalletKey from './SolanaWalletKey';

function KeyAndBalance({ chainId }: { chainId: ChainId }) {
  if (isEVMChain(chainId)) {
    return (
      <>
        <EthereumSignerKey />
      </>
    );
  }
  if (chainId === CHAIN_ID_SOLANA) {
    return (
      <>
        <SolanaWalletKey />
      </>
    );
  }
  return null;
}

export default KeyAndBalance;
