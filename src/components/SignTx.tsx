import React, {useState} from 'react'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-kit'
import { MsgSend, Tx } from '@terra-money/feather.js'

export default function SignTx() {
  const connectedWallet = useConnectedWallet()
  const { sign } = useWallet()
  const [signRes, setSignRes] = useState<Tx>()
  
  const fromAddress = connectedWallet && connectedWallet?.addresses['pisco-1']
  const toAddress = 'terra1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq486l9a'

  const signTx = async () => {
    if (!fromAddress) return
    const msg =  new MsgSend(fromAddress, toAddress, { uluna: 1 })
    const res = await sign({ chainID: 'pisco-1',  msgs: [msg]})
    setSignRes(res)
  }

  return (
    <section className='wallet__info'>
      <h4>Sign tx</h4>
      {fromAddress ? (
        <>
          <p>
            Sign send tx to <b>{toAddress}</b>
          </p>
          <button onClick={signTx}>
            Confirm
          </button>
        </>
      ) : (
        <p>Connect your wallet and switch to testnet first</p>
      )}
      {signRes && <p>{JSON.stringify(signRes, null, 2)}</p>}
    </section>
  )
}
