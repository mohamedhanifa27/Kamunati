'use client';

import React from 'react';
import useSWR from 'swr';
import HeroBanner from './HeroBanner';
import MediaRow from './MediaRow';
import ContinueWatchingRow from '../user/ContinueWatchingRow';
import dynamic from 'next/dynamic';

const RibbonFieldBackground = dynamic(
  () => import('../../shaders/ribbon-field/RibbonFieldBackground').then(mod => mod.RibbonFieldBackground),
  { ssr: false }
);

const PredictiveArcCanvas = dynamic(
  () => import('../../shaders/predictive-arc/PredictiveArcCanvas').then(mod => mod.PredictiveArcCanvas),
  { ssr: false }
);
import '../../shaders/threeui.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BrowsePageProps {
  category?: 'MOVIE' | 'TV_SERIES' | 'ANIME';
  title?: string;
  emptyMessage?: string;
  showContinueWatching?: boolean;
  showMyList?: boolean;
}

export default function BrowsePage({ 
  category, 
  title, 
  emptyMessage = "No titles found.",
  showContinueWatching = true,
  showMyList = true
}: BrowsePageProps) {
  
  // Use the API endpoint with category filter if provided
  const mediaUrl = category ? `/api/media?category=${category}` : '/api/media';
  const rowsUrl = category ? `/api/landing/rows?category=${category}` : '/api/landing/rows';
  
  const { data: mediaList, error: mediaError } = useSWR(mediaUrl, fetcher);
  const { data: landingRows } = useSWR(rowsUrl, fetcher);
  const { data: progressData } = useSWR('/api/user/progress', fetcher);
  const { data: watchlistData } = useSWR('/api/user/watchlist', fetcher);

  const isLoading = !mediaList && !landingRows;

  const mapMediaItem = (m: any) => {
    let ambientPalette;
    try {
      if (typeof m.ambientPalette === 'string') ambientPalette = JSON.parse(m.ambientPalette);
      else ambientPalette = m.ambientPalette;
    } catch (e) {}
    
    return {
      id: m.id || m.media?.id, // support both raw media and nested items
      title: m.title || m.media?.title,
      posterUrl: m.posterPath || m.backdropPath || m.media?.posterPath || m.media?.backdropPath || '/logo.svg',
      backdropUrl: m.backdropPath || m.posterPath || m.media?.backdropPath || m.media?.posterPath,
      qualityBadge: m.infoHash || m.media?.infoHash ? 'HD' : undefined,
      overview: m.overview || m.media?.overview,
      // [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO]
      logoUrl: m.logoPath || m.media?.logoPath || m.logoUrl || null,
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
    backdropUrl: safeMediaList[0].backdropPath || safeMediaList[0].posterPath || '/logo.svg',
    // [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO]
    logoUrl: safeMediaList[0].logoPath || safeMediaList[0].logoUrl || null,
  } : null;

  if (isLoading) {
    return <div className="min-h-screen bg-bg animate-pulse flex items-center justify-center text-text-muted">Loading...</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden pt-0 relative bg-transparent">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen">
        <RibbonFieldBackground hue={260} saturation={1.5} speed={0.5} />
      </div>
      <div className="relative z-10">
        {featuredMedia ? (
          <HeroBanner 
            mediaId={featuredMedia.mediaId}
            title={featuredMedia.title}
            overview={featuredMedia.overview}
            backdropUrl={featuredMedia.backdropUrl}
            logoUrl={featuredMedia.logoUrl}
          />
        ) : (
          <div className="pt-32 pb-16 px-8 md:px-16">
            <h1 className="text-4xl font-heading font-bold mb-4">{title || 'Kamunati'}</h1>
            <p className="text-text-muted text-lg">{emptyMessage}</p>
          </div>
        )}
        
        <div className={`relative z-10 space-y-8 ${featuredMedia ? 'pb-24 -mt-32' : 'pb-24 pt-8'}`}>
          
          {title && featuredMedia && (
            <div className="px-8 md:px-16 pt-8">
               <h1 className="text-3xl font-heading font-bold">{title}</h1>
            </div>
          )}
  
          {showContinueWatching && continueWatching.length > 0 && (
            <ContinueWatchingRow items={continueWatching} />
          )}
          
          
        
        {Array.isArray(landingRows) && landingRows.length > 0 ? (
          landingRows.map((row: any) => (
            <MediaRow key={row.id} title={row.title} items={row.items} />
          ))
        ) : trendingMovies.length > 0 ? (
          <>
            <MediaRow title={category ? "Trending in this category" : "Trending Now"} items={trendingMovies} />
            <MediaRow title="Action & Adventure" items={trendingMovies.slice().reverse()} />
            <MediaRow title="Sci-Fi Masterpieces" items={trendingMovies} />
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}
