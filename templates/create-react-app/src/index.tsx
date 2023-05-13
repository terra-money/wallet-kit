import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { getInitialConfig, WalletProvider } from '@terra-money/wallet-kit'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

getInitialConfig().then((defaultNetworks) =>
  root.render(
    <React.StrictMode>
      <WalletProvider defaultNetworks={defaultNetworks}>
        <App />
      </WalletProvider>
    </React.StrictMode>,
  ),
)
