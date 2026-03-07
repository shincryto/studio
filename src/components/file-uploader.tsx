'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, Loader, Copy, Check, Tag, BrainCircuit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getFileTags } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { addToHistory } from '@/lib/history';
import { aptos } from '@/lib/aptos';
import { AccountAddress, PublicKey } from '@aptos-labs/ts-sdk';

type UploadStatus = 'idle' | 'estimating' | 'confirming' | 'uploading' | 'tagging' | 'success' | 'error';
type UploadResult = { id: string; link: string; txHash: string };

// This is a mock of the Shelby Protocol SDK to demonstrate the upload flow.
const mockShelbyUpload = async ({
  file,
  onProgress,
  signer,
}: {
  file: File;
  onProgress: (progress: number) => void;
  signer: (transaction: any) => Promise<any>;
}) => {
  // In a real app, you would construct a transaction for the Shelby Protocol
  // then ask the user to sign it.
  const mockTransaction = {
    data: {
      function: `0x42::example_module::upload`,
      functionArguments: [file.name, file.size],
    },
  };
  
  // This would be a real signature
  // const signedTx = await signer(mockTransaction);

  return new Promise<UploadResult>((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 100) progress = 100;
      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const fileId = `shby-${crypto.randomUUID()}`;
          // Generate a fake but valid-looking testnet transaction hash
          const txHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
          resolve({
            id: fileId,
            link: `https://shelby.io/v/${fileId}/${file.name}`,
            txHash,
          });
        }, 500);
      }
    }, 200);
  });
};

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<number | null>(null);

  const { connected, signAndSubmitTransaction, account } = useWallet();
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setError(null);
    setEstimatedGas(null);
  }, []);

  const handleEstimateGas = async () => {
    if (!file || !connected || !account) return;
    setStatus('estimating');
    try {
      // A real app would simulate the actual upload transaction.
      // For this demo, we simulate a simple 0-APT transfer to self.
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [account.address, 0],
        },
      });
      const senderPublicKey = new PublicKey(account.publicKey);
      const [simulation] = await aptos.transaction.simulate.simple({
        signerPublicKey: senderPublicKey,
        transaction,
      });
      setEstimatedGas(Number(simulation.gas_used) / 10**8);
      setStatus('confirming');
    } catch (e) {
      const err = e instanceof Error ? e.message : "Could not estimate gas fees.";
      setError(err);
      setStatus('error');
      toast({ variant: 'destructive', title: 'Estimation Failed', description: err });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);
    setProgress(0);

    try {
      // The `signAndSubmitTransaction` from the wallet adapter would be used here.
      // As we are mocking, we'll pass a dummy signer function.
      const dummySigner = async (tx: any) => ({ signature: 'mock_signature' });
      const uploadResult = await mockShelbyUpload({
        file,
        onProgress: setProgress,
        signer: dummySigner as any,
      });

      setStatus('tagging');
      toast({
        title: 'Upload Successful',
        description: `File stored. Now generating AI tags...`,
      });

      // Add to history
      const newEntry = {
        ...uploadResult,
        filename: file.name,
        timestamp: new Date().toISOString(),
      };
      addToHistory(newEntry);

      // We no longer show a big success screen here, history component handles it.
      // We'll reset the uploader to allow for another upload.
      resetState();
      setStatus('success');

    } catch (e) {
      const err = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(err);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: err,
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (status !== 'idle' && status !== 'success' && status !== 'error') return;
    if (acceptedFiles.length > 0) {
      resetState();
      setFile(acceptedFiles[0]);
    }
  }, [status, resetState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: !connected });

  if (status === 'uploading' || status === 'estimating' || status === 'tagging') {
    return (
      <Card className="w-full">
        <CardContent className="p-10 text-center space-y-4">
          <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h3 className="text-2xl font-headline">
            {status === 'estimating' ? 'Estimating Gas...' :
             status === 'tagging' ? 'Finalizing & Tagging...' :
             'Uploading...'}
          </h3>
          <p className="text-muted-foreground break-all">{file?.name}</p>
          {(status === 'uploading' || status === 'tagging') && <Progress value={progress} className="w-full" />}
          {(status === 'uploading' || status === 'tagging') && <p className="text-sm font-mono text-accent">{Math.round(progress)}%</p>}
        </CardContent>
      </Card>
    );
  }

  if (file) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon className="h-10 w-10 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={resetState}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {status === 'confirming' && estimatedGas !== null && (
            <div className="mt-4 p-4 rounded-lg bg-background border space-y-4">
              <h4 className="font-medium">Confirm Upload</h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Estimated Gas Fee</span>
                <span className="font-mono">{estimatedGas.toFixed(6)} APT</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpload} className="w-full" size="lg">Confirm & Upload</Button>
                <Button onClick={resetState} className="w-full" size="lg" variant="outline">Cancel</Button>
              </div>
            </div>
          )}

          {status !== 'confirming' && (
            <>
              {status === 'error' && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
              <Button onClick={handleEstimateGas} className="w-full mt-4" size="lg">
                Upload to Shelby
              </Button>
            </>
          )}

        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`w-full transition-colors ${isDragActive ? 'border-primary' : ''} ${!connected ? 'bg-muted/50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <CardContent className="p-6 text-center">
        <input {...getInputProps()} />
        <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="font-medium">
              { !connected ? 'Please connect your wallet to upload' : isDragActive ? 'Drop the file here...' : 'Drag & drop file or click to select'}
            </p>
            <p className="text-sm text-muted-foreground">
              Securely upload any file to the decentralized web.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
