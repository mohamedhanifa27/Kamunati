'use client';

import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import Link from 'next/link';
import MediaCard from '../../components/browse/MediaCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await fetch(`/api/media/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.results || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-bg pt-24 px-8 md:px-16 text-text">
      <div className="max-w-6xl mx-auto">
        <div className="relative mb-12">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted w-8 h-8" />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, series, or genres..."
            className="w-full bg-surface-raised border border-border text-3xl font-heading py-6 pl-20 pr-16 focus:outline-none focus:border-primary transition-colors shadow-lg"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="w-8 h-8" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div>
            {query.length > 1 && results.length === 0 ? (
              <div className="text-center py-20 text-text-muted text-xl">
                No results found for "{query}".
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {results.map((media) => (
                  <MediaCard 
                    key={media.id} 
                    id={media.id} 
                    title={media.title} 
                    posterUrl={media.posterPath || media.backdropPath || '/logo.png'} 
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
