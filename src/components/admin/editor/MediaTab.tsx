'use client';

import React, { useState } from 'react';
import TorrentUploader, { TorrentMetadata } from '../TorrentUploader';
import FileIndexSelector from '../FileIndexSelector';
import { Save, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react';

export default function MediaTab({ data }: { data: any }) {
  const [parsedTorrent, setParsedTorrent] = useState<TorrentMetadata | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyMapping = async () => {
    if (!parsedTorrent || selectedFileIndex === null) return;
    
    setIsApplying(true);
    try {
      const res = await fetch(`/api/admin/titles/${data.id}/media/replace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infoHash: parsedTorrent.infoHash,
          fileIndex: selectedFileIndex,
          name: parsedTorrent.name
        })
      });
      if (!res.ok) throw new Error('Failed to map media');
      alert('Media source updated successfully!');
      setParsedTorrent(null);
      setSelectedFileIndex(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white font-heading mb-2">Media Engine Source</h2>
        <p className="text-white/40 text-sm">Configure the underlying torrents or magnet links that power playback.</p>
      </div>

      <section className="bg-black/50 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
          <PlayCircle size={18} className="text-primary" /> Current Active Source
        </h3>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium mb-1">Source currently active (Mock Display)</div>
            <div className="text-sm text-white/40 font-mono">InfoHash: 7894...1234</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-400 font-medium">Healthy (24 peers)</div>
            <div className="text-xs text-white/40 mt-1">1080p • 2.4 GB</div>
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-4 border-t border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-1">Replace Source</h3>
          <p className="text-sm text-white/50 mb-6">Uploading a new torrent will trigger an impact preview before safely replacing the old one.</p>
        </div>

        <TorrentUploader 
          onParsed={(data: TorrentMetadata) => {
            setParsedTorrent(data);
            setSelectedFileIndex(null);
          }} 
        />

        {parsedTorrent && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <FileIndexSelector 
              metadata={parsedTorrent}
              selectedFileIndex={selectedFileIndex}
              onSelect={setSelectedFileIndex}
            />

            {selectedFileIndex !== null && (
              <div className="pt-6 border-t border-white/10">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-4 mb-6">
                  <AlertTriangle className="text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="text-yellow-500 font-medium text-sm mb-1">Impact Preview</h4>
                    <p className="text-sm text-yellow-500/70">
                      This will replace the main video file for <strong>{data?.title || 'this title'}</strong>. 
                      Existing watch progress for viewers will be preserved because the asset ID remains the same.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => { setParsedTorrent(null); setSelectedFileIndex(null); }}
                    className="px-5 py-2.5 rounded-lg font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applyMapping}
                    disabled={isApplying}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isApplying ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Apply New Source
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
