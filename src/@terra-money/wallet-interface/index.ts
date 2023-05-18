import {
  AccAddress,
  CreateTxOptions,
  LCDClientConfig,
  Msg,
} from '@terra-money/feather.js'
import { WalletStatus } from '@terra-money/wallet-kit'

type ChainID = string
export type InfoResponse = Record<ChainID, LCDClientConfig>
export type ConnectResponse = {
  addresses: Record<ChainID, AccAddress>
  ledger?: boolean
  name?: string
  network?: string
  theme?: string
}
export type WalletResponse = {
  status: WalletStatus.CONNECTED | WalletStatus.NOT_CONNECTED | WalletStatus.INITIALIZING;
  network: InfoResponse;
  connect: (id?: string) => Promise<void>;
  disconnect: () => void;
  availableWallets: {
      id: string;
      isInstalled: boolean | undefined;
      name: string;
      icon: string;
      website?: string | undefined;
  }[];
  post: (tx: CreateTxOptions) => Promise<{
      height: string;
      txhash: string;
      raw_log: string;
      code: string | number;
      codespace: string;
  } | undefined>;
  sign: (tx: CreateTxOptions) => Promise<{
      height: string;
      txhash: string;
      raw_log: string;
      code: string | number;
      codespace: string;
  } | undefined>;
}
export type PostResponse = {
  id: number
  origin: string
  success: boolean
  result?: {
    height: string
    txhash: string
    raw_log: string
    code: number | string
    codespace: string
  }
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
  sign: (tx: CreateTxOptions) => Promise<PostResponse>

  // events
  addListener: (event: EventTypes, cb: (data: any) => void) => void
  removeListener: (event: EventTypes, cb: (data: any) => void) => void

  details: {
    name: string
    icon: string
    website?: string
  }
}
