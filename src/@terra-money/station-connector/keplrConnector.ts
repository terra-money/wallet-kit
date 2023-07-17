import { AminoSignResponse, StdSignDoc } from '@cosmjs/amino'
import StationOfflineSigner from './cosmjsOfflineSigner'
import { bech32 } from 'bech32'

export type GetKeyResponse = {
  // Name of the selected key store.
  name: string
  algo: string
  pubKey: Uint8Array
  address: Uint8Array
  bech32Address: string
  isNanoLedger: boolean
}

export default class KeplrConnector {
  getOfflineSigner(chainID: string): StationOfflineSigner {
    return new StationOfflineSigner(chainID)
  }

  getOfflineSignerOnlyAmino(chainID: string): StationOfflineSigner {
    return new StationOfflineSigner(chainID)
  }

  async getOfflineSignerAuto(chainID: string): Promise<StationOfflineSigner> {
    return new StationOfflineSigner(chainID)
  }

  async enable(chainID: string | string[]): Promise<void> {
    if (!window.station) throw new Error('Station not available')

    await window.station.connect()
  }

  async getKey(chainID: string): Promise<GetKeyResponse> {
    if (!window.station) throw new Error('Station not available')

    const info = (await window.station.info())[chainID]
    if (!info)
      throw new Error('The requested chain is not available on Station.')

    const connectedWallet = await window.station.connect()

    const pubkey =
      connectedWallet.pubkey?.[info.coinType] ??
      ((await window.station.getPublicKey()).pubkey?.[info.coinType] as string)

    return {
      name: connectedWallet.name,
      algo: 'secp256k1',
      pubKey: Buffer.from(pubkey, 'base64'),
      address: Buffer.from(
        bech32.decode(connectedWallet.addresses[chainID]).words,
      ),
      bech32Address: connectedWallet.addresses[chainID],
      // since protobuf is not supported by Station, we set this as true
      isNanoLedger: true
    }
  }
  
  async signAmino(chainID: string, signer: string, signDoc: StdSignDoc): Promise<AminoSignResponse> {
    const offlineSigner = this.getOfflineSigner(chainID)
    return offlineSigner.signAmino(signer, signDoc)
  }

  async signDirect(...args: any): Promise<any> {
    throw new Error('signDirect not supported by Station')
  }
}
