/* eslint-disable no-empty */
import { hexlify, hexStripZeros } from '@ethersproject/bytes';
import { useCallback, useMemo } from 'react';
import { useEthereumProvider } from '../contexts/EthereumProviderContext';
import { ChainId } from '../lib/consts';
import { isEVMChain } from '../lib/array';
import { CLUSTER, getEvmChainId } from '../utils/consts';

const createWalletStatus = (
  isReady: boolean,
  statusMessage = '',
  forceNetworkSwitch: () => void,
  walletAddress?: string,
) => ({
  isReady,
  statusMessage,
  forceNetworkSwitch,
  walletAddress,
});

function useIsWalletReady(
  chainId: ChainId,
  enableNetworkAutoswitch = true,
): {
  isReady: boolean;
  statusMessage: string;
  walletAddress?: string;
  forceNetworkSwitch: () => void;
} {
  const autoSwitch = enableNetworkAutoswitch;
  const {
    provider,
    signerAddress,
    chainId: evmChainId,
  } = useEthereumProvider();
  const hasEthInfo = !!provider && !!signerAddress;
  const correctEvmNetwork = getEvmChainId(chainId);
  const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;

  // console.log("line: 40", correctEvmNetwork, hasCorrectEvmNetwork, evmChainId, correctEvmNetwork, provider);
  const forceNetworkSwitch = useCallback(() => {
    if (provider && correctEvmNetwork) {
      if (!isEVMChain(chainId)) {
        return;
      }
      try {
        provider
          .send('wallet_switchEthereumChain', [
            { chainId: hexStripZeros(hexlify(correctEvmNetwork)) },
          ])
          .then();
      } catch (e) {}
    }
  }, [provider, correctEvmNetwork, chainId]);

  return useMemo(() => {
    if (isEVMChain(chainId) && hasEthInfo && signerAddress) {
      if (hasCorrectEvmNetwork) {
        return createWalletStatus(
          true,
          undefined,
          forceNetworkSwitch,
          signerAddress,
        );
      }
      if (provider && correctEvmNetwork && autoSwitch) {
        forceNetworkSwitch();
      }
      return createWalletStatus(
        false,
        `Wallet is not connected to ${CLUSTER}. Expected chain id: ${correctEvmNetwork}`,
        forceNetworkSwitch,
        undefined,
      );
    }

    return createWalletStatus(
      false,
      'Wallet not connected',
      forceNetworkSwitch,
      undefined,
    );
  }, [
    chainId,
    autoSwitch,
    forceNetworkSwitch,
    hasEthInfo,
    correctEvmNetwork,
    hasCorrectEvmNetwork,
    provider,
    signerAddress,
  ]);
}

export default useIsWalletReady;
