import Connector from "@walletconnect/core";
import * as cryptoLib from "@walletconnect/iso-crypto";
import {
  IPushServerOptions,
  IWalletConnectOptions,
} from "@walletconnect/types";
import { uuid } from "@walletconnect/utils";
import SocketTransport from "./utils/socket-transport";
import {
  ConnectResponse,
  EventTypes,
  Wallet,
} from "@terra-money/wallet-interface";
import { TerraWalletconnectQrcodeModal } from "./utils/modal";
import { CreateTxOptions, LCDClientConfig } from "@terra-money/feather.js";
import axios from "axios";
import { isMobile } from "./utils/browser-check";

type WalletConnectEvents = "session_update" | "disconnect" | "connect";

const chainIDs = ["pisco-1", "phoenix-1", "columbus-5"];

export default class TerraStationMobileWallet implements Wallet {
  private _address: string | null = null;
  private _chainID: string | null = null;
  private _connector: Connector | null = null;
  private _qrcodeModal: TerraWalletconnectQrcodeModal | null = null;
  private _networksList: Record<string, LCDClientConfig> | null = null;
  private _eventListeners: Record<
    WalletConnectEvents,
    ((err: any, payload: any) => void)[]
  > = {
    session_update: [],
    disconnect: [],
    connect: [],
  };

  constructor() {}

  private _initEvents() {
    if (!this._connector) {
      throw new Error(`WalletConnect is not defined!`);
    }

    this._connector.on("connect", (error, payload) => {
      if (error) throw error;

      this._address = payload.params[0].accounts[0];
      this._chainID = chainIDs[Number(payload.params[0].chainId)];

      this._eventListeners.connect.forEach((listener) => {
        listener(error, payload);
      });

      this._eventListeners.connect = [];
    });

    this._connector.on("session_update", async (error, payload) => {
      if (error) throw error;

      const newAddress = payload.params[0].accounts[0];
      const newChainID = chainIDs[Number(payload.params[0].chainId)];

      if (newAddress !== this._address) {
        this._address = newAddress;
        this._triggerListener(EventTypes.WalletChange, {
          addresses: {
            [newChainID]: newAddress,
          },
        });
      }
      if (newChainID !== this._chainID) {
        this._chainID = newChainID;

        this._fetchNetworksList().then((networks) => {
          this._triggerListener(EventTypes.NetworkChange, {
            [newChainID]: networks[newChainID],
          });
        });
      }
    });

    this._connector.on("disconnect", (error, payload) => {
      if (error) throw error;
      this.disconnect();
    });
  }

  private async _fetchNetworksList() {
    if (this._networksList) return this._networksList;

    const { data } = await axios.get(
      "https://station-assets.terra.dev/chains.json"
    );
    const result = Object.fromEntries(
      Object.entries({
        ...data.mainnet,
        ...data.testnet,
        ...data.classic,
      } as Record<string, LCDClientConfig>).filter(
        ([, { prefix }]) => prefix === "terra"
      )
    );

    this._networksList = result;
    return result;
  }

  async info() {
    const networks = await this._fetchNetworksList();
    const chainID = this._chainID || "phoenix-1";

    return {
      [chainID]: networks[chainID],
    };
  }

  async connect() {
    if (this._address && this._chainID) {
      return {
        addresses: {
          [this._chainID]: this._address,
        },
      };
    }

    this._qrcodeModal = new TerraWalletconnectQrcodeModal();

    const connectorOpts: IWalletConnectOptions = {
      bridge: "https://walletconnect.terra.dev/",
      qrcodeModal: this._qrcodeModal,
    };

    const pushServerOpts: IPushServerOptions | undefined = undefined; //options.pushServerOpts;

    const cachedSession = localStorage.getItem("walletconnect");
    if (typeof cachedSession === "string") {
      const cachedSessionObject = JSON.parse(cachedSession);
      const clientId = cachedSessionObject.clientId;
      const draftConnector = new Connector({
        connectorOpts: {
          ...connectorOpts,
          session: JSON.parse(cachedSession),
        },
        pushServerOpts,
        cryptoLib,
        transport: new SocketTransport({
          protocol: "wc",
          version: 1,
          url: connectorOpts.bridge!,
          subscriptions: [clientId],
        }),
      });
      draftConnector.clientId = clientId;

      this._connector = draftConnector;

      this._initEvents();

      this._address = draftConnector.accounts[0];
      this._chainID = chainIDs[Number(draftConnector.chainId)];

      return {
        addresses: {
          [this._chainID]: this._address,
        },
      };
    } else {
      const clientId = uuid();
      const draftConnector = new Connector({
        connectorOpts,
        pushServerOpts,
        cryptoLib,
        transport: new SocketTransport({
          protocol: "wc",
          version: 1,
          url: connectorOpts.bridge!,
          subscriptions: [clientId],
        }),
      });
      draftConnector.clientId = clientId;

      this._connector = draftConnector;
    }

    if (!this._connector.connected) {
      this._connector.createSession().catch(console.error);

      if (this._qrcodeModal instanceof TerraWalletconnectQrcodeModal) {
        this._qrcodeModal.setCloseCallback(() => {
          // got disconnected
          this._address = null;
          this._chainID = null;

          this._triggerListener(EventTypes.Disconnect, null);
        });
      }

      this._initEvents();
    }

    return new Promise<ConnectResponse>((resolve, reject) => {
      this._eventListeners.connect.push((err, payload) => {
        if (err) {
          reject(err);
        } else {
          const address: string = payload.params[0].accounts[0];
          const chainID: string = chainIDs[Number(payload.params[0].chainId)];

          resolve({
            addresses: {
              [chainID]: address,
            },
          });
        }
      });
    });
  }

  async disconnect() {
    if (this._connector && this._connector.connected) {
      try {
        this._connector.killSession();
      } catch (e) {}
    }
    localStorage.removeItem("walletconnect");

    this._address = null;
    this._chainID = null;

    this._triggerListener(EventTypes.Disconnect, null);
  }

  async post(tx: CreateTxOptions) {
    if (!this._connector || !this._connector.connected) {
      throw new Error(`WalletConnect is not connected!`);
    }

    const id = Date.now();

    const serializedTxOptions = {
      msgs: tx.msgs.map((msg) => msg.toJSON(tx.chainID === "columbus-5")),
      fee: tx.fee?.toJSON(tx.chainID === "columbus-5"),
      memo: tx.memo,
      gas: tx.gas,
      gasPrices: tx.gasPrices?.toString(),
      gasAdjustment: tx.gasAdjustment?.toString(),
      //account_number: tx.account_number,
      //sequence: tx.sequence,
      feeDenoms: tx.feeDenoms,
      timeoutHeight: tx.timeoutHeight,
    };

    if (isMobile()) {
      const payload = JSON.stringify({
        id,
        handshakeTopic: this._connector.handshakeTopic,
        method: "post",
        params: serializedTxOptions,
      });
      // FIXME changed walletconnect confirm schema
      window.location.href = `terrastation://walletconnect_confirm/?action=walletconnect_confirm&payload=${Buffer.from(
        payload
      ).toString("base64")}`;
      //window.location.href = `terrastation://wallet_connect_confirm?id=${id}&handshakeTopic=${
      //  connector.handshakeTopic
      //}&params=${JSON.stringify([serializedTxOptions])}`;
    }

    return this._connector
      .sendCustomRequest({
        id,
        method: "post",
        params: [serializedTxOptions],
      })
      .catch((error) => {
        let throwError = error;

        try {
          const { code, message } = JSON.parse(error.message);
          switch (code) {
            case 1:
              throwError = new Error("User denied");
              break;
            case 2:
              throwError = new Error("Create tx failed: " + message);
              break;
            case 3:
              throwError = new Error("Tx failed: " + message);
              break;
            case 4:
              throwError = new Error("WalletConnect timeout: " + message);
              break;
            case 99:
              throwError = new Error("WalletConnect error: " + message);
              break;
          }
        } catch {
          throwError = new Error("WalletConnect error: " + error.message);
        }

        throw throwError;
      });
  }

  async sign(_: CreateTxOptions) {
    throw new Error(`Sign is not suppoprted by Terra Station Mobile`);

    // needed to fix type error
    return {} as any;
  }

  private _listeners: Record<string, ((e: any) => void)[]> = {};

  addListener(event: EventTypes, cb: (data: any) => void) {
    this._listeners[event] = [...(this._listeners[event] ?? []), cb];
  }

  removeListener(event: EventTypes, cb?: (data: any) => void) {
    this._listeners[event]?.filter((callback) => cb !== callback);
  }

  private _triggerListener(event: EventTypes, data: any) {
    this._listeners[event]?.forEach((cb) => cb(data));
  }

  isInstalled = true;

  id = "terra-station-mobile";

  details = {
    name: "Terra Station (Mobile)",
    icon: "https://station-assets.terra.dev/img/walletconnect.svg",
    website: "https://setup.station.money/",
  };
}
