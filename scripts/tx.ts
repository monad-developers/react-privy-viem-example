import { createWalletClient, http, encodeFunctionData, parseEther, toRlp, keccak256, fromHex, toHex, Hex, type Address, type ByteArray, createPublicClient, serializeTransaction, parseGwei } from 'viem';
import { privateKeyToAccount, signTransaction } from 'viem/accounts';
import { mainnet } from 'viem/chains';

// Replace with your private key (or use an env variable)
const PRIVATE_KEY = '0xc3e6f574c05204a317d8c2624c6864099d0e67c3a570c961e393fa37262231be';
const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
})
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http()
});

// Fetch the latest nonce for the account
const nonce = await publicClient.getTransactionCount({ address: account.address });

// Function to manually sign a transaction
async function manuallySignTransaction(to: Address, amount: string) {

// Define the transaction parameters
const transaction = {
    nonce: BigInt(nonce),
    gasPrice: parseEther('0.00000001'), // Example gas price
    gasLimit: BigInt(21000),
    to,
    value: parseEther(amount),
    chainId: BigInt(mainnet.id),
  };

  // EIP-155 encoding (ensure replay protection)
  const unsignedTx = [
    toHex(transaction.nonce),
    toHex(transaction.gasPrice),
    toHex(transaction.gasLimit),
    transaction.to,
    toHex(transaction.value),
    '0x', // Empty data field
    toHex(transaction.chainId), '0x', '0x' // v, r, s placeholders
  ];

  // RLP encode the unsigned transaction
  const rlpEncodedTx = toRlp(unsignedTx as any);
  const txHash = keccak256(rlpEncodedTx);

  // Sign the transaction hash using signMessage
  const signature = await client.signMessage({ message: { raw: fromHex(txHash, 'bytes') as ByteArray } });
  
  // Extract r, s, and v values from the signature
  const r = '0x' + signature.slice(2, 66);
  const s = '0x' + signature.slice(66, 130);
  let v = parseInt(signature.slice(130, 132), 16);
  
  // Adjust v for EIP-155
  v += Number(transaction.chainId) * 2 + 35;

  // Final signed transaction with v, r, s
  const signedTx = [...unsignedTx.slice(0, -3), toHex(v), r, s];
  const serializedSignedTx = toRlp(signedTx as any);

  return serializedSignedTx;
}

// Example usage
(async () => {
  const toAddress: Address = '0x9B53fc3f2e0B2f756Cf0Db93c6798d47B517AEB0'; // Replace with a valid address
  const amount = '1'; // Amount in ETH
  
  const signedTransaction = await manuallySignTransaction(toAddress, amount);
  console.log('Signed Transaction:', signedTransaction);

  // 0xf86c008502540be400825208949b53fc3f2e0
  // b2f756cf0db93c6798d47b517aeb0880de0b6b3
  // a76400008041a0c3dc0cd58314ef0bd61162993
  // c7f7189fbbbe5d63cd6ef5becf12f6b55706281
  // a00c1de395b8565bd45ea37f2397df586ca7a99
  // 7eff8e35bd7386d38458e30ab0a

  // 0xf86a808502540be40080949b53fc3f2e0b2f7
  // 56cf0db93c6798d47b517aeb0880de0b6b3a764
  // 00008026a0ab01f7220ed622cca5f6945487bd7
  // ccf6c1a8ae0b74833bbaf74dcd8c4cdc135a03d
  // 101eb9a28d884df39b7b6ef683afde16505cbbc
  // 7b0d3a3e2c8a3eadf732dfd
  // 0xf86c008502540be400825208949b53fc3f2e0
  // b2f756cf0db93c6798d47b517aeb0880de0b6b3
  // a76400008041a0c3dc0cd58314ef0bd61162993
  // c7f7189fbbbe5d63cd6ef5becf12f6b55706281
  // a00c1de395b8565bd45ea37f2397df586ca7a99
  // 7eff8e35bd7386d38458e30ab0a

    const signatureChecked = await account.signTransaction({
        nonce,
        gasPrice: parseEther('0.00000001'),
        gasLimit: toHex(21000) as Hex,
        to: toAddress,
        value: parseEther(amount),
        chainId: mainnet.id,
    })
  console.log('Check Signature:', signatureChecked);
  console.log(signedTransaction == signatureChecked); // is currently false
})();
