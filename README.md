# Wallet Kit

Library to make React dApps easier using Station Extension or Station Mobile.

# Quick Start

Use templates to get your projects started quickly

### Create React App

```sh
npx terra-templates get wallet-provider:create-react-app your-app-name
cd your-app-name
yarn install
yarn start
```

<https://github.com/terra-money/wallet-kit/tree/main/templates/create-react-app>

# Basic Usage

First, please add `<meta name="terra-wallet" />` on your html page.

Since then, browser extensions (e.g. Station chrome extension) will not attempt to connect in a Web app where this `<meta name="terra-wallet">` tag is not found.

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

# API

<details>

<summary><code>&lt;WalletProvider&gt;</code></summary>
  
By default, `WalletProvider` supports chains and networks contained in the [station-assets](https://github.com/terra-money/station-assets/tree/main/chains) repository as returned by `getInitialConfig`. You can modify these by passing your own defaultNetworks object. 

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
export interface Wallet {
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
  connect: (id?: string) => <void>
  /**
   * use connect in conjunction with availablewallets to connect the wallet to the web page
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
   * reload the connected wallet states
   *
   * in this time, this only work on the ConnectType.EXTENSION
   *
   * @see WalletController#refetchStates
   */
    post: (tx: createTxOptions) => Promise<PostResponse>;
  /**
   * post transaction
   *
   * @example
   * ```
   * const { post } = useWallet()
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: PostResponse = await post({...txOptions})
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
   * @param { ExtensionOptions } tx transaction data
   * @param terraAddress - does not work at this time. for the future extension
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
   *
   * const callback = useCallback(async () => {
   *   try {
   *    const result: SignResult = await sign({...ExtensionOptions})
   *
   *    // Broadcast SignResult
   *    const tx = result.result
   *
   *    const lcd = new LCDClient({
   *      chainID: connectedWallet.network.chainID,
   *      URL: connectedWallet.network.lcd,
   *    })
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
   * @param { ExtensionOptions } tx transaction data
   * @param terraAddress - does not work at this time. for the future extension
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

  
  
  
  // stop here
<summary><code>useLCDClient()</code></summary>

```jsx
import { useLCDClient } from '@terra-money/wallet-kit';

function Component() {
  const lcd = useLCDClient();

  const [result, setResult] = useState('');

  useEffect(() => {
    lcd.treasury.taxRate().then((taxRate) => {
      setResult(taxRate.toString());
    });
  }, []);

  return <div>Result: {result}</div>;
}
```

</details>

# Links

- [Releases (Changelog)](https://github.com/terra-money/wallet-provider/releases)

# Trouble-shooting guide

wallet-provider contains the original source codes in sourcemaps.

<img src="https://raw.githubusercontent.com/terra-money/wallet-provider/main/readme-assets/trouble-shooting-guide.png" width="700" style="max-width: 100%" alt="Trouble-Shooting Guide" />

You can check `src/@terra-money/wallet-provider/` in the Chrome Devtools / Sources Tab, and you can also use breakpoints
here for debug.

(It may not be visible depending on your development settings such as Webpack.)

# For Chrome Extension compatible wallet developers

<details>

<summary><code>Chrome Extension compatible wallet development guide</code></summary>

### 1. Create dApp for test

There is the `dangerously__chromeExtensionCompatibleBrowserCheck` option to allow you to create a test environment for
wallet development.

By declaring the `dangerously__chromeExtensionCompatibleBrowserCheck`, you can make your wallet recognized as the chrome
extension.

```jsx
<WalletProvider
  dangerously__chromeExtensionCompatibleBrowserCheck={(userAgent) =>
    /YourWallet/.test(userAgent)
  }
>
  ...
</WalletProvider>
```

### 2. Register your wallet as default allow

If your wallet has been developed,

Please send me your wallet App link (Testlight version is OK)

And send me Pull Request by modifying `DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK` in
the `packages/src/@terra-money/wallet-provider/env.ts` file. (or just make an issue is OK)

```diff
export const DEFAULT_CHROME_EXTENSION_COMPATIBLE_BROWSER_CHECK = (userAgent: string) => {
-  return /MathWallet\//.test(userAgent);
+  return /MathWallet\//.test(userAgent) || /YourWallet/.test(userAgent);
}
```

</details>
