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
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ChevronDown, Copy, LogOut } from 'lucide-react';
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

  const petraWallet = wallets.find(wallet => wallet.name === 'Petra');

  const handleConnect = () => {
    if (petraWallet) {
      connect(petraWallet.name);
    } else {
      toast({
        variant: 'destructive',
        title: 'Petra Wallet not found',
        description: 'Please install the Petra Wallet extension.',
      });
      window.open('https://petra.app/', '_blank');
    }
  };

  return (
    <Button onClick={handleConnect}>
      {isClient && petraWallet && <img src={petraWallet.icon} alt={petraWallet.name} width={24} height={24} className="mr-2" />}
      Connect Petra
    </Button>
  );
}
