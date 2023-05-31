# Wallet Kit

A library for interacting with Station from React dApps. Additional features like signBytes, suggestNetwork, and switchNetwork are coming soon.

## Basic Usage

First, please add `<meta name="terra-wallet" />` on your html page.

Browser extensions (e.g. Station chrome extension) will not attempt to connect in a Web app where this `<meta name="terra-wallet">` tag is not found.

```html
<html lang="en">
  <head>
    <meta name="terra-wallet" />
  </head>
</html>
```

The implementation of `WalletProvider` and `useWallet` is similar to `react-router-dom`'s `<BrowserRouter>`, `useLocation()`.

```jsx
import {
  WalletProvider,
  getInitialConfig,
} from '@terra-money/wallet-kit'
import React from 'react';
import ReactDOM from 'react-dom';

// getInitialConfig(): Promise<{ defaultNetworks }>
getInitialConfig().then((defaultNetworks) =>
  ReactDOM.render(
    <WalletProvider defaultNetworks={defaultNetworks}>
      <App />
    </WalletProvider>,
    document.getElementById('root'),
  ),
)
  
```
First, wrap your React application with the `<WalletProvider>` component.

```jsx
import { useWallet } from '@terra-money/wallet-kit';
import React from 'react';

function Component() {
  const { status, network, availableWallets } = useWallet();

  return (
    <div>
      <section>
        <pre>
          {JSON.stringify(
            {
              status,
              network,
              availableWallets,
            },
            null,
            2,
          )}
        </pre>
      </section>
    </div>
  );
}
```

Then, you can use hooks from `wallet-kit` like `useWallet()`, `useConnectedWallet()` and `useLCDClient()` anywhere in your app.

## Key Differences with Wallet-Provider

- `useWallet()` returns `WalletResponse` instead of `Wallet` 
  - `availableWallets` instead of `availableConnectTypes` and `availableInstallTypes` and doesn't return `supportFeatures`.
  - other features like `supportFeatures` and `addNetwork` are not currently available 
- wallet addresses are now found in `ConnectResponse` from `useConnectedWallet()`. `ConnectResponse` also now returns the wallet and network name.

## API

<details>

<summary><code>&lt;WalletProvider&gt;</code></summary>
  
By default, `WalletProvider` supports chains and networks contained in the [station-assets](https://github.com/terra-money/station-assets/tree/main/chains) repository as returned by `getInitialConfig`. You can modify these by passing your own defaultNetworks. 

```jsx
import { WalletProvider, InfoResponse, Wallet } from '@terra-money/wallet-kit';

// network information
const defaultNetworks: InfoResponse = {
  'phoenix-1': {
    chainID: 'phoenix-1',
    gasAdjustment: 1.75,
    gasPrices: {
      uluna: 0.015,
    },
    lcd: 'https://phoenix-lcd.terra.dev',
    prefix: 'terra',
  },
  'osmosis-1' : {
  ...
  }
};
```
  
`WalletProvider` includes Station wallet by default. You can pass additional wallets that implement the `Wallet` interface.
```
const extraWallet: Wallet = {
  id: 'extra-wallet,
  isInstalled: !!window?.isExtraWalletInstalled,
  ...
  // methods to connect, post/sign transactions, add/remove listeners
  ...
  details: {
    name: 'extra-wallet'
    ...
  }
}
  

ReactDOM.render(
  <WalletProvider
    defaultNetworks={defaultNetworks}
    extraWallets={extraWallet}
  >
    <App />
  </WalletProvider>,
  document.getElementById('root'),
);
```

</details>

<details>

<summary><code>useWallet()</code></summary>

This is a hook used to trigger core wallet functionality. 

````ts
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
````

<!-- /source -->

</details>

<details>

<summary><code>useConnectedWallet()</code></summary>

```jsx
import { useConnectedWallet } from '@terra-money/wallet-kit'

function Component() {
  const connected = useConnectedWallet()
  
  if (!connected) return <div> Not Connected </div>
  
  const isLedger = connected.ledger
  const walletName = connected.name
  const networkName = connected.network // mainnet, testnet, classic, localterra
  
  return (
  <>
    <div> name: {walletName} network: {networkName} ledger: {isLedger} </div>
    {Object.keys(connected.addresses).map((chainID) => <p> connected.addresses[chainID] </p>)}
  </>
  )
}
```

</details>

<details>
<summary><code>useLCDClient()</code></summary>

```jsx
import { useLCDClient } from '@terra-money/wallet-kit';

function Component() {
  const lcd = useLCDClient();

  const [result, setResult] = useState('');
  useEffect(() => {
    lcd.tx.estimateFee(signer, txOptions).then((fee) => {
      setResult(fee.toString());
    });
  }, []);

  return <div>Result: {result}</div>;
}
```

</details>
