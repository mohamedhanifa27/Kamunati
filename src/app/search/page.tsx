'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Search as SearchIcon, X } from 'lucide-react';
import MediaCard from '../../components/browse/MediaCard';
import { useDebounce } from 'use-debounce';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);

  const { data, error, isLoading } = useSWR(
    debouncedQuery.length > 1 ? `/api/media/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  );

  const results = data?.results || [];

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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div>
            {debouncedQuery.length > 1 && results.length === 0 ? (
              <div className="text-center py-20 text-text-muted text-xl">
                No results found for "{debouncedQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {results.map((media: any) => {
                  let ambientPalette;
                  try {
                    if (typeof media.ambientPalette === 'string') ambientPalette = JSON.parse(media.ambientPalette);
                    else ambientPalette = media.ambientPalette;
                  } catch(e) {}
                  return (
                    <MediaCard 
                      key={media.id} 
                      id={media.id} 
                      title={media.title} 
                      posterUrl={media.posterPath || media.backdropPath || '/logo_vector.svg'}
                      backdropUrl={media.backdropPath || media.posterPath}
                      hoverBannerUrl={media.hoverBannerKey}
                      hoverClipUrl={media.hoverClipKey}
                      hoverTagline={media.hoverTagline}
                      ambientPalette={ambientPalette}
                      metadata={{
                        category: media.category,
                        year: media.releaseYear,
                        rating: media.rating,
                        runtime: media.runtime
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
