import { useConnectedWallet, useWallet } from '@terra-money/wallet-kit'

export default function ConnectWallet() {
  const connectedWallet = useConnectedWallet()
  const { connect, availableWallets } = useWallet()

  return (
    <section className='wallet__info'>
      <h4>Connect info:</h4>
      {connectedWallet ? (
        <code>
          <pre>{JSON.stringify(connectedWallet, null, 2)}</pre>
        </code>
      ) : (
        availableWallets.map(({ id, name, isInstalled }) => (
          <button onClick={() => connect(id)} disabled={!isInstalled} key={id}>
            Connect {name}
          </button>
        ))
      )}
    </section>
  )
}
