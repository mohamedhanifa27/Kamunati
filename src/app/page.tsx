'use client';

import React from 'react';
import useSWR from 'swr';
import HeroBanner from '../components/browse/HeroBanner';
import MediaRow from '../components/browse/MediaRow';
import ContinueWatchingRow from '../components/user/ContinueWatchingRow';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BrowsePage() {
  const { data: mediaList, error: mediaError } = useSWR('/api/media', fetcher);
  const { data: progressData } = useSWR('/api/user/progress', fetcher);
  const { data: watchlistData } = useSWR('/api/user/watchlist', fetcher);

  const isLoading = !mediaList;

  const continueWatching = progressData?.map((item: any) => ({
    id: item.id,
    mediaId: item.mediaId,
    title: item.media.title,
    posterUrl: item.media.backdropPath || item.media.posterPath,
    progressPercent: (item.timestampSec / 120) * 100, 
    timestampSec: item.timestampSec,
  })) || [];

  const myListMapped = watchlistData?.map((item: any) => ({
    id: item.media.id,
    title: item.media.title,
    posterUrl: item.media.posterPath || item.media.backdropPath || '/logo.png',
  })) || [];

  const featuredMedia = mediaList?.length > 0 ? {
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

  const trendingMovies = mediaList?.map((m: any) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.posterPath || m.backdropPath || '/logo.png',
    qualityBadge: m.infoHash ? 'HD' : undefined
  })) || [];

  if (isLoading) {
    return <div className="min-h-screen bg-bg animate-pulse flex items-center justify-center text-text-muted">Loading Home...</div>;
  }

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
