// Hooks
import { useWallets } from "@privy-io/react-auth";

// Utils
import { publicClient } from "../utils/publicClient";
import { STRICT_COUNTER_ADDRESS } from "../utils/constants";

import { monadTestnet } from "viem/chains";
import { createWalletClient, custom, encodeFunctionData, Hex } from "viem";

export default function BatchSignTransactionButton() {

    const { ready, wallets } = useWallets();
    
    const handleBatchTransaction = async () => {
        const batch = 25;
        console.log(`Processing a batch of ${batch} transactions!`);

        if (!ready || !wallets) {
            alert("Cannot detect wallet.");
            return;
        }

        const userWallet = wallets.find((w) => w.walletClientType == "privy");
        if(!userWallet) {
            alert("Cannot detect privy wallet.")
            return;
        }

        try {
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

            const currentNumber = await publicClient.readContract({
                address: STRICT_COUNTER_ADDRESS,
                abi: [
                    {
                        "type": "function",
                        "name": "number",
                        "inputs": [],
                        "outputs": [
                            {
                                "name": "",
                                "type": "uint256",
                                "internalType": "uint256"
                            }
                        ],
                        "stateMutability": "view"
                    }
                ],
                functionName: 'number',
            })
            console.log("Fetched current number on contract: ", currentNumber.toString());

            // Warm up the provider (server) before posting a batch in Promise.all.
            // The first run takes ~570ms. Subsequent runs take ~65ms.
            console.log("Now signing transactions!");

            const startTime = Date.now();

            const sig0 = await provider.signTransaction({
                account: userWallet.address as Hex,
                nonce: nonce,
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
                    args: [currentNumber + BigInt(1)]
                })
            })
            console.log(`Signed transaction number: 0`)

            const signedTxsPromises: Promise<Hex>[] = Array(batch).fill("0x").map(async (_, index) => {  
                if(index ==  0) {
                    return sig0;
                }
                const signature = await provider.signTransaction({
                    account: userWallet.address as Hex,
                    nonce: nonce + index,
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
                        args: [currentNumber + BigInt(index + 1)]
                    })
                })
                console.log(`Signed transaction number: ${index}`)

                return signature;
            })
            const signedTxs: Hex[] = await Promise.all(signedTxsPromises);
            console.log(`Signed txs in ${Date.now() - startTime} ms`);
            console.log(signedTxs)

        } catch(err) {
            console.log("Error making batched transaction: ", err)
            alert(`Problem making batch txs`);
        }
    };

    return (
        <div>
            <button onClick={handleBatchTransaction}>Batch Sign Transactions</button>
            <p>Open console for results!</p>
        </div>
    )
}