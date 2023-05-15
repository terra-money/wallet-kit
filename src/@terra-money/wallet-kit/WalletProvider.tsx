import {
  ConnectResponse,
  EventTypes,
  InfoResponse,
  Wallet,
} from '@terra-money/wallet-interface'
import createContext from './utils/createContext'
import React, { useEffect, useState } from 'react'
import StationWallet from '@terra-money/station-wallet'

const [useWalletProvider, WalletProviderContext] = createContext<{
  wallets: Wallet[]
  state: WalletProviderState
  setState: React.Dispatch<React.SetStateAction<WalletProviderState>>
}>('useWalletProvider')

interface WalletProviderProps {
  children: React.ReactNode
  defaultNetworks: InfoResponse
  extraWallets?: Wallet[]
}

export enum WalletProviderStatus {
  CONNECTED = 'CONNECTED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  INITIALIZING = 'INITIALIZING',
}

type WalletProviderState =
  | {
      status: WalletProviderStatus.CONNECTED
      wallet: Wallet
      connectedWallet: ConnectResponse
      network: InfoResponse
    }
  | {
      status:
        | WalletProviderStatus.INITIALIZING
        | WalletProviderStatus.NOT_CONNECTED
      network: InfoResponse
      wallet?: undefined
      connectedWallet?: undefined
    }

export function WalletProvider({
  children,
  extraWallets,
  defaultNetworks,
}: WalletProviderProps) {
  const availableWallets = [new StationWallet(), ...(extraWallets ?? [])]

  const [state, setState] = useState<WalletProviderState>({
    status: WalletProviderStatus.INITIALIZING,
    network: defaultNetworks,
  })

  useEffect(() => {
    const connectedID = localStorage.getItem('__wallet_kit_connected_wallet')
    const wallet =
      connectedID && availableWallets.find(({ id }) => id === connectedID)

    if (wallet) {
      ;(async () => {
        const [connectedWallet, network] = await Promise.all([
          wallet.connect(),
          wallet.info(),
        ])

        setState({
          status: WalletProviderStatus.CONNECTED,
          wallet,
          connectedWallet,
          network,
        })
      })()

      const networkCallback = (network: InfoResponse) => {
        wallet.connect().then((w) =>
          setState({
            status: WalletProviderStatus.CONNECTED,
            wallet,
            connectedWallet: w,
            network,
          }),
        )
      }
      wallet.addListener(EventTypes.NetworkChange, networkCallback)

      const walletCallback = (connectedWallet: ConnectResponse) => {
        wallet.info().then((network) =>
          setState({
            status: WalletProviderStatus.CONNECTED,
            wallet,
            connectedWallet,
            network,
          }),
        )
      }
      wallet.addListener(EventTypes.WalletChange, walletCallback)

      return () => {
        wallet.removeListener(EventTypes.NetworkChange, networkCallback)
        wallet.removeListener(EventTypes.WalletChange, walletCallback)
      }
    } else {
      setState({
        status: WalletProviderStatus.NOT_CONNECTED,
        network: defaultNetworks,
      })
    }
  }, [])

  return (
    <WalletProviderContext
      value={{
        wallets: availableWallets,
        state,
        setState,
      }}
    >
      {children}
    </WalletProviderContext>
  )
}

export { useWalletProvider }
