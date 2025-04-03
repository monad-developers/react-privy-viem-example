// Hooks
import { useWallets } from "@privy-io/react-auth";

// Utils
import { monadTestnet } from "viem/chains";
import { createWalletClient, custom, Hex } from "viem";

export default function SignTransactionButton() {

    const { ready, wallets } = useWallets();
    
    const handleSignTransaction = async () => {

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
            
            console.log("Signing transaction!");
            
            const signature = await provider.signTransaction({
                account: userWallet.address as Hex,
                to: userWallet.address as Hex,
            })
            console.log(`Signed transaction: ${signature}`)
            console.log(`Processed transaction in ${Date.now() - startTime} ms`);
        
        } catch(err) {
            console.log("Error signing transaction: ", err)
            alert(`Problem signing txs`);
        }
    };

    return (
        <div>
            <button onClick={handleSignTransaction}>Call signTransaction</button>
            <p>Open console for results!</p>
        </div>
    )
}