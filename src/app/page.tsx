'use client';

import React, { useEffect, useState } from 'react';
import HeroBanner from '../components/browse/HeroBanner';
import MediaRow from '../components/browse/MediaRow';
import ContinueWatchingRow from '../components/user/ContinueWatchingRow';

export default function BrowsePage() {
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/user/progress');
        if (res.ok) {
          const data = await res.json();
          setContinueWatching(data.map((item: any) => ({
            id: item.id,
            mediaId: item.mediaId,
            title: item.media.title,
            posterUrl: item.media.backdropPath || item.media.posterPath,
            progressPercent: (item.timestampSec / 120) * 100, 
            timestampSec: item.timestampSec,
          })));
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media');
        if (res.ok) {
          const data = await res.json();
          setMediaList(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchMyList = async () => {
      try {
        const res = await fetch('/api/user/watchlist');
        if (res.ok) {
          const data = await res.json();
          setMyList(data.map((item: any) => item.media));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProgress();
    fetchMedia();
    fetchMyList();
  }, []);

  const featuredMedia = mediaList.length > 0 ? {
    mediaId: mediaList[0].id,
    title: mediaList[0].title,
    overview: mediaList[0].overview,
    backdropUrl: mediaList[0].backdropPath || mediaList[0].posterPath || '/logo.png',
  } : {
    mediaId: '1',
    title: 'Welcome to Kamunati',
    overview: 'No media available. Go to the Admin Dashboard to add movies or TV shows.',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop',
  };

  const trendingMovies = mediaList.map((m) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.posterPath || m.backdropPath || '/logo.png',
    qualityBadge: m.infoHash ? 'HD' : undefined
  }));
  
  const myListMapped = myList.map((m) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.posterPath || m.backdropPath || '/logo.png',
  }));

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden pt-0">
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
        
        {myListMapped.length > 0 && (
          <MediaRow title="My List" items={myListMapped} />
        )}
        
        <MediaRow title="Trending Now" items={trendingMovies} />
        <MediaRow title="Action & Adventure" items={trendingMovies.slice().reverse()} />
        <MediaRow title="Sci-Fi Masterpieces" items={trendingMovies} />
      </div>
    </div>
  );
}
