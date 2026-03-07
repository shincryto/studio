import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
});

export default shelbyClient;
