import {
  ConnectResponse,
  EventTypes,
  InfoResponse,
  Wallet,
} from '@terra-money/wallet-interface'
import createContext from './utils/createContext'
import React, { useEffect, useState } from 'react'
import StationWallet from '@terra-money/station-wallet'

enum WalletStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  INITIALIZING = 'INITIALIZING',
  CONNECTED = 'CONNECTED',
}

const [useWalletProvider, WalletProviderContext] = createContext<{
  wallets: Wallet[]
  state: WalletProviderState
  defaultNetworks: InfoResponse
  setState: React.Dispatch<React.SetStateAction<WalletProviderState>>
}>('useWalletProvider')

interface WalletProviderProps {
  children: React.ReactNode
  defaultNetworks: InfoResponse
  extraWallets?: Wallet[]
}

type WalletProviderState =
  | {
      status: WalletStatus.CONNECTED
      wallet: Wallet
      connectedWallet: ConnectResponse
      network: InfoResponse
    }
  | {
      status: WalletStatus.INITIALIZING | WalletStatus.NOT_CONNECTED
      network: InfoResponse
      wallet?: undefined
      connectedWallet?: undefined
    }

function WalletProvider({
  children,
  extraWallets,
  defaultNetworks,
}: WalletProviderProps) {
  const availableWallets = [new StationWallet(), ...(extraWallets ?? [])]

  const [state, setState] = useState<WalletProviderState>({
    status: WalletStatus.INITIALIZING,
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
          status: WalletStatus.CONNECTED,
          wallet,
          connectedWallet,
          network,
        })
      })()

      const networkCallback = (network: InfoResponse) => {
        // sometimes the response is empty, if that's the case refresh the page
        if (Object.keys(network).length === 0) {
          window.location.reload()
        }

        wallet.connect().then((w) =>
          setState({
            status: WalletStatus.CONNECTED,
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
            status: WalletStatus.CONNECTED,
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
        status: WalletStatus.NOT_CONNECTED,
        network: defaultNetworks,
      })
    }
  }, [])

  const { wallet } = state

  useEffect(() => {
    if (wallet) {
      const networkCallback = (network: InfoResponse) => {
        wallet.connect().then((w) =>
          setState({
            status: WalletStatus.CONNECTED,
            wallet,
            connectedWallet: w,
            network,
          }),
        )
      }
      const walletCallback = (connectedWallet: ConnectResponse) => {
        wallet.info().then((network) =>
          setState({
            status: WalletStatus.CONNECTED,
            wallet,
            connectedWallet,
            network,
          }),
        )
      }

      wallet.addListener(EventTypes.NetworkChange, networkCallback)
      wallet.addListener(EventTypes.WalletChange, walletCallback)

      return () => {
        wallet.removeListener(EventTypes.NetworkChange, networkCallback)
        wallet.removeListener(EventTypes.WalletChange, walletCallback)
      }
    }
  }, [wallet])

  return (
    <WalletProviderContext
      value={{
        wallets: availableWallets,
        state,
        setState,
        defaultNetworks,
      }}
    >
      {children}
    </WalletProviderContext>
  )
}

export { useWalletProvider, WalletStatus, WalletProvider }
