'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Film, CheckCircle, Search, FileDown, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';

export default function NewMediaWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basics
  const [tmdbId, setTmdbId] = useState('');
  const [type, setType] = useState('movie');
  
  // Step 2 & 3: Source
  const [magnetUri, setMagnetUri] = useState('');
  
  // Step 4: Rights
  const [rightsBasis, setRightsBasis] = useState('public_domain');
  const [attestation, setAttestation] = useState(false);

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestation) {
      alert('You must check the attestation checkbox.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: parseInt(tmdbId), type: type.toUpperCase() })
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        // If we also had magnetUri, we would create a TorrentSource here. 
        // For now, redirect to the media editor to attach the torrent
        router.push(`/admin/media/${data.id}?magnet=${encodeURIComponent(magnetUri)}`);
      } else {
        alert(data.error || 'Failed to create media');
      }
    } catch (err) {
      alert('Network error');
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
          { num: 1, label: 'Basics', icon: Search },
          { num: 2, label: 'Media Type', icon: Film },
          { num: 3, label: 'Source', icon: FileDown },
          { num: 4, label: 'Rights', icon: ShieldCheck }
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
            <h2 className="text-2xl font-heading text-text">1. TMDB Basics</h2>
            <p className="text-text-muted">Enter a TMDB ID to automatically fetch metadata.</p>
            
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
            <div className="pt-4 flex justify-end">
              <button onClick={handleNext} disabled={!tmdbId} className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">2. Media Type</h2>
            
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
                <Film size={32} className={type === 'tv' ? 'text-primary' : 'text-text-muted'} />
                <span className="font-medium text-text">TV Series</span>
              </button>
            </div>
            <div className="pt-4 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={handleNext} className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">3. Torrent Source</h2>
            <p className="text-text-muted">Paste a Magnet URI for the video file.</p>
            
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Magnet URI</label>
              <textarea 
                value={magnetUri}
                onChange={(e) => setMagnetUri(e.target.value)}
                className="w-full h-32 bg-bg border border-border rounded-lg py-3 px-4 text-text focus:outline-none focus:border-primary placeholder:text-text-muted/50"
                placeholder="magnet:?xt=urn:btih:..."
              />
            </div>
            <div className="pt-4 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={handleNext} disabled={!magnetUri} className="bg-primary hover:bg-primary-hover text-bg font-bold py-2 px-6 rounded flex items-center gap-2 disabled:opacity-50">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-heading text-text">4. Review & Rights</h2>
            
            <div className="bg-bg border border-border p-4 rounded-lg mb-6">
              <label className="block text-sm font-medium text-text-muted mb-2">Rights Basis</label>
              <select 
                value={rightsBasis}
                onChange={(e) => setRightsBasis(e.target.value)}
                className="w-full bg-surface border border-border rounded py-2 px-3 text-text mb-2 focus:outline-none focus:border-primary"
              >
                <option value="public_domain">Public Domain</option>
                <option value="creative_commons">Creative Commons</option>
                <option value="licensed">Licensed / Own Work</option>
              </select>
              <p className="text-xs text-text-muted">Ensure you have the right to distribute this content.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-1">
                <input 
                  type="checkbox" 
                  checked={attestation} 
                  onChange={(e) => setAttestation(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer" 
                />
              </div>
              <span className="text-sm text-text-muted leading-relaxed">
                I attest that I have the legal right to host, distribute, and stream this content. I understand that Kamunati's policy prohibits the distribution of copyrighted material without permission.
              </span>
            </label>

            <div className="pt-8 flex justify-between">
              <button onClick={handlePrev} className="text-text-muted hover:text-text font-medium py-2 px-4 flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !attestation} 
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
