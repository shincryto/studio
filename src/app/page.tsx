'use client';

import { Header } from "@/components/header";
import { FileUploader } from "@/components/file-uploader";
import { Features } from "@/components/features";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletBalance } from "@/components/wallet-balance";
import { UploadHistory } from "@/components/upload-history";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              Shelby Drive
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              The first decentralized hot storage network on Aptos. <br /> Fast, censorship-resistant, and globally distributed.
            </p>
          </div>
          
          {connected && (
            <div className="grid gap-8">
              <WalletBalance />
              <FileUploader />
              <UploadHistory />
            </div>
          )}

          {!connected && (
             <FileUploader />
          )}
          
          <Features />
        </div>
      </main>
    </div>
  );
}
