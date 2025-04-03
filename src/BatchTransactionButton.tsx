// Hooks
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";


// Utils
import { client } from "./client";
import { eth_getTransactionCount, getContract, Hex, prepareContractCall, prepareTransaction, sendAndConfirmTransaction, sendTransaction } from "thirdweb";
import { monadTestnet } from "./chain";
import { rpcRequest } from "./rpcClient";

export default function BatchTransactionButton() {
    const account = useActiveAccount();

    const sessionId: Hex = "0xe1bdfb4296577d9d2c50ae1732c8efc3d34f9bd4d33f905b4a910860d39d20b9";
    const inputs: bigint[] = [
        // 452312848583266388373324160190187140051835877600467938288952532612520345602n,
        // 904625697166532776746648320380374280103671775483035995219970316859944730624n,
        // 1356938545749799165119972480570561420155507653162113126021775068220121677826n,
        20440865928735611388958095704064n,
        904625697166532776746648320380374280105011367869975509630224236458469752832n,
        452312848583266388373324160190187140051835877600467938289168705386061168641n,
        1356938545749799165119972480570561420155507632800475364578206792838916670209n,
        5212737724482415740305187253780480n
    ]

    async function sendTxWithRetry(preparedTx: any, index: number) {

        if(!account) {
            alert("Not signed in.")
            return;
        }

        sendTransaction({
            account,
            transaction: preparedTx
        })
        .then(res => {
            console.log(`SUCCESS-${index} Played move at transaction ${index}: ${res.transactionHash}`);
            return res;
        })
        .catch(async e => {
            console.log(`Failure while playing move ${index}: ${e.message}. Retrying.`);
            await new Promise(resolve => setTimeout(resolve, 100 * index));
            sendTxWithRetry(preparedTx, index);
        })
    }
    
    const handleBatchTransaction = async () => {
        if(!account) {
            alert("Not signed in.")
            return;
        }

        const nonce = await eth_getTransactionCount(rpcRequest, { address: account.address })
        const startTime = Date.now();

        try {
            inputs.map(async (board, index) => {
                const nonceForTransaction = nonce + index;
                console.log("Submitting transaction with nonce: ", nonceForTransaction);

                sendTxWithRetry(prepareContractCall({
                    contract: getContract({
                        client,
                        chain: monadTestnet,
                        address: "0xD9d6C523BF597e82D5247aB7CA1104215B73e5Bc"
                    }),
                    method: "function play(bytes32 sessionId, uint256 result)",
                    params: [sessionId, board],
                    nonce: nonceForTransaction
                }), index);

                // sendTransaction({
                //     account,
                //     transaction: prepareContractCall({
                //         contract: getContract({
                //             client,
                //             chain: monadTestnet,
                //             address: "0xD9d6C523BF597e82D5247aB7CA1104215B73e5Bc"
                //         }),
                //         method: "function play(bytes32 sessionId, uint256 result)",
                //         params: [sessionId, board],
                //         nonce: nonceForTransaction
                //     })
                // })
                // .then(res => {
                    // console.log(`Played move at transaction ${index}: ${res.transactionHash} in ${Date.now() - startTime} ms`);
                //     return res;
                // })
                // .catch(e => {
                //     console.log(`Failure while playing move ${index}: ${e.message} in ${Date.now() - startTime} ms`);
                // })
            })

            console.log(`Played all moves in ${Date.now() - startTime} ms`);
          
        } catch(err) {
            console.log("Problem making batch txs: ", err);
        }
    };

    return (
        <div>
            <button onClick={handleBatchTransaction}>Batch Transaction</button>
            <p>Open console for results!</p>
        </div>
    )
}