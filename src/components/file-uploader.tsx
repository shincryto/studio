'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X, Loader, Copy, Check, Tag, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getFileTags } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type UploadResult = { id: string; link: string };

// This is a mock of the Shelby Protocol SDK to demonstrate the upload flow.
// In a real application, you would import this from '@shelby-protocol/sdk'.
const mockShelbyUpload = ({
  file,
  onProgress,
}: {
  file: File;
  onProgress: (progress: number) => void;
}) => {
  return new Promise<UploadResult>((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) {
        progress = 100;
      }
      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const fileId = `shby-${crypto.randomUUID()}`;
          resolve({
            id: fileId,
            link: `https://shelby.io/v/${fileId}/${file.name}`,
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
  const [result, setResult] = useState<UploadResult | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTagging, setIsTagging] = useState(false);

  // Temporarily remove wallet integration to fix build issues.
  const connected = true; 
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setTags(null);
    setError(null);
    setIsTagging(false);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    if (!connected) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your Petra wallet to upload files.',
      });
      return;
    }

    setStatus('uploading');
    setError(null);
    setProgress(0);

    try {
      // The Shelby SDK automatically handles data chunking and erasure coding.
      const uploadResult = await mockShelbyUpload({
        file,
        onProgress: setProgress,
      });

      setResult(uploadResult);
      setStatus('success');
      toast({
        title: 'Upload Successful',
        description: `Your file "${file.name}" has been stored on Shelby.`,
      });

      // Start intelligent tagging after successful upload
      setIsTagging(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = (e.target?.result as string) || '';
        const suggestedTags = await getFileTags(file.name, content);
        setTags(suggestedTags);
        setIsTagging(false);
      };
      reader.onerror = () => {
        setIsTagging(false);
        setTags(null); // Could not read file for tagging
      };
      // For non-text files, this will be garbled, but the AI might still extract info from headers or filename.
      reader.readAsText(file.slice(0, 10000)); // Read first 10KB for performance
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
    if (status !== 'idle' && status !== 'error') return;
    if (acceptedFiles.length > 0) {
      resetState();
      setFile(acceptedFiles[0]);
    }
  }, [status, resetState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  if (status === 'success' && result) {
    return (
      <Card className="w-full bg-card/50 border-primary/20 shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <Check className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="text-2xl font-headline">Upload Complete</h3>
          <p className="text-muted-foreground break-all">File: {file?.name}</p>
          
          <Separator />

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground">Retrieval ID</label>
            <div className="flex items-center gap-2">
              <code className="relative flex-1 rounded bg-background px-3 py-2 font-mono text-sm">{result.id}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.id)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-muted-foreground">Sharable Link</label>
            <div className="flex items-center gap-2">
              <code className="relative flex-1 truncate rounded bg-background px-3 py-2 font-mono text-sm">{result.link}</code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.link)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3 text-left">
            <h4 className="flex items-center text-sm font-medium text-muted-foreground">
              <BrainCircuit className="w-4 h-4 mr-2"/>
              AI Suggested Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {isTagging ? (
                <div className="flex items-center text-sm text-muted-foreground"><Loader className="w-4 h-4 mr-2 animate-spin"/>Generating tags...</div>
              ) : tags && tags.length > 0 ? (
                tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm"><Tag className="w-3 h-3 mr-1.5"/>{tag}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags suggested.</p>
              )}
            </div>
          </div>

          <Button onClick={resetState} className="w-full mt-4">Upload Another File</Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'uploading') {
    return (
      <Card className="w-full">
        <CardContent className="p-10 text-center space-y-4">
          <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h3 className="text-2xl font-headline">Uploading...</h3>
          <p className="text-muted-foreground break-all">{file?.name}</p>
          <Progress value={progress} className="w-full" />
          <p className="text-sm font-mono text-accent">{Math.round(progress)}%</p>
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
          <Button onClick={handleUpload} className="w-full mt-4" size="lg">
            Upload to Shelby
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`w-full transition-colors ${isDragActive ? 'border-primary' : ''}`}
    >
      <CardContent className="p-6 text-center cursor-pointer">
        <input {...getInputProps()} />
        <div className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="font-medium">
              {isDragActive ? 'Drop the file here...' : 'Drag & drop file or click to select'}
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
