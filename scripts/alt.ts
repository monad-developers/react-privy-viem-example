import { createWalletClient, http, parseEther, keccak256, serializeTransaction, createPublicClient, Hex, parseGwei } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const account = privateKeyToAccount("0xc3e6f574c05204a317d8c2624c6864099d0e67c3a570c961e393fa37262231be")

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
})

const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
})

const nonce = await publicClient.getTransactionCount({ address: account.address })

async function createSignedTransaction(to: `0x${string}`, amount: string) {
  // Setup client and account
  const senderAddress = account.address

  // Get chain parameters
  const chainId = await client.getChainId()
  const gasPriceResult = parseGwei("10")// await client.getGasPrice()
  const estimatedGas = BigInt(21000)

  // Build unsigned transaction
  const unsignedTx = {
    to,
    value: parseEther(amount),
    nonce,
    gasPrice: gasPriceResult,
    gas: estimatedGas,
    chainId
  }

  // Serialize and hash transaction
  const serializedTx = serializeTransaction(unsignedTx)
  const txHash = keccak256(serializedTx)

  // Sign the transaction hash
  const signature = await client.signMessage({
    account,
    message: { raw: txHash }
  })

  // Split signature components
  const r: Hex = `0x${signature.slice(2, 66)}`
  const s: Hex = `0x${signature.slice(66, 130)}`
  let v = BigInt(`0x${signature.slice(130, 132)}`)

  // Apply EIP-155 signature adjustment
  if (chainId !== 0) {
    v += BigInt(chainId) * BigInt(2) + BigInt(8)
  }

  // Create signed transaction
  const signedTransaction = serializeTransaction(unsignedTx, {
    r,
    s,
    v
  })

  return signedTransaction
}

// Example usage
const signedTx = await createSignedTransaction('0x234828a40de63d21072D1218cFb5D208654C12Bb', '0.1')
console.log("Signed: ", signedTx);

const chainId = await client.getChainId()
const check = await account.signTransaction({
    to: "0x234828a40de63d21072D1218cFb5D208654C12Bb",
    value: parseEther("0.1"),
    nonce,
    gasPrice: parseGwei("10"),
    gas: BigInt(21000),
    chainId 
})

console.log("Check: ", check)

console.log(signedTx === check)