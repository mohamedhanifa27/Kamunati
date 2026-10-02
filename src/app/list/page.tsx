'use client';

import React, { useState, useEffect } from 'react';
import MediaCard from '../../components/browse/MediaCard';

export default function MyListPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      try {
        const res = await fetch('/api/user/watchlist');
        if (res.ok) {
          const data = await res.json();
          // data is an array of { id, userId, mediaId, media: {...} }
          setList(data.map((item: any) => item.media));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, []);

  return (
    <div className="min-h-screen bg-bg pt-32 px-8 md:px-16 text-text">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-heading font-bold mb-12">My List</h1>

        {loading ? (
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
            {list.map((media) => (
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
    </div>
  );
}
