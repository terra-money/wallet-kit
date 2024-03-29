import { Fee, PublicKey } from '@terra-money/feather.js'
import StationOfflineSigner from './cosmjsOfflineSigner'
import KeplrConnector from './keplrConnector'
import { log } from './log'

type NetworkName = 'mainnet' | 'testnet' | 'classic' | 'localterra'
type ChainID = string

export type InfoResponse = Record<ChainID, ChainInfo>
type ChainInfo = {
  baseAsset: string
  chainID: ChainID
  coinType: '330' | '118'
  explorer: {
    address: string
    block: string
    tx: string
    validator: string
  }
  gasAdjustment: number
  gasPrices: Record<string, number>
  icon: string
  lcd: string
  name: string
  prefix: string
  isClassic?: boolean
}

type AccAddress = string
export type ConnectResponse = {
  addresses: Record<ChainID, AccAddress>
  ledger: boolean
  name: string
  network: NetworkName
  pubkey?: {
    '330': string
    '118'?: string
  }
}

export type TxRequest = {
  chainID: string
  msgs: string[]
  fee?: string
  memo?: string
}

export type PostResponse = {
  height: string | number
  raw_log: string
  txhash: string
  code?: number | string
  codespace?: string
}

export type SignResponse = {
  auth_info: Object
  body: Object
  signatures: string[]
  fee: Fee.Amino
}

export type SignArbitraryResponse = {
  pub_key: PublicKey.Data
  signature: string
}

export type SignBytesResponse = {
  public_key: string
  recid: number
  signature: string
}

export default class Station {
  private _pendingRequests: Record<
    string,
    { resolve: (data: any) => void; reject: (data: any) => void }
  > = {}
  public keplr: KeplrConnector
  public debugMode: boolean = false

  constructor() {
    const origin = window.location.origin

    window.addEventListener('message', (event) => {
      if (event.origin !== origin) return

      const reqID = event.data?.uuid
      if (!reqID || !this._pendingRequests[reqID]) return

      const { sender, success, data } = event.data
      if (sender !== 'station') return

      success && data?.success !== false
        ? this._pendingRequests[reqID].resolve(data)
        : this._pendingRequests[reqID].reject(data?.error?.message ?? data)
      delete this._pendingRequests[reqID]

      log('response sent', { reqID, data })
    })

    this.keplr = new KeplrConnector()
  }

  private _sendMessage(content: Object, uuid: string) {
    window.postMessage(
      JSON.parse(
        JSON.stringify({
          ...content,
          sender: 'web',
          uuid,
        }),
      ),
      window.location.origin,
    )
  }

  async info(): Promise<InfoResponse> {
    log("'info' request received")
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage({ type: 'interchain-info' }, reqID)
      this._pendingRequests[reqID] = { resolve, reject }
    })
  }

  async connect(): Promise<ConnectResponse> {
    log("'connect' request received")
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage({ type: 'connect' }, reqID)
      this._pendingRequests[reqID] = { resolve, reject }
    })
  }

  async getPublicKey(): Promise<ConnectResponse> {
    log("'pubKey' request received")
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage({ type: 'get-pubkey' }, reqID)
      this._pendingRequests[reqID] = { resolve, reject }
    })
  }

  async theme(): Promise<string> {
    log("'theme' request received")
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage({ type: 'theme' }, reqID)
      this._pendingRequests[reqID] = { resolve, reject }
    })
  }

  async post(tx: TxRequest, purgeQueue = true): Promise<PostResponse> {
    log("'post' request received", { tx, purgeQueue })
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage(
        { type: 'post', data: { ...tx, purgeQueue, id: Date.now() } },
        reqID,
      )
      this._pendingRequests[reqID] = {
        resolve: (data: any) => resolve(data.result),
        reject,
      }
    })
  }

  async sign(tx: TxRequest, purgeQueue = true): Promise<SignResponse> {
    log("'sign' request received", { tx, purgeQueue })
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage(
        { type: 'sign', data: { ...tx, purgeQueue, id: Date.now() } },
        reqID,
      )
      this._pendingRequests[reqID] = {
        resolve: (data: any) => resolve(data.result),
        reject,
      }
    })
  }

  async signBytes(
    bytes: string,
    chainID?: string,
    purgeQueue = true,
  ): Promise<SignBytesResponse> {
    log("'signBytes' request received", { bytes, chainID, purgeQueue })
    const fixedPurgeQueue = typeof chainID !== 'string' ? chainID : purgeQueue
    const fixedChainID = typeof chainID === 'string' ? chainID : undefined

    return new Promise((resolve, reject) => {
      // make sure bytes are base64 encoded
      const base64regex =
        /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

      if (typeof bytes !== 'string' || !base64regex.test(bytes)) {
        reject('Bytes must be a base64 encoded string.')
      }

      const reqID = crypto.randomUUID()
      this._sendMessage(
        {
          type: 'sign',
          data: {
            bytes,
            purgeQueue: fixedPurgeQueue,
            id: Date.now(),
            chainID: fixedChainID,
          },
        },
        reqID,
      )
      this._pendingRequests[reqID] = {
        resolve: (data: any) => resolve(data.result),
        reject,
      }
    })
  }

  async signArbitrary(
    bytes: string,
    chainID?: string,
    purgeQueue = true,
  ): Promise<SignArbitraryResponse> {
    log("'signArbitrary' request received", { bytes, chainID, purgeQueue })
    const fixedPurgeQueue = typeof chainID !== 'string' ? chainID : purgeQueue
    const fixedChainID = typeof chainID === 'string' ? chainID : undefined

    return new Promise((resolve, reject) => {
      if (
        typeof bytes !== 'string' ||
        Buffer.from(bytes, 'base64').toString('base64') !== bytes
      ) {
        reject('Bytes must be a base64 encoded string.')
      }

      const reqID = crypto.randomUUID()
      this._sendMessage(
        {
          type: 'sign',
          data: {
            bytes,
            adr036: true,
            purgeQueue: fixedPurgeQueue,
            id: Date.now(),
            chainID: fixedChainID,
          },
        },
        reqID,
      )
      this._pendingRequests[reqID] = {
        resolve: (data: any) => {
          const result = {
            pub_key: PublicKey.fromData(
              data.result.auth_info.signer_infos[0].public_key as any,
            ).toData(),
            signature: data.result.signatures[0],
          }
          resolve(result)
        },
        reject,
      }
    })
  }

  async switchNetwork(
    network: NetworkName,
    purgeQueue = true,
  ): Promise<{ success: true; network: NetworkName }> {
    log("'switchNetwork' request received", { network, purgeQueue })
    return new Promise((resolve, reject) => {
      const reqID = crypto.randomUUID()
      this._sendMessage(
        {
          type: 'switch-network',
          data: { network, purgeQueue, id: Date.now() },
        },
        reqID,
      )
      this._pendingRequests[reqID] = { resolve, reject }
    })
  }

  getOfflineSigner(chainID: string): StationOfflineSigner {
    return new StationOfflineSigner(chainID)
  }
}
