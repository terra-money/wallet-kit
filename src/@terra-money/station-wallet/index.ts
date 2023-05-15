import {
  ConnectResponse,
  EventTypes,
  InfoResponse,
  PostResponse,
  Wallet,
} from '@terra-money/wallet-interface'
import { CreateTxOptions, Extension } from '@terra-money/feather.js'

declare global {
  interface Window {
    isStationExtensionAvailable: boolean
  }
}

export default class StationWallet implements Wallet {
  private extension: Extension
  private pendingRequests: Record<string, (data: any) => void> = {}

  constructor() {
    this.extension = new Extension()

    // @ts-expect-error
    this.extension.on((d, name) => {
      this.pendingRequests[name]?.(d)
      delete this.pendingRequests[name]
    })
  }

  async info() {
    await this.extension.send('interchain-info')

    return new Promise<InfoResponse>((resolve) => {
      this.pendingRequests['onInterchainInfo'] = resolve
    })
  }

  async connect() {
    await this.extension.send('connect')

    return new Promise<ConnectResponse>((resolve) => {
      this.pendingRequests['onConnect'] = (data) => {
        delete data['address']
        resolve(data)
      }
    })
  }

  async post(tx: CreateTxOptions) {
    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        msgs: tx.msgs.map((msg) => JSON.stringify(msg.toData(isClassic))),
        purgeQueue: true,
        id: Date.now(),
      }),
    )

    await this.extension.send('post', data)

    return new Promise<PostResponse>((resolve) => {
      this.pendingRequests['onPost'] = resolve
    })
  }

  async sign(tx: CreateTxOptions) {
    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        msgs: tx.msgs.map((msg) => JSON.stringify(msg.toData(isClassic))),
        purgeQueue: true,
        id: Date.now(),
      }),
    )

    await this.extension.send('sign', data)

    return new Promise<PostResponse>((resolve) => {
      this.pendingRequests['onSign'] = resolve
    })
  }

  private listeners: Record<string, (e: any) => void> = {}

  addListener(event: EventTypes, cb: (data: any) => void) {
    const listener = (e: any) => cb(e.detail)
    this.listeners[event] = listener

    switch (event) {
      case EventTypes.NetworkChange:
        window.addEventListener('station_network_change', listener)
        break
      case EventTypes.WalletChange:
        window.addEventListener('station_wallet_change', listener)
        break
    }
  }

  removeListener(event: EventTypes, _?: (data: any) => void) {
    const listener = this.listeners[event]
    if (!listener) return

    switch (event) {
      case EventTypes.NetworkChange:
        window.removeEventListener('station_network_change', listener)
        break
      case EventTypes.WalletChange:
        window.removeEventListener('station_wallet_change', listener)
        break
    }

    delete this.listeners[event]
  }

  isInstalled = !!window?.isStationExtensionAvailable

  id = 'station-extension'

  details = {
    name: 'Station Extension',
    icon: 'https://station.terra.money/favicon.png',
    website: 'https://station.terra.money',
  }
}
