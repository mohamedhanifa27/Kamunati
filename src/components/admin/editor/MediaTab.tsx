'use client';

import React, { useState, Suspense } from 'react';
import TorrentUploader, { TorrentMetadata } from '../TorrentUploader';
import FileIndexSelector from '../FileIndexSelector';
import { Save, AlertTriangle, PlayCircle, Loader2, Trash2, HardDrive, Hash, Layers } from 'lucide-react';
import { useNotification } from '../../ui/NotificationProvider';
import { useRouter } from 'next/navigation';

export default function MediaTab({ data }: { data: any }) {
  const { notify } = useNotification();
  const router = useRouter();
  const [parsedTorrent, setParsedTorrent] = useState<TorrentMetadata | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const torrents = data?.torrents || [];

  const formatBytes = (bytes: number | bigint | null | undefined) => {
    if (!bytes) return '0 B';
    const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const applyMapping = async () => {
    if (!parsedTorrent || selectedFileIndex === null) return;
    
    setIsApplying(true);
    const file = parsedTorrent.files.find(f => f.index === selectedFileIndex);
    
    let resolution = '1080p';
    if (/2160p|4k/i.test(parsedTorrent.name)) resolution = '4K';
    else if (/720p/i.test(parsedTorrent.name)) resolution = '720p';
    else if (/480p/i.test(parsedTorrent.name)) resolution = '480p';

    try {
      const res = await fetch(`/api/admin/titles/${data.id}/media/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          infoHash: parsedTorrent.infoHash,
          fileIndex: selectedFileIndex,
          title: parsedTorrent.name,
          resolution,
          sizeInBytes: file ? file.length : 0,
          magnetUri: parsedTorrent.magnetUri
        })
      });
      if (!res.ok) throw new Error('Failed to add media source');
      notify('Success', 'Media source added successfully!', 'success');
      setParsedTorrent(null);
      setSelectedFileIndex(null);
      router.refresh();
    } catch (e: any) {
      notify('Notification', e.message, 'default');
    } finally {
      setIsApplying(false);
    }
  };

  const deleteSource = async (torrentId: string) => {
    if (!confirm('Are you sure you want to remove this torrent source?')) return;
    setIsDeleting(torrentId);
    try {
      const res = await fetch(`/api/admin/titles/${data.id}/media/${torrentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete media source');
      notify('Success', 'Source removed successfully!', 'success');
      router.refresh();
    } catch (e: any) {
      notify('Notification', e.message, 'default');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-white font-heading mb-2">Media Engine Sources</h2>
        <p className="text-white/40 text-sm">
          Configure the underlying torrents or magnet links that power playback. Multiple torrents can be linked (e.g. 1080p and 720p).
        </p>
      </div>

      {/* Linked Torrent Sources */}
      <section className="bg-black/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Layers size={18} className="text-primary" /> 
            <span>Linked Torrents ({torrents.length})</span>
          </h3>
          {torrents.length > 1 && (
            <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/30 font-medium">
              Multi-Source Available
            </span>
          )}
        </div>
        
        {torrents.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center text-white/40">
            <PlayCircle size={28} className="mx-auto mb-2 opacity-50" />
            <p>No torrent sources attached to this title yet.</p>
            <p className="text-xs text-white/30 mt-1">Upload a .torrent file or paste a magnet link below to link playback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {torrents.map((t: any) => (
              <div 
                key={t.id} 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded border border-primary/30">
                      {t.resolution || 'Auto'}
                    </span>
                    <span className="text-white font-medium truncate block" title={t.title}>
                      {t.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 font-mono">
                    <span className="flex items-center gap-1">
                      <Hash size={12} />
                      {t.infoHash ? `${t.infoHash.substring(0, 12)}...` : 'Unknown Hash'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive size={12} />
                      {formatBytes(t.sizeInBytes)}
                    </span>
                    <span>File Index: {t.fileIndex}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => deleteSource(t.id)}
                    disabled={isDeleting === t.id}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                    title="Remove this torrent source"
                  >
                    {isDeleting === t.id ? (
                      <Loader2 size={16} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Torrent Source */}
      <section className="space-y-6 pt-4 border-t border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-1">Add Torrent Source</h3>
          <p className="text-sm text-white/50 mb-6">
            Upload a .torrent file or magnet link to add an additional quality or replacement source for this title.
          </p>
        </div>

        <Suspense fallback={<div>Loading uploader...</div>}>
          <TorrentUploader 
            onParsed={(torrentData: TorrentMetadata) => {
              setParsedTorrent(torrentData);
              setSelectedFileIndex(null);
            }} 
          />
        </Suspense>

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
                      This will add this streaming source for <strong>{data?.title || 'this title'}</strong>. 
                      Existing watch progress for viewers will be preserved.
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
