import {
  AccAddress,
  CreateTxOptions,
  LCDClientConfig,
  Tx,
} from '@terra-money/feather.js'

export declare enum WalletStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  INITIALIZING = 'INITIALIZING',
  CONNECTED = 'CONNECTED',
}

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
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
  sign: (tx: CreateTxOptions) => Promise<Tx>;
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
