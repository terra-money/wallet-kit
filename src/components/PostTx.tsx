import React from 'react'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-kit'
import { MsgSend } from '@terra-money/feather.js'

export default function PostTx() {
  const connectedWallet = useConnectedWallet()
  const { post } = useWallet()

  return (
    <section className='wallet__info'>
      <h4>Post tx:</h4>
      {connectedWallet && connectedWallet.addresses['pisco-1'] ? (
        <>
          <p>
            Send 1uluna to <b>terra1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq486l9a</b>
          </p>
          <button
            onClick={() =>
              post({
                chainID: 'pisco-1',
                msgs: [
                  new MsgSend(
                    connectedWallet.addresses['pisco-1'],
                    'terra1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq486l9a',
                    { uluna: 1 },
                  ),
                ],
              })
            }
          >
            Confirm
          </button>
        </>
      ) : (
        <p>Connect your wallet and switch to testnet first</p>
      )}
    </section>
  )
}
