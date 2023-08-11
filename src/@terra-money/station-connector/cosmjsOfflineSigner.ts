import {
  AccountData,
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignDoc,
  StdSignature,
} from '@cosmjs/amino'
import { Fee, Msg, SignatureV2 } from '@terra-money/feather.js'

export default class StationOfflineSigner implements OfflineAminoSigner {
  private chainID: string

  constructor(chainID: string) {
    this.chainID = chainID
  }

  async getAccounts(): Promise<AccountData[]> {
    if (!window.station) throw new Error('Station not available')

    const info = (await window.station.info())[this.chainID]
    if (!info)
      throw new Error(
        `The requested chainID ${this.chainID} is not available, try to switch network on the Station extension.`,
      )

    let { addresses, pubkey: pubkeys } = await window.station.connect()
    if (!pubkeys) {
      pubkeys = (await window.station.getPublicKey()).pubkey
    }
    const address = addresses[this.chainID]
    const pubkey = pubkeys?.[info.coinType]

    if (!address || !pubkey)
      throw new Error(
        'The requested account is not available, try to use a different wallet on the Station extension or to import it again.',
      )

    return [
      {
        address,
        pubkey: Buffer.from(pubkey, 'base64'),
        algo: 'secp256k1',
      },
    ]
  }

  async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc,
  ): Promise<AminoSignResponse> {
    if (!window.station) throw new Error('Station not available')

    // make sure account is available
    const info = (await window.station.info())[this.chainID]
    const { addresses } = await window.station.connect()
    if (!addresses[this.chainID])
      throw new Error(
        `You don't have an account on the requested chainID ${this.chainID}, try to switch network on the Station extension.`,
      )
    if (addresses[this.chainID] !== signerAddress)
      throw new Error(
        `Account mismatch: you are trying to sign a tx with ${signerAddress}, but you address on ${
          this.chainID
        } is ${addresses[this.chainID]}.`,
      )

    const signDocFee = signDoc.fee

    const feeDenom = signDocFee.amount.length
      ? signDocFee.amount[0].denom
      : typeof info.gasPrices[info.baseAsset] === 'number'
      ? info.baseAsset
      : Object.keys(info.gasPrices)[0]

    const gas =
      parseInt(signDocFee.gas) ?? Math.ceil(200_000 * info.gasAdjustment)

    const feeAmount =
      signDocFee.amount.length && Number(signDocFee.amount[0].amount) !== 0
        ? signDocFee.amount[0].amount
        : Math.ceil(gas * (info.gasPrices[feeDenom] ?? 0)).toString()

    const feeFixedAmount = feeAmount + feeDenom
    const fakeMsgs = signDoc.msgs.map((msg) => Msg.fromAmino(msg as Msg.Amino))

    const signResponse = await window.station.sign({
      chainID: signDoc.chain_id,
      msgs: fakeMsgs,
      fee: new Fee(gas, feeFixedAmount, signDocFee.payer, signDocFee.granter),
      memo: signDoc.memo,
      signMode: SignatureV2.SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
    } as any)

    const signature: StdSignature = {
      // @ts-expect-error
      pub_key: (signResponse.auth_info.signer_infos[0].public_key as any).key,
      signature: signResponse.signatures[0],
    }

    return {
      signed: {
        ...signDoc,
        fee: {
          ...signDocFee,
          amount: [{ denom: feeDenom, amount: feeAmount }],
        },
      },
      signature,
    }
  }
}
