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
    const { payload } = await this.extension.request('interchain-info')

    return payload as InfoResponse
  }

  async connect() {
    const { payload } = await this.extension.request('connect')

    return payload as ConnectResponse
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
    const { payload } = await this.extension.request('post', data)

    return payload as PostResponse
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
    const { payload } = await this.extension.request('sign', data)

    return payload as PostResponse
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
