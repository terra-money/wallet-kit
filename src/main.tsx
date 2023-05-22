import React from 'react'
import ReactDOM from 'react-dom'
import 'styles/index.scss'
import {
  WalletProvider,
  getInitialConfig,
  useWallet,
  WalletStatus
} from '@terra-money/wallet-kit'

import ConnectWallet from 'components/ConnectWallet'
import PostTx from 'components/PostTx'
import SignTx from 'components/SignTx'

function App() {
  const { network, status } = useWallet()

  return (
    <div>
      <header>
        <h2>Wallet Kit</h2>
      </header>
      <main>
        <section className='wallet__details'>
          {(() => {
            switch (status) {
              case WalletStatus.NOT_CONNECTED:
                return <p className='not__installed'>NOT CONNECTED</p>
              case WalletStatus.CONNECTED:
                return <p className='installed'>CONNECTED</p>
              case WalletStatus.INITIALIZING:
                return <p className='initializing'>INITIALIZING</p>
            }
          })()}
        </section>
        <section className='wallet__info'>
          <h4>Network info:</h4>
          <code>
            <pre>{JSON.stringify(network, null, 2)}</pre>
          </code>
        </section>
        <ConnectWallet />
        <PostTx />
        <SignTx />
      </main>
    </div>
  )
}

getInitialConfig().then((defaultNetworks) =>
  ReactDOM.render(
    <WalletProvider defaultNetworks={defaultNetworks}>
      <App />
    </WalletProvider>,
    document.getElementById('root'),
  ),
)
