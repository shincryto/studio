'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { aptos } from '@/lib/aptos';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins } from 'lucide-react';

export function WalletBalance() {
  const { account } = useWallet();
  const [aptBalance, setAptBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account?.address) {
        setLoading(true);
        try {
          const amount = await aptos.getAccountAPTAmount({ accountAddress: account.address });
          setAptBalance(amount / 10 ** 8);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setAptBalance(null);
        } finally {
          setLoading(false);
        }
      } else {
        setAptBalance(null);
        setLoading(false);
      }
    };

    fetchBalance();
  }, [account]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Balances</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">APT</span>
          {loading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            <span className="text-lg font-bold">{aptBalance !== null ? aptBalance.toFixed(4) : 'N/A'}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/20 pt-2">
          <span className="text-muted-foreground">ShelbyUSD (Test)</span>
          {loading ? <Skeleton className="h-6 w-24" /> : <span className="text-lg font-bold">0.00</span>}
        </div>
      </CardContent>
    </Card>
  );
}
