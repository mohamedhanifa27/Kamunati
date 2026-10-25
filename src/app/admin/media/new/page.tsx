'use client';

import React, { useState } from 'react';
import { useTransitionRouter as useRouter } from 'next-view-transitions';
import { Loader2, Film, CheckCircle, Search, FileDown, Tv, Send, Link as LinkIcon, FileUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNotification } from '../../../../components/ui/NotificationProvider';
import { HaloDropzone } from '../../../../components/ui/halo-dropzone';

export default function NewMediaWizard() {
  const router = useRouter();
  const { notify } = useNotification();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);

  // Step 1: Media Type
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  
  // Step 2: TMDB Basics
  const [tmdbId, setTmdbId] = useState('');
  const [tmdbData, setTmdbData] = useState<any>(null);
  
  // Step 3: Torrent Source
  const [sourceType, setSourceType] = useState<'telegram' | 'upload' | 'magnet'>('magnet');
  const [magnetUri, setMagnetUri] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [torrentFile, setTorrentFile] = useState<File | null>(null);

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleFetchTmdb = async () => {
    if (!tmdbId) return;
    setIsFetchingTmdb(true);
    try {
      const res = await fetch(`/api/admin/tmdb?tmdbId=${tmdbId}&type=${type}`);
      const data = await res.json();
      if (res.ok && data.title) {
        setTmdbData(data);
        handleNext();
      } else {
        notify('Error', data.error || 'Failed to fetch TMDB data', 'destructive');
      }
    } catch (err) {
      notify('Error', 'Network error while fetching TMDB', 'destructive');
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: parseInt(tmdbId), type: type.toUpperCase() })
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        let qs = '';
        if (sourceType === 'magnet' && magnetUri) {
          qs = `?magnet=${encodeURIComponent(magnetUri)}`;
        } else if (sourceType === 'telegram' && telegramLink) {
          qs = `?telegram=${encodeURIComponent(telegramLink)}`;
        }
        // If file, we might need a separate upload step, but for now just pass to the editor
        router.push(`/admin/media/${data.id}${qs}`);
      } else {
        notify('Error', data.error || 'Failed to create media', 'destructive');
      }
    } catch (err) {
      notify('Error', 'Network error', 'destructive');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text mb-2">Add New Title</h1>
        <p className="text-text-muted">Follow the steps to publish a new movie or series.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-raised -z-10"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        
        {[
          { num: 1, label: 'Media Type', icon: Film },
          { num: 2, label: 'TMDB', icon: Search },
          { num: 3, label: 'Source', icon: FileDown },
          { num: 4, label: 'Overview', icon: CheckCircle }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-bg px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.num ? 'bg-primary border-primary text-bg' : 'bg-surface border-border text-text-muted'}`}>
              <s.icon size={18} />
            </div>
            <span className={`text-sm font-medium ${step >= s.num ? 'text-primary' : 'text-text-muted'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-8 shadow-xl">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">1. Media Type</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setType('movie')}
                className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-colors ${type === 'movie' ? 'border-primary bg-primary/10' : 'border-border hover:border-text-muted'}`}
              >
                <Film size={32} className={type === 'movie' ? 'text-primary' : 'text-text-muted'} />
                <span className="font-medium text-text">Movie</span>
              </button>
              <button 
                onClick={() => setType('tv')}
                className={`p-6 border-2 rounded-xl flex flex-col items-center gap-3 transition-colors ${type === 'tv' ? 'border-primary bg-primary/10' : 'border-border hover:border-text-muted'}`}
              >
                <Tv size={32} className={type === 'tv' ? 'text-primary' : 'text-text-muted'} />
                <span className="font-medium text-text">TV Series</span>
              </button>
            </div>
            <div className="pt-4 flex justify-end">
              <button onClick={handleNext} className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">2. TMDB Basics</h2>
            <p className="text-text-muted">Enter a TMDB ID for the {type === 'movie' ? 'Movie' : 'TV Series'} to automatically fetch metadata.</p>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">TMDB ID</label>
              <input 
                type="number"
                value={tmdbId}
                onChange={(e) => setTmdbId(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg py-3 px-4 text-text focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                placeholder="e.g. 550 (Fight Club)"
              />
            </div>
            <div className="pt-4 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button 
                onClick={handleFetchTmdb} 
                disabled={!tmdbId || isFetchingTmdb} 
                className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50"
              >
                {isFetchingTmdb ? <Loader2 size={18} className="animate-spin" /> : <>Next <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">3. Torrent Source</h2>
            <p className="text-text-muted">Select how you want to provide the media file.</p>
            
            <div className="flex gap-4 border-b border-border mb-6">
              <button 
                onClick={() => setSourceType('telegram')}
                className={`py-2 px-4 font-medium transition-colors border-b-2 ${sourceType === 'telegram' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
              >
                <div className="flex items-center gap-2"><Send size={16}/> Telegram</div>
              </button>
              <button 
                onClick={() => setSourceType('upload')}
                className={`py-2 px-4 font-medium transition-colors border-b-2 ${sourceType === 'upload' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
              >
                <div className="flex items-center gap-2"><FileUp size={16}/> Upload</div>
              </button>
              <button 
                onClick={() => setSourceType('magnet')}
                className={`py-2 px-4 font-medium transition-colors border-b-2 ${sourceType === 'magnet' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'}`}
              >
                <div className="flex items-center gap-2"><LinkIcon size={16}/> Magnet URI</div>
              </button>
            </div>

            {sourceType === 'telegram' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-sm font-medium text-text-muted mb-2">Telegram Channel Post Link</label>
                <input 
                  type="text"
                  value={telegramLink}
                  onChange={(e) => setTelegramLink(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg py-3 px-4 text-text focus:outline-none focus:border-primary placeholder:text-text-muted/50 mb-4"
                  placeholder="https://t.me/c/..."
                />
                <p className="text-xs text-text-muted">Requires the admin bot to be present in the channel.</p>
              </div>
            )}

            {sourceType === 'upload' && (
              <div className="animate-in fade-in duration-300">
                <HaloDropzone
                  onFilesDrop={(files) => {
                    if (files.length > 0) {
                      setTorrentFile(files[0]);
                      notify('Success', 'File selected: ' + files[0].name, 'default');
                    }
                  }}
                  accept=".torrent"
                  maxFiles={1}
                  maxSizeMB={5}
                />
                {torrentFile && (
                  <p className="mt-3 text-sm text-primary font-medium">Selected: {torrentFile.name}</p>
                )}
              </div>
            )}

            {sourceType === 'magnet' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-sm font-medium text-text-muted mb-2">Magnet URI</label>
                <textarea 
                  value={magnetUri}
                  onChange={(e) => setMagnetUri(e.target.value)}
                  className="w-full h-24 bg-bg border border-border rounded-lg py-3 px-4 text-text focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                  placeholder="magnet:?xt=urn:btih:..."
                />
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button 
                onClick={handleNext} 
                disabled={(sourceType === 'telegram' && !telegramLink) || (sourceType === 'upload' && !torrentFile) || (sourceType === 'magnet' && !magnetUri)} 
                className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && tmdbData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">4. Final Overview</h2>
            
            <div className="bg-bg border border-border p-6 rounded-xl flex gap-6">
              {tmdbData.posterPath ? (
                <img src={tmdbData.posterPath} alt="Poster" className="w-32 h-48 object-cover rounded shadow-lg" />
              ) : (
                <div className="w-32 h-48 bg-surface border border-border rounded flex items-center justify-center text-text-muted">
                  No Poster
                </div>
              )}
              <div className="flex-1 font-pixelcode">
                <h3 className="text-2xl font-bold text-white mb-1">{tmdbData.title} <span className="text-text-muted font-normal">({tmdbData.releaseYear})</span></h3>
                <p className="text-sm text-text-muted mb-4">{tmdbData.type} • {tmdbData.runtime ? `${tmdbData.runtime} min` : 'Unknown runtime'} • {JSON.parse(tmdbData.genres || '[]').join(', ')}</p>
                <p className="text-sm text-text leading-relaxed line-clamp-3 mb-4">{tmdbData.overview}</p>
                
                <div className="bg-surface p-3 rounded border border-border inline-block">
                  <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Source</p>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    {sourceType === 'telegram' && <><Send size={14}/> Telegram Channel</>}
                    {sourceType === 'upload' && <><FileUp size={14}/> Torrent File ({torrentFile?.name})</>}
                    {sourceType === 'magnet' && <><LinkIcon size={14}/> Magnet URI</>}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="bg-success hover:bg-success/90 text-bg font-bold py-2 px-8 rounded flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Publish</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
