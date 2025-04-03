import { monadTestnet } from "./chain";
import { client } from "./client";
import { getRpcClient } from "thirdweb";

export const rpcRequest = getRpcClient({ client, chain: monadTestnet });