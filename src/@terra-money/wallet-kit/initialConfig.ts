import { InfoResponse } from '@terra-money/wallet-interface'
import axios from 'axios'

export async function getInitialConfig() {
  const { data } = await axios.get<Record<string, InfoResponse>>(
    'https://station-assets.terra.money/chains.json',
  )
  return data.mainnet
}
