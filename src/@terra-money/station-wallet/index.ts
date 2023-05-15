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

  constructor() {
    this.extension = new Extension()
  }

  async info() {
    await this.extension.send('interchain-info')

    return new Promise<InfoResponse>((resolve) => {
      // @ts-expect-error
      this.extension.on((d, name) => {
        if (name === 'onInterchainInfo') {
          resolve(d as InfoResponse)
        }
      })
    })
  }

  async connect() {
    await this.extension.send('connect')

    return new Promise<ConnectResponse>((resolve) => {
      // @ts-expect-error
      this.extension.on((d, name) => {
        if (name === 'onConnect') {
          resolve(d as ConnectResponse)
        }
      })
    })
  }

  async post(tx: CreateTxOptions) {
    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        msgs: tx.msgs.map((msg) => msg.toData(isClassic)),
      }),
    )
    
    await this.extension.send('post', data)

    return new Promise<PostResponse>((resolve) => {
      // @ts-expect-error
      this.extension.on((d, name) => {
        if (name === 'onPost') {
          resolve(d as PostResponse)
        }
      })
    })
  }

  async sign(tx: CreateTxOptions) {
    // is the chain classic?
    const networks = await this.info()
    const isClassic = !!networks[tx.chainID]?.isClassic

    const data = JSON.parse(
      JSON.stringify({
        ...tx,
        msgs: tx.msgs.map((msg) => msg.toData(isClassic)),
      }),
    )
    
    await this.extension.send('sign', data)

    return new Promise<PostResponse>((resolve) => {
      // @ts-expect-error
      this.extension.on((d, name) => {
        if (name === 'onSign') {
          resolve(d as PostResponse)
        }
      })
    })
  }

  addListener(event: EventTypes, cb: (data: any) => void) {
    switch (event) {
      case EventTypes.NetworkChange:
        window.addEventListener('station_network_change', (e: any) =>
          cb(e.detail),
        )
        break
      case EventTypes.WalletChange:
        window.addEventListener('station_wallet_change', (e: any) =>
          cb(e.detail),
        )
        break
    }
  }

  removeListener(event: EventTypes, cb: (data: any) => void) {
    switch (event) {
      case EventTypes.NetworkChange:
        window.removeEventListener('station_network_change', (e: any) =>
          cb(e.detail),
        )
        break
      case EventTypes.WalletChange:
        window.removeEventListener('station_wallet_change', (e: any) =>
          cb(e.detail),
        )
        break
    }
  }

  isInstalled = !!window?.isStationExtensionAvailable

  id = 'station-extension'

  details = {
    name: 'Station Extension',
    icon: 'https://station.terra.money/favicon.png',
    website: 'https://station.terra.money',
  }
}
