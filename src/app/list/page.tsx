'use client';

import React from 'react';
import useSWR from 'swr';
import MediaCard from '../../components/browse/MediaCard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MyListPage() {
  const { data: watchlistData, error, isLoading } = useSWR('/api/user/watchlist', fetcher);

  const safeWatchlistData = Array.isArray(watchlistData) ? watchlistData : [];
  const list = safeWatchlistData.map((item: any) => item.media);

  return (
    <div className="min-h-screen bg-bg pt-32 px-8 md:px-16 text-text">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-heading font-bold mb-12">My List</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-heading text-text-muted mb-4">Your list is empty.</h2>
            <p className="text-text-muted/70">Add shows and movies to your list to easily find them later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {list.map((media: any) => (
              <MediaCard 
                key={media.id} 
                id={media.id} 
                title={media.title} 
                posterUrl={media.posterPath || media.backdropPath || '/logo_vector.svg'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
