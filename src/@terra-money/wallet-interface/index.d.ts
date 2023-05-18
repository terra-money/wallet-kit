import { AccAddress, CreateTxOptions, LCDClientConfig } from '@terra-money/feather.js';
type ChainID = string;
export type InfoResponse = Record<ChainID, LCDClientConfig>;
export type ConnectResponse = {
    addresses: Record<ChainID, AccAddress>;
    ledger?: boolean;
    name?: string;
    network?: string;
    theme?: string;
};
export type PostResponse = {
    id: number;
    origin: string;
    success: boolean;
    result?: {
        height: string;
        txhash: string;
        raw_log: string;
        code: number | string;
        codespace: string;
    };
    error?: {
        code: number;
        message?: string;
    };
};
export declare enum EventTypes {
    NetworkChange = "networkChange",
    WalletChange = "walletChange"
}
export interface Wallet {
    id: string;
    isInstalled?: boolean;
    info: () => Promise<InfoResponse>;
    connect: () => Promise<ConnectResponse>;
    post: (tx: CreateTxOptions) => Promise<PostResponse>;
    sign: (tx: CreateTxOptions) => Promise<PostResponse>;
    addListener: (event: EventTypes, cb: (data: any) => void) => void;
    removeListener: (event: EventTypes, cb: (data: any) => void) => void;
    details: {
        name: string;
        icon: string;
        website?: string;
    };
}
export {};
