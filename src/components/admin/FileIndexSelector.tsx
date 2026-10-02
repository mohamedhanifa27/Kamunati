'use client';

import React from 'react';
import { TorrentMetadata } from './TorrentUploader';
import { FileVideo, FileText, FileQuestion, CheckCircle2 } from 'lucide-react';

interface FileIndexSelectorProps {
  metadata: TorrentMetadata;
  selectedFileIndex: number | null;
  onSelect: (index: number) => void;
}

export default function FileIndexSelector({ metadata, selectedFileIndex, onSelect }: FileIndexSelectorProps) {
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['mkv', 'mp4', 'avi', 'webm'].includes(ext || '')) return <FileVideo size={18} className="text-blue-400" />;
    if (['txt', 'nfo', 'srt', 'vtt'].includes(ext || '')) return <FileText size={18} className="text-gray-400" />;
    return <FileQuestion size={18} className="text-gray-500" />;
  };

  const isVideo = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['mkv', 'mp4', 'avi', 'webm'].includes(ext || '');
  };

  return (
    <div className="mt-6 bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-white text-lg">{metadata.name}</h4>
          <p className="text-xs text-white/50 font-mono mt-1">Hash: {metadata.infoHash}</p>
        </div>
        <div className="text-sm font-medium text-white/70 bg-black/50 px-3 py-1 rounded-full border border-white/10">
          {metadata.files.length} Files Discovered
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-white/40 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-medium">File Tree</th>
              <th className="px-6 py-3 font-medium">Size</th>
              <th className="px-6 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {metadata.files.map((file) => {
              const isSelected = selectedFileIndex === file.index;
              const recommended = isVideo(file.name) && file.length > 50000000; // Over 50MB is probably a valid video

              return (
                <tr 
                  key={file.index} 
                  onClick={() => isVideo(file.name) && onSelect(file.index)}
                  className={`transition-colors ${isVideo(file.name) ? 'cursor-pointer hover:bg-white/5' : 'opacity-50 grayscale'} ${isSelected ? 'bg-primary/10' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <span className={`truncate max-w-[300px] ${isSelected ? 'text-primary font-bold' : 'text-white'}`} title={file.path}>
                        {file.path}
                      </span>
                      {recommended && !isSelected && (
                        <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2 border border-blue-500/20">Media</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70 font-mono">
                    {formatBytes(file.length)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isSelected ? (
                      <div className="inline-flex items-center gap-2 text-primary font-medium bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30">
                        <CheckCircle2 size={16} /> Selected (Index {file.index})
                      </div>
                    ) : (
                      <button 
                        disabled={!isVideo(file.name)}
                        className="text-white/50 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30"
                      >
                        Select
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
