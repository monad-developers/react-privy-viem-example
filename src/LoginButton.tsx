// Hooks
import { useState } from "react";
import { useActiveAccount, useConnect } from "thirdweb/react";


// Utils
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { hasStoredPasskey } from "thirdweb/wallets/in-app";

const client = createThirdwebClient({ clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID });

export default function LoginButton() {
    const { connect } = useConnect()
    const account = useActiveAccount();
      
    const [loginLoading, setLoginLoading] = useState(false);
    
    const handleLogin = async () => {
        setLoginLoading(true);
    
        try {
            await connect(async () => {
                const wallet = inAppWallet({
                    auth: {
                        options: ["passkey"],
                    },
                });
                const hasPasskey = await hasStoredPasskey(client);
                await wallet.connect({
                    client,
                    strategy: "passkey",
                    type: hasPasskey ? "sign-in" : "sign-up",
                });
                return wallet;
            });

            setLoginLoading(false);
          
        } catch(err) {
            console.log("Problem logging in: ", err);
            setLoginLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleLogin}>Login</button>
            {
                account
                    ? <p>Logged in as: {account.address}</p>
                    : loginLoading
                        ? <p>signing in...</p>
                        : <></>
            }
        </div>
    )
}