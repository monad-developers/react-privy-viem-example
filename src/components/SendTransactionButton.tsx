// Hooks
import { useWallets } from "@privy-io/react-auth";

// Utils
import { monadTestnet } from "viem/chains";
import { createWalletClient, custom, Hex } from "viem";

export default function SignTransactionButton() {

    const { ready, wallets } = useWallets();
    
    const handleSendTransaction = async () => {

        if (!ready || !wallets) {
            alert("Cannot detect wallet.");
            return;
        }
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
            
            console.log("Sending transaction!");
            
            const txHash = await provider.sendTransaction({
                account: userWallet.address as Hex,
                to: userWallet.address as Hex,
            })
            console.log(`Sent transaction: ${txHash}`)
            console.log(`Processed transaction in ${Date.now() - startTime} ms`);
        
        } catch(err) {
            console.log("Error sending transaction: ", err)
            alert(`Problem sending txs`);
        }
    };

    return (
        <div>
            <button onClick={handleSendTransaction}>Call sendTransaction</button>
            <p>Open console for results!</p>
        </div>
    )
}