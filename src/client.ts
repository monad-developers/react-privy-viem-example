import { monadTestnet } from 'viem/chains'
import { http, createPublicClient } from 'viem'
 
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})