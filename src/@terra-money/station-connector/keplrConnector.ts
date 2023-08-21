import { AminoSignResponse, StdSignDoc, coin, coins } from "@cosmjs/amino"
import StationOfflineSigner from "./cosmjsOfflineSigner"
import { bech32 } from "bech32"
import axios from "axios"

export type GetKeyResponse = {
  // Name of the selected key store.
  name: string
  algo: string
  pubKey: Uint8Array
  address: Uint8Array
  bech32Address: string
  isNanoLedger: boolean
}

export type ChainInfoResponse = {
  chainId: string
  chainName: string
  chainSymbolImageUrl: string

  stakeCurrency: {
    coinDecimals: number
    coinDenom: string
    coinImageUrl: string
    coinMinimalDenom: string
  }
  bip44: {
    coinType: number
  }
  bech32Config: {
    bech32PrefixAccAddr: string
    bech32PrefixAccPub: string
    bech32PrefixConsAddr: string
    bech32PrefixConsPub: string
    bech32PrefixValAddr: string
    bech32PrefixValPub: string
  }

  currencies: {
    coinDecimals: number
    coinDenom: string
    coinImageUrl: string
    coinMinimalDenom: string
  }[]
  /**
   * This indicates which coin or token can be used for fee to send transaction.
   * You can get actual currency information from Currencies.
   */
  feeCurrencies: {
    coinDecimals: number
    coinDenom: string
    coinImageUrl: string
    coinMinimalDenom: string
    gasPriceStep: {
      average: number
      high: number
      low: number
    }
  }[]
}

export default class KeplrConnector {
  readonly version = "0.12.16"
  readonly mode = "extension"

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
    if (!window.station) throw new Error("Station not available")

    await window.station.connect()
  }

  async disable(chainID?: string | string[]): Promise<void> {}

  async getKey(chainID: string): Promise<GetKeyResponse> {
    if (!window.station) throw new Error("Station not available")

    const info = (await window.station.info())[chainID]
    if (!info)
      throw new Error("The requested chain is not available on Station.")

    const connectedWallet = await window.station.connect()

    const pubkey =
      connectedWallet.pubkey?.[info.coinType] ??
      ((await window.station.getPublicKey()).pubkey?.[info.coinType] as string)

    return {
      name: connectedWallet.name,
      algo: "secp256k1",
      pubKey: Buffer.from(pubkey, "base64"),
      address: Buffer.from(
        bech32.decode(connectedWallet.addresses[chainID]).words
      ),
      bech32Address: connectedWallet.addresses[chainID],
      // since protobuf is not supported by Station, we set this as true
      isNanoLedger: true,
    }
  }

  async signAmino(
    chainID: string,
    signer: string,
    signDoc: StdSignDoc
  ): Promise<AminoSignResponse> {
    const offlineSigner = this.getOfflineSigner(chainID)
    return offlineSigner.signAmino(signer, signDoc)
  }

  async signDirect(...args: any): Promise<any> {
    throw new Error("signDirect not supported by Station")
  }

  async getChainInfosWithoutEndpoints(): Promise<ChainInfoResponse[]> {
    if (!window.station) throw new Error("Station not available")

    const info = await window.station.info()
    const { data: coinsData } = await axios.get(
      "https://station-assets.terra.dev/denoms.json"
    )

    const coins = Object.values({
      ...coinsData.mainnet,
      ...coinsData.testnet,
      ...coinsData.classic,
      ...coinsData.localterra,
    }) as {
      token: string
      symbol: string
      name: string
      icon: string
      decimals: number
      chainID: string
    }[]

    return Object.values(info).map(
      ({ chainID, name, icon, coinType, baseAsset, prefix }) => {
        const stakeCurrency = coins.find(
          ({ token, chainID: tokenChain }) =>
            token === baseAsset && tokenChain === chainID
        )
        const currencies = coins.filter(
          ({ chainID: tokenChain }) => tokenChain === chainID
        )
        const feeCurrencies = Object.keys(info[chainID].gasPrices).map(
          (denom) =>
            coins.find(
              ({ token, chainID: tokenChain }) =>
                token === denom && tokenChain === chainID
            )
        )

        return {
          chainId: chainID,
          chainName: name,
          chainSymbolImageUrl: icon,

          bip44: {
            coinType: Number(coinType),
          },

          stakeCurrency: {
            coinDecimals: stakeCurrency?.decimals ?? 6,
            coinDenom: baseAsset,
            coinImageUrl: stakeCurrency?.icon ?? "",
            coinMinimalDenom: stakeCurrency?.symbol ?? baseAsset,
          },

          bech32Config: {
            bech32PrefixAccAddr: prefix,
            bech32PrefixAccPub: `${prefix}pub`,
            bech32PrefixConsAddr: `${prefix}valcons`,
            bech32PrefixConsPub: `${prefix}valconspub`,
            bech32PrefixValAddr: `${prefix}valoper`,
            bech32PrefixValPub: `${prefix}valoperpub`,
          },

          currencies: currencies.map(({ token, symbol, icon, decimals }) => ({
            coinDecimals: decimals ?? 6,
            coinDenom: token,
            coinImageUrl: icon,
            coinMinimalDenom: symbol,
          })),

          feeCurrencies: feeCurrencies
            .filter((coin) => !!coin)
            .map(
              // @ts-expect-error
              ({ token, symbol, icon, decimals }) => ({
                coinDecimals: decimals ?? 6,
                coinDenom: token,
                coinImageUrl: icon,
                coinMinimalDenom: symbol,
                gasPriceStep: {
                  average: info[chainID].gasPrices[token],
                  high: info[chainID].gasPrices[token],
                  low: info[chainID].gasPrices[token],
                },
              })
            ),
        }
      }
    )
  }

  async experimentalSuggestChain(chain: ChainInfoResponse) {
    if (!window.station) throw new Error("Station not available")

    const info = await window.station.info()

    if (!info[chain.chainId]) {
      throw new Error(`${chain.chainId} is not available on Station.`)
    }
  }
}
