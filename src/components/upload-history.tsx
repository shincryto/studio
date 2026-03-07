'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getHistory, type UploadEntry } from '@/lib/history';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, FileText, History } from 'lucide-react';

const EXPLORER_URL = 'https://explorer.aptoslabs.com/txn/{txHash}?network=testnet';

export function UploadHistory() {
  const [history, setHistory] = useState<UploadEntry[]>([]);

  useEffect(() => {
    const loadHistory = () => setHistory(getHistory());
    loadHistory();

    // Listen for storage changes to update the history in real-time
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Upload History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(entry => (
                <TableRow key={entry.txHash}>
                  <TableCell>
                    <div className="font-medium truncate max-w-xs">{entry.filename}</div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a 
                        href={EXPLORER_URL.replace('{txHash}', entry.txHash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="View on Explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">Your uploaded files will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
