import React from 'react';
import { useEthereumProvider } from '../contexts/EthereumProviderContext';
import ToggleConnectedButton from './ToggleConnectedButton';

const EthereumSignerKey = () => {
  const { connect, disconnect, signerAddress } = useEthereumProvider();
  return (
    <>
      <ToggleConnectedButton
        connect={connect}
        disconnect={disconnect}
        connected={!!signerAddress}
        pk={signerAddress || ''}
      />
    </>
  );
};

export default EthereumSignerKey;
