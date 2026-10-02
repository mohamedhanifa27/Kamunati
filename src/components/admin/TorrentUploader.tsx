'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';

export interface TorrentMetadata {
  infoHash: string;
  name: string;
  files: { name: string; path: string; length: number; index: number }[];
}

interface TorrentUploaderProps {
  onParsed: (metadata: TorrentMetadata) => void;
}

export default function TorrentUploader({ onParsed }: TorrentUploaderProps) {
  const [magnetUri, setMagnetUri] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processMagnet = async (uri: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Hitting the engine route we made earlier to inspect the magnet link
      const res = await fetch(`/api/v1/torrent/inspect?magnet=${encodeURIComponent(uri)}`);
      if (!res.ok) throw new Error('Failed to parse torrent via DHT.');
      
      const data = await res.json();
      
      // Inject index into files array
      const filesWithIndex = data.files.map((f: any, idx: number) => ({ ...f, index: idx }));
      onParsed({ ...data, files: filesWithIndex });
      
    } catch (err: any) {
      setError(err.message || 'Unknown error parsing magnet link.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // In a real app, read the .torrent file buffer, parse it, and construct a magnet uri
    // or send the raw buffer to the backend for inspection.
    // For this implementation, we will simulate the drop and error since we need a backend endpoint for files.
    setError('Direct .torrent file upload requires backend parser. Please paste a Magnet URI for now.');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/x-bittorrent': ['.torrent'] } });

  const handleMagnetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magnetUri) return;
    processMagnet(magnetUri);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4">Ingest Torrent Source</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud size={40} className={`mb-3 ${isDragActive ? 'text-primary' : 'text-white/40'}`} />
          <p className="text-white/80 font-medium">Drag & drop a .torrent file here</p>
          <p className="text-white/40 text-sm mt-1">or click to browse local files</p>
        </div>

        {/* Magnet Input */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-white/40 text-sm font-medium">OR PING MAGNET</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>
          
          <form onSubmit={handleMagnetSubmit} className="space-y-4">
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input 
                type="text" 
                placeholder="magnet:?xt=urn:btih:..." 
                value={magnetUri}
                onChange={(e) => setMagnetUri(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button 
              type="submit"
              disabled={isProcessing || !magnetUri}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isProcessing ? 'Inspecting DHT...' : 'Inspect Magnet'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
