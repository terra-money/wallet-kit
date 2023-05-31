import {
  AccAddress,
  CreateTxOptions,
  LCDClientConfig,
  Tx,
} from '@terra-money/feather.js'
import { WalletStatus } from '@terra-money/wallet-kit'

type ChainID = string
type TxResult = {
  height: string;
  txhash: string;
  raw_log: string;
  code: string | number;
  codespace: string;
} | undefined

export type InfoResponse = Record<ChainID, LCDClientConfig>
export type ConnectResponse = {
  addresses: Record<ChainID, AccAddress>
  ledger?: boolean
  name?: string
  network?: string
  theme?: string
}

export interface WalletResponse {
  status: WalletStatus;
  /**
   * current client status
   *
   * this will be one of WalletStatus.INITIALIZING | WalletStatus.WALLET_NOT_CONNECTED | WalletStatus.WALLET_CONNECTED
   *
   * INITIALIZING = checking that the session and the chrome extension installation. (show the loading to users)
   * WALLET_NOT_CONNECTED = there is no connected wallet (show the connect and install options to users)
   * WALLET_CONNECTED = there is aconnected wallet (show the wallet info and disconnect button to users)
   */
   network: InfoResponse;
  /**
   * current selected network
   *
   * - if status is INITIALIZING or WALLET_NOT_CONNECTED = this will be the defaultNetwork
   * - if status is WALLET_CONNECTED = this depends on the connected environment
   */
    availableWallets: {
      id: string;
      isInstalled: boolean | undefined;
      name: string;
      icon: string;
      website?: string | undefined;
    }[];
  /**
   * available wallets that can be connected from the browser
   *
   */
  connect: (id?: string) => void;
  /**
   * use connect in conjunction with availableWallets to connect the wallet to the web page
   *
   * @example
   * ```
   * const { availableWallets, connect } = useWallet()
   *
   * return (
   *  <div>
   *    {
   *      availableWallets.map(({ id, name, isInstalled }) => (
   *        <butotn key={id} disabled={!isInstalled} onClick={() => connect(id)}>
   *          <img src={icon} /> Connect {name}
   *        </button>
   *      ))
   *    }
   *  </div>
   * )
   * ```
   */
  disconnect: () => void;
  /**
     * disconnect
     *
     * @example
     * ```
     * const { status, disconnect } = useWallet()
     *
     * return status === WalletStatus.WALLET_CONNECTED &&
     *  <button onClick={() => disconnect()}>
     *    Disconnect
     *  </button>
     * ```
   */
    post: (tx: CreateTxOptions) => Promise<PostResponse>;
  /**
   * post transaction
   *
   * @example
   * ```
   * const { post } = useWallet()
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: PostResponse = await post({ ...txOptions })
   *    // DO SOMETHING...
   *   } catch (error) {
   *     if (error instanceof UserDenied) {
   *       // DO SOMETHING...
   *     } else {
   *       // DO SOMETHING...
   *     }
   *   }
   * }, [])
   * ```
   *
   * @param { txOptions } tx transaction data
   *
   * @return { Promise<PostResponse> }
   *
   * @throws { UserDenied } user denied the tx
   * @throws { CreateTxFailed } did not create txhash (error dose not broadcasted)
   * @throws { TxFailed } created txhash (error broadcated)
   * @throws { Timeout } user does not act anything in specific time
   * @throws { TxUnspecifiedError } unknown error
   */
  
  sign: (tx: CreateTxOptions) => Promise<Tx>
  /**
   * sign transaction
   *
   * @example
   * ```
   * const { sign } = useWallet()
   * const lcd = useLCDClient()
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: SignResult = await sign({ ...txOptions })
   *
   *    // Broadcast SignResult
   *    const tx = result.result
   *
   *    const txResult = await lcd.tx.broadcastSync(tx)
   *
   *    // DO SOMETHING...
   *   } catch (error) {
   *     if (error instanceof UserDenied) {
   *       // DO SOMETHING...
   *     } else {
   *       // DO SOMETHING...
   *     }
   *   }
   * }, [])
   * ```
   *
   * @param { CreateTxOptions } tx transaction data
   *
   * @return { Promise<Tx> }
   *
   * @throws { UserDenied } user denied the tx
   * @throws { CreateTxFailed } did not create txhash (error dose not broadcasted)
   * @throws { TxFailed } created txhash (error broadcated)
   * @throws { Timeout } user does not act anything in specific time
   * @throws { TxUnspecifiedError } unknown error
   *
   */
}

export type PostResponse = {
  id: number
  origin: string
  success: boolean
  result?: TxResult
  error?: { code: number; message?: string }
}

export enum EventTypes {
  NetworkChange = 'networkChange',
  WalletChange = 'walletChange',
}

export interface Wallet {
  id: string
  isInstalled?: boolean

  // methods
  info: () => Promise<InfoResponse>
  connect: () => Promise<ConnectResponse>
  post: (tx: CreateTxOptions) => Promise<PostResponse> 
  sign: (tx: CreateTxOptions) => Promise<Tx>

  // events
  addListener: (event: EventTypes, cb: (data: any) => void) => void
  removeListener: (event: EventTypes, cb: (data: any) => void) => void

  details: {
    name: string
    icon: string
    website?: string
  }
}
