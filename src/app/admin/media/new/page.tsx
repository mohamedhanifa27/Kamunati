'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewMediaPage() {
  const router = useRouter();
  const [tmdbId, setTmdbId] = useState('');
  const [type, setType] = useState('movie');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: parseInt(tmdbId), type })
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/admin/media/${data.id}`);
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
    <div className="p-8 max-w-2xl mx-auto mt-12">
      <h1 className="text-3xl font-bold text-white mb-2">Import from TMDB</h1>
      <p className="text-white/40 mb-8">Enter a TMDB ID to automatically fetch metadata and create a new profile.</p>

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Media Type</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">TMDB ID</label>
          <input 
            type="number"
            required
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary placeholder:text-white/20"
            placeholder="e.g. 550 (Fight Club)"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Import & Continue'}
        </button>
      </form>
    </div>
  );
}
