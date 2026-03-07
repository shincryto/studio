'use client';
import type { FC, PropsWithChildren } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Network } from '@aptos-labs/ts-sdk';

const queryClient = new QueryClient();

export const AppProviders: FC<PropsWithChildren> = ({ children }) => {
  const wallets = [new PetraWallet()];
  
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider 
        plugins={wallets} 
        autoConnect={true}
        dappConfig={{
          network: Network.TESTNET,
          aptosApiKeys: {
            testnet: process.env.NEXT_PUBLIC_APTOS_TESTNET_API_KEY,
          }
        }}
        onError={(error) => {
          console.error("Wallet connection error:", error);
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
};
