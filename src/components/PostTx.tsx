import React, {useState} from 'react'
import { PostResponse, useConnectedWallet, useWallet } from '@terra-money/wallet-kit'
import { MsgSend } from '@terra-money/feather.js'

export default function PostTx() {
  const connectedWallet = useConnectedWallet()
  const { post } = useWallet()
  const [postRes, setPostRes] = useState<PostResponse>()
  
  const fromAddress = connectedWallet && connectedWallet?.addresses['pisco-1']
  const toAddress = 'terra1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq486l9a'

  const postTx = async () => {
    if (!fromAddress) return
    const msg =  new MsgSend(fromAddress, toAddress, { uluna: 1 })
    const res = await post({ chainID: 'pisco-1',  msgs: [msg]})
    setPostRes(res)
  }

  return (
    <section className='wallet__info'>
      <h4>Post tx</h4>
      {fromAddress ? (
        <>
          <p>
            Send 1uluna to <b>{toAddress}</b>
          </p>
          <button onClick={postTx}>
            Confirm
          </button>
        </>
      ) : (
        <p>Connect your wallet and switch to testnet first</p>
      )}
      {postRes && <p>{JSON.stringify(postRes, null, 2)}</p>}
    </section>
  )
}
