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

  const mapMediaItem = (m: any) => {
    let ambientPalette;
    try {
      if (typeof m.ambientPalette === 'string') ambientPalette = JSON.parse(m.ambientPalette);
      else ambientPalette = m.ambientPalette;
    } catch (e) {}
    
    return {
      id: m.id || m.media?.id, // support both raw media and nested items
      title: m.title || m.media?.title,
      posterUrl: m.posterPath || m.backdropPath || m.media?.posterPath || m.media?.backdropPath || '/logo_vector.svg',
      backdropUrl: m.backdropPath || m.posterPath || m.media?.backdropPath || m.media?.posterPath,
      qualityBadge: m.infoHash || m.media?.infoHash ? 'HD' : undefined,
      hoverBannerUrl: m.hoverBannerKey || m.media?.hoverBannerKey,
      hoverClipUrl: m.hoverClipKey || m.media?.hoverClipKey,
      hoverTagline: m.hoverTagline || m.media?.hoverTagline,
      ambientPalette: ambientPalette || (m.media?.ambientPalette ? JSON.parse(m.media.ambientPalette) : undefined),
      category: m.category || m.media?.category,
      releaseYear: m.releaseYear || m.media?.releaseYear,
      rating: m.rating || m.media?.rating,
      runtime: m.runtime || m.media?.runtime,
    };
  };

  const safeProgressData = Array.isArray(progressData) ? progressData : [];
  const continueWatching = safeProgressData.map((item: any) => ({
    id: item.id,
    mediaId: item.mediaId,
    title: item.media.title,
    posterUrl: item.media.backdropPath || item.media.posterPath,
    progressPercent: (item.timestampSec / 120) * 100, 
    timestampSec: item.timestampSec,
    ambientPalette: item.media.ambientPalette ? JSON.parse(item.media.ambientPalette) : undefined
  }));

  const safeWatchlistData = Array.isArray(watchlistData) ? watchlistData : [];
  const myListMapped = safeWatchlistData.map(mapMediaItem);

  const safeMediaList = Array.isArray(mediaList) ? mediaList : [];
  const trendingMovies = safeMediaList.map(mapMediaItem);

  const featuredMedia = safeMediaList.length > 0 ? {
    mediaId: safeMediaList[0].id,
    title: safeMediaList[0].title,
    overview: safeMediaList[0].overview,
    backdropUrl: safeMediaList[0].backdropPath || safeMediaList[0].posterPath || '/logo_vector.svg',
  } : {
    mediaId: '1',
    title: 'Welcome to Kamunati',
    overview: 'No media available. Go to the Admin Dashboard to add movies or TV shows.',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop',
  };

  if (isLoading) {
    return <div className="min-h-screen bg-bg animate-pulse flex items-center justify-center text-text-muted">Loading Home...</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden pt-0 relative">
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
