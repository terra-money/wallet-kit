import { WalletProviderStatus, useWallet } from '@terra-money/wallet-kit'
import './styles/index.scss'
import ConnectWallet from './components/ConnectWallet'

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
              case WalletProviderStatus.NOT_CONNECTED:
                return <p className='not__installed'>NOT CONNECTED</p>
              case WalletProviderStatus.CONNECTED:
                return <p className='installed'>CONNECTED</p>
              case WalletProviderStatus.INITIALIZING:
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
      </main>
    </div>
  )
}

export default App
