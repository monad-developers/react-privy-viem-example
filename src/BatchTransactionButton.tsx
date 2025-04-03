// Hooks
import { usePrivy, useWallets } from "@privy-io/react-auth";

// Utils
import { post } from "./fetch";
import { publicClient } from "./client";
import { monadTestnet } from "viem/chains";
import { createWalletClient, custom, encodeFunctionData, Hex } from "viem";
import { STRICT_COUNTER_ADDRESS } from "./constants";

export default function BatchTransactionButton() {

    const { user } = usePrivy();
    const { ready, wallets } = useWallets();
    
    const handleBatchTransaction = async () => {
        const batch = 1;
        console.log(`Processing a batch of ${batch} transactions!`);

        if(!user) {
            alert("Not signed in.")
            return;
        }

        if (!ready || !wallets) {
            alert("Cannot detect wallet.");
            return;
          }

        if(!user.wallet) {
            alert("Cannot detect wallet.");
            return;
        }
        console.log("Wallet detected.");

        
        const startTime = Date.now();
        try {
            const userWallet = wallets.find((w) => w.walletClientType == "privy");
            if(!userWallet) {
                throw new Error("Privy wallet not detected");
            }
            const ethereumProvider = await userWallet.getEthereumProvider();
            const provider = createWalletClient({
                chain: monadTestnet,
                transport: custom(ethereumProvider),
            });
            
            await userWallet.switchChain(monadTestnet.id);

            const nonce = await publicClient.getTransactionCount({  
                address: userWallet.address as Hex,
            })
            console.log("Wallet nonce: ", nonce);

            // const currentNumber = await publicClient.readContract({
            //     address: STRICT_COUNTER_ADDRESS,
            //     abi: [
            //         {
            //             "type": "function",
            //             "name": "number",
            //             "inputs": [],
            //             "outputs": [
            //                 {
            //                     "name": "",
            //                     "type": "uint256",
            //                     "internalType": "uint256"
            //                 }
            //             ],
            //             "stateMutability": "view"
            //         }
            //     ],
            //     functionName: 'number',
            // })
            const currentNumber = BigInt(0);
            console.log("Fetched current number on contract: ", currentNumber.toString());
            
            console.log("Now signing transactions!");
            const signedTxs: Hex[] = [];
            for(let i = 0; i < batch; i++) {
                console.log(`Hello from ${i}`)
                const signature = await provider.signTransaction({
                    account: userWallet.address as Hex,
                    nonce: nonce + i,
                    to: STRICT_COUNTER_ADDRESS,
                    data: encodeFunctionData({
                        abi: [
                            {
                                "type": "function",
                                "name": "update",
                                "inputs": [
                                    {
                                        "name": "newNumber",
                                        "type": "uint256",
                                        "internalType": "uint256"
                                    }
                                ],
                                "outputs": [],
                                "stateMutability": "nonpayable"
                            }
                        ],
                        functionName: "update",
                        args: [currentNumber + BigInt(++i)]
                    })
                })
                console.log(`Signed transaction number: ${i}: ${signature}`)

                signedTxs.push(signature);
            }
            // const signedTxs: Hex[] = await Promise.all((new Array(batch).fill("")).map(async (_, index) => {
            //     console.log(`Hello from ${index}`)
            //     const signature = await provider.signTransaction({
            //         account: userWallet.address as Hex,
            //         nonce: nonce + index,
            //         to: STRICT_COUNTER_ADDRESS,
            //         data: encodeFunctionData({
            //             abi: [
            //                 {
            //                     "type": "function",
            //                     "name": "update",
            //                     "inputs": [
            //                         {
            //                             "name": "newNumber",
            //                             "type": "uint256",
            //                             "internalType": "uint256"
            //                         }
            //                     ],
            //                     "outputs": [],
            //                     "stateMutability": "nonpayable"
            //                 }
            //             ],
            //             functionName: "update",
            //             args: [currentNumber + BigInt(++index)]
            //         })
            //     })
                
            //     console.log(`Signed transaction number: ${index}`)
            //     return signature;
            // }))
            
            // console.log("Signed all transactions! Preparing JSON RPC params...");
            // const params = signedTxs.map(signedTx => {
            //     return {
            //         jsonrpc: "2.0",
            //         id: 1,
            //         method: "eth_sendRawTransaction",
            //         params: [signedTx],
            //     }
            // })

            // const result = await post({
            //     url: monadTestnet.rpcUrls.default.http[0],
            //     params
            // })
            // console.log("Batched request response: ", result);
            
            console.log(`Processed transactions in ${Date.now() - startTime} ms`);
        
        } catch(err) {
            console.log("Error making batched transaction: ", err)
            alert(`Problem making batch txs`);
        }
    };

    return (
        <div>
            <button onClick={handleBatchTransaction}>Batch Transaction</button>
            <p>Open console for results!</p>
        </div>
    )
}