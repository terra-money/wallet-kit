import { WalletProviderStatus, useWalletProvider } from './WalletProvider'
import { CreateTxOptions, LCDClient } from '@terra-money/feather.js'

export function useNetworks() {
  const { state } = useWalletProvider()
  return state.network
}

export function useLcdClient() {
  const networks = useNetworks()

  return new LCDClient(networks)
}

export function useConnectedWallet() {
  const { state } = useWalletProvider()

  return state.connectedWallet
}

export function useWallet() {
  const { wallets, state, setState } = useWalletProvider()

  const { wallet, connectedWallet: _, ...providerState } = state

  const connect = async (id: string = 'station-extension') => {
    const wallet = wallets.find((w) => w.id === id)

    if (!wallet) {
      throw new Error(`Wallet ${id} not found`)
    }

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

    localStorage.setItem('__wallet_kit_connected_wallet', id)
  }

  const disconnect = () => {
    localStorage.removeItem('__wallet_kit_connected_wallet')
    setState((s) => ({
      status: WalletProviderStatus.NOT_CONNECTED,
      network: s.network,
    }))
  }

  const post = async (tx: CreateTxOptions) => {
    if (providerState.status !== WalletProviderStatus.CONNECTED || !wallet)
      throw new Error('Wallet not connected')

    const { result } = await wallet.post(tx)

    return result
  }

  const sign = async (tx: CreateTxOptions) => {
    if (providerState.status !== WalletProviderStatus.CONNECTED || !wallet)
      throw new Error('Wallet not connected')

    const { result } = await wallet.sign(tx)

    return result
  }

  const availableWallets = wallets.map(({ details, id, isInstalled }) => ({
    ...details,
    id,
    isInstalled,
  }))

  return { connect, disconnect, availableWallets, post, sign, ...providerState }
}
