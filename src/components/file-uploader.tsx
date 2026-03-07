'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useWallet, type InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { addToHistory } from '@/lib/history';
import { aptos } from '@/lib/aptos';
import shelbyClient from '@/lib/shelby';

// Imports from SDK/browser
import {
  generateCommitments,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  ShelbyBlobClient,
} from "@shelby-protocol/sdk/browser";

// Buffer for browser
import { Buffer } from 'buffer';


type UploadStatus = 'idle' | 'encoding' | 'registering' | 'uploading' | 'success' | 'error';

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { connected, signAndSubmitTransaction, account } = useWallet();
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!file || !account) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your wallet to upload files.',
      });
      return;
    }

    setStatus('encoding');
    setError(null);

    try {
      // Step 1: File Encoding
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const provider = await createDefaultErasureCodingProvider();
      const commitments = await generateCommitments(provider, fileBuffer);

      // Step 2: On-Chain Registration
      setStatus('registering');
      // Expiration set to 30 days from now in microseconds
      const expirationMicroseconds = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;
      
      const payload = ShelbyBlobClient.createRegisterBlobPayload({
        account: account.address,
        blobName: file.name,
        blobMerkleRoot: commitments.blob_merkle_root,
        numChunksets: expectedTotalChunksets(commitments.raw_data_size),
        expirationMicros: BigInt(expirationMicroseconds),
        blobSize: BigInt(commitments.raw_data_size),
      });

      const transaction: InputTransactionData = { data: payload };
      const pendingTx = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: pendingTx.hash });

      // Step 3: RPC Upload
      setStatus('uploading');
      await shelbyClient.rpc.putBlob({
        account: account.address,
        blobName: file.name,
        blobData: new Uint8Array(fileBuffer),
      });

      // Success
      setStatus('success');
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been stored on Shelby.`,
      });

      // Add to history
      addToHistory({
        filename: file.name,
        txHash: pendingTx.hash,
      });

      resetState();
      setStatus('success');

    } catch (e) {
      const err = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error('Upload failed:', e);
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
  
  const isProcessing = status === 'encoding' || status === 'registering' || status === 'uploading';

  if (isProcessing) {
    let statusText = 'Processing...';
    if (status === 'encoding') statusText = 'Encoding file...';
    if (status === 'registering') statusText = 'Registering on-chain...';
    if (status === 'uploading') statusText = 'Uploading to Shelby...';
    
    return (
      <Card className="w-full">
        <CardContent className="p-10 text-center space-y-4">
          <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h3 className="text-2xl font-headline">{statusText}</h3>
          <p className="text-muted-foreground break-all">{file?.name}</p>
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
          
          {status === 'error' && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleUpload} className="w-full mt-4" size="lg" disabled={!connected}>
            Upload to Shelby
          </Button>
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
