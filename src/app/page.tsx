'use client';

import React, { useEffect, useState } from 'react';
import HeroBanner from '../components/browse/HeroBanner';
import MediaRow from '../components/browse/MediaRow';
import ContinueWatchingRow from '../components/user/ContinueWatchingRow';

export default function BrowsePage() {
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  useEffect(() => {
    // Fetch mock data or real data
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/user/progress');
        if (res.ok) {
          const data = await res.json();
          // Map backend data to UI
          setContinueWatching(data.map((item: any) => ({
            id: item.id,
            mediaId: item.mediaId,
            title: item.media.title,
            posterUrl: item.media.backdropPath || item.media.posterPath,
            progressPercent: (item.timestampSec / 120) * 100, // mock duration 120s
            timestampSec: item.timestampSec,
          })));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProgress();
  }, []);

  // Mock featured data for now until API integration is complete
  const featuredMedia = {
    mediaId: '1',
    title: 'Inception',
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKdQ8emSGUEMjsS4yHAwrp.jpg',
  };

  const trendingMovies = [
    { id: '1', title: 'Inception', posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', qualityBadge: '4K' },
    { id: '2', title: 'Interstellar', posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', qualityBadge: '1080p' },
    { id: '3', title: 'The Dark Knight', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', qualityBadge: '4K' },
    { id: '4', title: 'Avatar', posterUrl: 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg' },
    { id: '5', title: 'The Matrix', posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', qualityBadge: '1080p' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-0">
      <HeroBanner 
        mediaId={featuredMedia.mediaId}
        title={featuredMedia.title}
        overview={featuredMedia.overview}
        backdropUrl={featuredMedia.backdropUrl}
      />
      
      <div className="pb-24 -mt-32 relative z-10 space-y-8">
        {continueWatching.length > 0 && (
          <ContinueWatchingRow items={continueWatching} />
        )}
        
        <MediaRow title="Trending Now" items={trendingMovies} />
        <MediaRow title="Action & Adventure" items={trendingMovies.slice().reverse()} />
        <MediaRow title="Sci-Fi Masterpieces" items={trendingMovies} />
      </div>
    </div>
  );
}
