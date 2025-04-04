// Hooks
import { useWallets } from "@privy-io/react-auth";

// Utils
import { post } from "../utils/fetch";
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
            
            console.log("Now signing transactions!");
            const startTime = Date.now();

            const signedTxs: Hex[] = [];
            for(let i = 0; i < batch; i++) {
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
                        args: [currentNumber + BigInt(i + 1)]
                    })
                })
                console.log(`Signed transaction number: ${i}: ${signature}`)
                signedTxs.push(signature);
            }
            console.log(`Processed transactions in ${Date.now() - startTime} ms`);
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