'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ChevronDown, Copy, LogOut, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export function ConnectWalletButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Address copied to clipboard!' });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isClient) {
    // Return a disabled button or a skeleton during server-side rendering and hydration
    return (
       <Button disabled>
         <Wallet className="mr-2" />
         Connect Wallet
       </Button>
    )
  }

  if (connected && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {formatAddress(account.address)}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            {formatAddress(account.address)}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(account.address)}>
              <Copy className="h-4 w-4" />
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col space-y-2">
          {wallets?.length > 0 ? (
            wallets.map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="h-12 justify-start gap-4 px-4"
                onClick={() => connect(wallet.name)}
              >
                <img src={wallet.icon} alt={wallet.name} className="h-6 w-6" />
                {wallet.name}
              </Button>
            ))
          ) : (
             <p className="py-4 text-center text-sm text-muted-foreground">
              No wallets found. Please install an Aptos-compatible wallet extension.
             </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
