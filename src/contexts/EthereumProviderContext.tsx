/* eslint-disable no-empty,@typescript-eslint/no-empty-function */
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, ethers } from 'ethers';
import { ExternalProvider } from '@ethersproject/providers';
import React, {
  JSXElementConstructor,
  ReactChildren,
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type Provider = ethers.providers.Web3Provider | undefined;
export type Signer = ethers.Signer | undefined;

interface IEthereumProviderContext {
  connect(): void;
  disconnect(): void;
  provider: Provider;
  chainId: number | undefined;
  signer: Signer;
  signerAddress: string | undefined;
  providerError: string | null;
}

interface IDetectedProvider extends ExternalProvider {
  on(
    event: string,
    value: (updatedChainId: BigNumber) => void,
  ): void | PromiseLike<void>;
}

const EthereumProviderContext = React.createContext<IEthereumProviderContext>({
  connect: () => {},
  disconnect: () => {},
  provider: undefined,
  chainId: undefined,
  signer: undefined,
  signerAddress: undefined,
  providerError: null,
});
export const EthereumProviderProvider = ({
  children,
}: {
  children: ReactElement<
    ReactChildren,
    string | JSXElementConstructor<unknown>
  >;
}) => {
  const [providerError, setProviderError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<Signer>(undefined);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(
    undefined,
  );
  const connect = useCallback(() => {
    setProviderError(null);
    detectEthereumProvider()
      .then((detectedProvider) => {
        if (detectedProvider) {
          const walletProvider = new ethers.providers.Web3Provider(
            detectedProvider as ExternalProvider,
            'any',
          );
          walletProvider
            .send('eth_requestAccounts', [])
            .then(() => {
              setProviderError(null);
              setProvider(walletProvider);
              walletProvider
                .getNetwork()
                .then((network) => {
                  setChainId(network.chainId);
                })
                .catch(() => {
                  setProviderError(
                    'An error occurred while getting the network',
                  );
                });
              const walletSigner = walletProvider.getSigner();
              setSigner(walletSigner);
              walletSigner
                .getAddress()
                .then((address) => {
                  setSignerAddress(address);
                })
                .catch(() => {
                  setProviderError(
                    'An error occurred while getting the signer address',
                  );
                });
              if (detectedProvider && (detectedProvider as IDetectedProvider)) {
                (detectedProvider as IDetectedProvider).on(
                  'chainChanged',
                  (updatedChainId) => {
                    try {
                      setChainId(BigNumber.from(updatedChainId).toNumber());
                    } catch (e) {}
                  },
                );
                (detectedProvider as IDetectedProvider).on(
                  'accountsChanged',
                  () => {
                    try {
                      const walletSigner2 = walletProvider.getSigner();
                      setSigner(walletSigner2);
                      walletSigner2
                        .getAddress()
                        .then((address) => {
                          setSignerAddress(address);
                        })
                        .catch(() => {
                          setProviderError(
                            'An error occurred while getting the signer address',
                          );
                        });
                    } catch (e) {}
                  },
                );
              }
            })
            .catch(() => {
              setProviderError(
                'An error occurred while requesting eth accounts',
              );
            });
        } else {
          setProviderError('Please install MetaMask');
        }
      })
      .catch(() => {
        setProviderError('Please install MetaMask');
      });
  }, []);
  const disconnect = useCallback(() => {
    setProviderError(null);
    setProvider(undefined);
    setChainId(undefined);
    setSigner(undefined);
    setSignerAddress(undefined);
  }, []);
  const contextValue = useMemo(
    () => ({
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
    }),
    [
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
    ],
  );
  return (
    <EthereumProviderContext.Provider value={contextValue}>
      {children}
    </EthereumProviderContext.Provider>
  );
};
export const useEthereumProvider = () => useContext(EthereumProviderContext);
