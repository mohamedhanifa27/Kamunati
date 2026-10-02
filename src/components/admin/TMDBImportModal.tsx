'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, DownloadCloud, Loader2 } from 'lucide-react';

interface TMDBResult {
  id: number;
  title: string;
  releaseDate: string;
  poster: string | null;
  overview: string;
  type: 'MOVIE' | 'SERIES';
}

interface TMDBImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (media: any) => void;
}

export default function TMDBImportModal({ isOpen, onClose, onImportSuccess }: TMDBImportModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<'MOVIE' | 'SERIES'>('MOVIE');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch(query, typeFilter);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, typeFilter]);

  const performSearch = async (searchQuery: string, type: 'MOVIE' | 'SERIES') => {
    setIsSearching(true);
    try {
      // Direct integration to our backend API
      const res = await fetch(`/api/v1/admin/media/search-tmdb?q=${encodeURIComponent(searchQuery)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.map((item: any) => ({ ...item, type })));
      } else {
        // Fallback mock data if API is down during dev
        setTimeout(() => {
            setResults([
                { id: 123, title: `Mock Result: ${searchQuery}`, releaseDate: '2024-01-01', poster: null, overview: 'Sample overview...', type }
            ]);
            setIsSearching(false);
        }, 1000);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (tmdbId: number, type: 'MOVIE' | 'SERIES') => {
    setImportingId(tmdbId);
    try {
      const res = await fetch('/api/v1/admin/media/import-tmdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId, type, isPublished: false })
      });
      
      if (res.ok) {
        const data = await res.json();
        onImportSuccess(data);
        onClose();
      } else {
        alert('Failed to import media from TMDB. Make sure the backend API is running.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DownloadCloud className="text-primary" /> Import from TMDB
            </h2>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search movies or TV shows..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as 'MOVIE' | 'SERIES')}
                className="bg-black border border-white/20 rounded-lg px-4 text-white outline-none focus:border-primary"
              >
                <option value="MOVIE">Movies</option>
                <option value="SERIES">TV Series</option>
              </select>
            </div>

            {isSearching && (
              <div className="flex justify-center py-12 text-primary">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(item => (
                  <div key={item.id} className="flex gap-4 bg-black/50 border border-white/5 rounded-lg p-3 hover:border-white/20 transition-colors">
                    <img 
                      src={item.poster || 'https://via.placeholder.com/96x144?text=No+Image'} 
                      alt={item.title} 
                      className="w-24 h-36 object-cover rounded bg-neutral-800 shrink-0" 
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-white truncate" title={item.title}>{item.title}</h3>
                        <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded shrink-0">{item.type}</span>
                      </div>
                      <p className="text-sm text-white/40 mt-1">{item.releaseDate?.substring(0, 4) || 'Unknown Year'}</p>
                      <p className="text-xs text-white/50 mt-2 line-clamp-3 flex-1">{item.overview}</p>
                      <button 
                        onClick={() => handleImport(item.id, item.type)}
                        disabled={importingId === item.id}
                        className="mt-2 w-full bg-primary/20 hover:bg-primary/40 text-primary font-medium py-1.5 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {importingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                        {importingId === item.id ? 'Importing...' : 'Import'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && query.length > 2 && results.length === 0 && (
              <div className="text-center py-12 text-white/50">
                No results found on TMDB for "{query}".
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
