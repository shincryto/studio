import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

let shelbyClient: ShelbyClient | null = null;

const getShelbyClient = (): ShelbyClient | null => {
  if (typeof window === "undefined") {
    // The SDK is browser-only, so we return null on the server.
    return null;
  }
  if (!shelbyClient) {
    shelbyClient = new ShelbyClient({
      network: Network.TESTNET,
      apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
      indexer: {
        endpoint: "https://api.testnet.aptoslabs.com/v1/graphql",
      },
    });
  }
  return shelbyClient;
};

export default getShelbyClient;
