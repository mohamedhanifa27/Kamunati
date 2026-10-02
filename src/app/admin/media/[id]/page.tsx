'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import TMDBImportModal from '../../../../components/admin/TMDBImportModal';
import TorrentUploader, { TorrentMetadata } from '../../../../components/admin/TorrentUploader';
import FileIndexSelector from '../../../../components/admin/FileIndexSelector';
import MediaEditor from '../../../../components/admin/MediaEditor';

export default function EditMediaPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [mediaData, setMediaData] = useState<any>(null);
  const [isTMDBModalOpen, setIsTMDBModalOpen] = useState(false);
  
  // Torrent Ingestion State
  const [parsedTorrent, setParsedTorrent] = useState<TorrentMetadata | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isNew) return;
    
    // In a real scenario, fetch existing media details from /api/v1/admin/media/:id
    // For now, we mock the load state
    setTimeout(() => {
      setMediaData({
        id,
        title: 'Draft Media',
        type: 'MOVIE',
        isPublished: false,
        isFeatured: false
      });
      setIsLoading(false);
    }, 500);
  }, [id, isNew]);

  const handleSaveMedia = async (data: any) => {
    try {
      // Save media metadata to backend via API
      console.log('Saving media data:', data);
      
      // If we also selected a torrent, link it to this media ID
      if (parsedTorrent && selectedFileIndex !== null) {
        console.log('Attaching torrent infoHash:', parsedTorrent.infoHash, 'Index:', selectedFileIndex);
      }
      
      alert('Media and torrent mapped successfully!');
      router.push('/admin/media');
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSuccess = (importedData: any) => {
    setMediaData(importedData);
    if (isNew) {
      router.push(`/admin/media/${importedData.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/50 h-[60vh]">
        <RefreshCw size={24} className="animate-spin mr-3" /> Loading Media Profile...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/media" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{isNew ? 'Create New Media' : 'Edit Media Profile'}</h1>
            <p className="text-white/40 text-sm mt-1">Manage metadata, posters, and backend torrent sources.</p>
          </div>
        </div>
        
        {isNew && (
          <button 
            onClick={() => setIsTMDBModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
          >
            <RefreshCw size={18} /> Auto-fill with TMDB
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Core Media Editor Form */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Metadata</h2>
          <MediaEditor 
            initialData={mediaData} 
            onSave={handleSaveMedia} 
          />
        </section>

        {/* Torrent/Magnet Ingestion Block */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Torrent Source Configuration</h2>
            <p className="text-white/40 text-sm">Upload a .torrent file or paste a Magnet URI to parse the DHT and map the primary video file to this media profile.</p>
          </div>

          <TorrentUploader 
            onParsed={(data: TorrentMetadata) => {
              setParsedTorrent(data);
              setSelectedFileIndex(null); // Reset selection on new parse
            }} 
          />

          {parsedTorrent && (
            <FileIndexSelector 
              metadata={parsedTorrent}
              selectedFileIndex={selectedFileIndex}
              onSelect={setSelectedFileIndex}
            />
          )}
        </section>
      </div>

      <TMDBImportModal 
        isOpen={isTMDBModalOpen} 
        onClose={() => setIsTMDBModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
