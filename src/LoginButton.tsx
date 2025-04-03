// Hooks
import { usePrivy, useLogin, useLogout } from "@privy-io/react-auth";

export default function LoginButton() {

    const { login } = useLogin();
    const { logout } = useLogout();

    const { user, authenticated } = usePrivy();
    console.log(user && authenticated);

    return (
        <div>
            {
                (user && authenticated) 
                    ?   <div>
                            <button onClick={logout}>Logout</button>
                            <p>Logged in as: {user?.wallet?.address}</p>
                        </div>
                    :   <button onClick={login}>Login</button>
            }
        </div>
    )
}