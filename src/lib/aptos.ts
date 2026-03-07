import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  clientConfig: {
    API_KEY: process.env.NEXT_PUBLIC_APTOS_TESTNET_API_KEY,
  },
  fullnode: "https://fullnode.testnet.aptoslabs.com/v1",
});
export const aptos = new Aptos(aptosConfig);
