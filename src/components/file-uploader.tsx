'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWallet, type InputTransactionData } from '@aptos-labs/wallet-adapter-react';
import { addToHistory } from '@/lib/history';
import { aptos } from '@/lib/aptos';

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
const PART_SIZE = 1024 * 1024 * 5; // 5 MB part size

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { connected, signAndSubmitTransaction, account } = useWallet();
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
    setStatusText('');
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
    setStatusText('Encoding file for on-chain registration...');
    setProgress(0);
    setError(null);

    try {
      // Step 1: File Encoding for on-chain registration
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const provider = await createDefaultErasureCodingProvider();
      const commitments = await generateCommitments(provider, fileBuffer);

      // Step 2: On-Chain Registration
      setStatus('registering');
      setStatusText('Registering file on the Aptos blockchain...');
      const expirationMicroseconds = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000;
      
      const rawPayload = ShelbyBlobClient.createRegisterBlobPayload({
        account: account.address,
        blobName: file.name,
        blobMerkleRoot: commitments.blob_merkle_root,
        numChunksets: expectedTotalChunksets(commitments.raw_data_size),
        expirationMicros: BigInt(expirationMicroseconds),
        blobSize: BigInt(commitments.raw_data_size),
      });

      // Convert to the new InputTransactionData format to be compatible with modern wallets (AIP-62)
      const transaction: InputTransactionData = {
        data: {
          function: rawPayload.function,
          typeArguments: rawPayload.type_arguments,
          functionArguments: rawPayload.arguments,
        }
      };
      
      const pendingTx = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({ transactionHash: pendingTx.hash });

      // Step 3: Multipart RPC Upload
      const shelbyApiBase = 'https://api.testnet.shelby.xyz/shelby/v1';

      // 3a: Begin session
      setStatus('uploading');
      setStatusText('Initializing upload session...');
      const beginResponse = await fetch(`${shelbyApiBase}/multipart-uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: account.address,
          blobName: file.name,
          partSize: PART_SIZE,
        }),
      });

      if (!beginResponse.ok) {
        throw new Error(`Failed to begin multipart upload: ${await beginResponse.text()}`);
      }
      const { uploadId } = await beginResponse.json();
      if (!uploadId) {
        throw new Error('Could not retrieve a multipart upload ID.');
      }
      
      // 3b: Upload parts
      const totalParts = Math.ceil(fileBuffer.length / PART_SIZE);
      for (let i = 0; i < totalParts; i++) {
        const start = i * PART_SIZE;
        const end = start + PART_SIZE;
        const part = fileBuffer.slice(start, end);
        
        setStatusText(`Uploading part ${i + 1} of ${totalParts}...`);
        
        const partResponse = await fetch(`${shelbyApiBase}/multipart-uploads/${uploadId}/parts/${i}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: part,
        });

        if (!partResponse.ok) {
          throw new Error(`Failed to upload part ${i + 1}: ${await partResponse.text()}`);
        }
        
        setProgress(((i + 1) / totalParts) * 100);
      }

      // 3c: Complete session
      setStatusText('Finalizing upload...');
      const completeResponse = await fetch(`${shelbyApiBase}/multipart-uploads/${uploadId}/complete`, {
        method: 'POST',
      });

      if (!completeResponse.ok) {
        throw new Error(`Failed to complete multipart upload: ${await completeResponse.text()}`);
      }

      // Success
      setStatus('success');
      toast({
        title: 'Upload Successful',
        description: `${file.name} has been stored on Shelby.`,
      });

      addToHistory({
        filename: file.name,
        txHash: pendingTx.hash,
        accountAddress: account.address,
      });

      setTimeout(resetState, 1000);

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
    return (
      <Card className="w-full">
        <CardContent className="p-10 text-center space-y-4">
          <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h3 className="text-2xl font-headline">{statusText}</h3>
          <p className="text-muted-foreground break-all">{file?.name}</p>
           {status === 'uploading' && (
            <div className="pt-4">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground mt-2">{progress.toFixed(0)}%</p>
            </div>
          )}
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
