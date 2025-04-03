// Hooks
import { useWallets } from "@privy-io/react-auth";

// Utils
import { monadTestnet } from "viem/chains";
import { createWalletClient, custom, Hex } from "viem";

export default function SignMessageButton() {

    const { ready, wallets } = useWallets();
    
    const handleSignMessage = async () => {

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
            
            console.log("Signing message!");
            
            const signature = await provider.signMessage({ account: userWallet.address as Hex, message: "Hello" })
            console.log(`Signed message: ${signature}`)
            console.log(`Processed transaction in ${Date.now() - startTime} ms`);
        
        } catch(err) {
            console.log("Error signing transaction: ", err)
            alert(`Problem signing txs`);
        }
    };

    return (
        <div>
            <button onClick={handleSignMessage}>Call signMessage</button>
            <p>Open console for results!</p>
        </div>
    )
}