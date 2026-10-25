// [RECTIFICATION:WATCHVIEW_USEMEMO_IMPORT]
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { 
  ArrowLeft, 
  Maximize2, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Info, 
  Sparkles, 
  Star, 
  Clock, 
  Play, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Film,
  Tv
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { AmbientPauser } from '@/features/ambient';
import { useNotification } from '../ui/NotificationProvider';
// [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
import { 
  isSingleFileSeries, 
  resolveSeriesEpisodesInSingleFile, 
  ResolvedEpisode 
} from '@/lib/seriesEpisodeResolver';

interface SimilarMovieItem {
  id: string;
  title: string;
  category?: string | null;
  genres?: string[];
  releaseYear?: number | null;
  rating?: number | null;
  runtime?: number | null;
  overview?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  resolution?: string;
  score?: number;
}

interface WatchViewProps {
  media: any;
  torrents: any[];
  streamUrl: string;
  initialInfoHash: string;
  similarMovies: SimilarMovieItem[];
}

export default function WatchView({
  media,
  torrents,
  streamUrl,
  initialInfoHash,
  similarMovies = []
}: WatchViewProps) {
  const router = useRouter();
  const { notify } = useNotification();
  const playerRef = useRef<{ 
    requestFullscreen: () => void; 
    playEpisode?: (ep: any) => void;
    seekTo?: (t: number) => void;
  } | null>(null);

  // [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES]
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(media.seasons?.[0]?.episodes?.[0]?.id || null);
  const isSingleFile = useMemo(() => isSingleFileSeries(media), [media]);

  const seriesEpisodes = useMemo(() => {
    const eps: any[] = [];
    (media.seasons || []).forEach((s: any) => {
      (s.episodes || []).forEach((e: any) => {
        eps.push({ ...e, seasonNumber: s.seasonNumber });
      });
    });
    if (eps.length === 0) return [];
    if (isSingleFile) {
      return resolveSeriesEpisodesInSingleFile(eps, undefined, media.runtime ? media.runtime * 60 : undefined);
    }
    return eps.map(e => ({
      ...e,
      formattedStart: '',
      formattedDuration: e.duration ? `${e.duration}m` : ''
    }));
  }, [media, isSingleFile]);

  const handleEpisodeClick = (ep: any) => {
    setActiveEpisodeId(ep.id);
    if (playerRef.current?.playEpisode) {
      playerRef.current.playEpisode(ep);
    }
  };

  const [isTheater, setIsTheater] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Dynamically track active torrent hash across multi-torrent media
  const [activeTorrentHash, setActiveTorrentHash] = useState(initialInfoHash || torrents?.[0]?.infoHash);

  // Check initial watchlist status
  useEffect(() => {
    let isMounted = true;
    fetch('/api/user/watchlist')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted || !data || !Array.isArray(data)) return;
        const exists = data.some((item: any) => item.mediaId === media.id || item.media?.id === media.id);
        setIsInWatchlist(exists);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [media.id]);

  const toggleWatchlist = async () => {
    if (isWatchlistLoading) return;
    setIsWatchlistLoading(true);
    const prev = isInWatchlist;
    setIsInWatchlist(!prev);

    try {
      const res = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: media.id })
      });
      if (res.ok) {
        const data = await res.json();
        const added = data.action === 'added';
        setIsInWatchlist(added);
        notify(
          added ? 'Added to Watchlist' : 'Removed from Watchlist',
          media.title,
          added ? 'success' : 'default'
        );
      } else {
        setIsInWatchlist(prev);
        notify('Failed to update Watchlist', 'Please try again', 'destructive');
      }
    } catch {
      setIsInWatchlist(prev);
      notify('Network error', 'Could not update Watchlist', 'destructive');
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        notify('Link Copied!', 'Watch link copied to your clipboard', 'success');
      }
    } catch {
      notify('Link Share', window.location.href, 'default');
    }
  };

  const handleFullscreenTrigger = () => {
    if (playerRef.current) {
      playerRef.current.requestFullscreen();
    }
  };

  // Helper to filter out non-movie categories/genres (e.g. music is not a category in the platform)
  const isMovieGenre = (g: string) => {
    const lower = g.trim().toLowerCase();
    return lower !== 'music' && lower !== 'musical';
  };

  // Parse media genres excluding non-movie categories
  const parsedGenres: string[] = (() => {
    try {
      let list: string[] = [];
      if (Array.isArray(media.genres)) list = media.genres;
      else if (typeof media.genres === 'string') {
        const p = JSON.parse(media.genres);
        if (Array.isArray(p)) list = p;
      }
      return list.filter(isMovieGenre);
    } catch {}
    return [];
  })();

  // Filter chips options (strictly movie/series genres)
  const filterOptions = [
    { id: 'ALL', label: 'All' },
    ...(parsedGenres.slice(0, 3).map(g => ({ id: g.toLowerCase(), label: g }))),
    { id: 'TOP_RATED', label: 'Top Rated' }
  ];

  // Filtered similar movies
  const filteredSimilarMovies = similarMovies.filter(item => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'TOP_RATED') return (item.rating || 0) >= 7.5;
    const itemGenres = (item.genres || []).filter(isMovieGenre).map(g => g.toLowerCase());
    return itemGenres.includes(selectedFilter.toLowerCase());
  });

  const displayMovies = filteredSimilarMovies.length > 0 ? filteredSimilarMovies : similarMovies;

  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  const currentTorrent = (torrents || []).find((t: any) => t.infoHash === activeTorrentHash) || torrents?.[0];
  const formatRuntime = (mins?: number | null) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col selection:bg-purple-500 selection:text-white">
      <AmbientPauser />

      {/* Top YouTube-style Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/[0.08] transition-colors">
        <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: Back & Brand */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium"
              title="Go back"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/" className="flex items-center gap-2 flex-shrink-0" title="Kamunati Home">
              <img src="/logo.svg" alt="Kamunati Logo" className="h-6 sm:h-7 object-contain" />
            </Link>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            {/* Now Playing Title Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs truncate max-w-[380px] text-neutral-300">
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] uppercase font-bold tracking-wider text-purple-300 flex-shrink-0">
                {media.category?.replace('_', ' ') || 'MOVIE'}
              </span>
              <span className="truncate font-medium text-white">{media.title}</span>
            </div>
          </div>

          {/* Right: Actions & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link 
              href="/search" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-300 hover:text-white transition-colors text-xs font-medium"
              title="Search movies"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
            </Link>

            <Link 
              href={`/title/${media.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-300 hover:text-white transition-colors text-xs font-medium"
              title="View full movie page"
            >
              <Info size={14} />
              <span className="hidden sm:inline">Title Info</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Layout Grid: Standard (2 cols) vs Theater (full width player on top) */}
        <div className={`transition-all duration-300 ${isTheater ? 'flex flex-col gap-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8'}`}>

          {/* Left Column (or Top in Theater mode): Video Player + Details */}
          <div className={`${isTheater ? 'w-full' : 'lg:col-span-8 xl:col-span-8 2xl:col-span-9'} flex flex-col gap-4 sm:gap-5`}>
            
            {/* Video Player Frame Container */}
            <div className="relative group w-full">
              {/* Subtle ambient lighting behind player */}
              <div 
                className="absolute -inset-1 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-purple-600/20 via-indigo-500/10 to-transparent blur-xl opacity-70 pointer-events-none -z-10"
              />

              <div 
                className={`w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative ${
                  isTheater 
                    ? 'aspect-video sm:aspect-[21/9] max-h-[78vh]' 
                    : 'aspect-video max-h-[74vh]'
                }`}
              >
                <VideoPlayer 
                  mediaId={media.id}
                  title={media.title}
                  src={streamUrl}
                  infoHash={initialInfoHash}
                  torrents={torrents}
                  media={media}
                  similarMovies={similarMovies}
                  onToggleTheater={() => setIsTheater(prev => !prev)}
                  isTheater={isTheater}
                  playerRef={playerRef}
                  onActiveTorrentChange={setActiveTorrentHash}
                />
              </div>
            </div>

            {/* Movie Title & Info Bar Under Player */}
            <div className="flex flex-col gap-3 pt-1">
              {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
              {/* Title: render media title logo if available, fallback to title text */}
              {media.logoPath ? (
                <div className="py-1">
                  <img 
                    src={media.logoPath} 
                    alt={media.title} 
                    className="max-h-14 sm:max-h-20 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]" 
                  />
                </div>
              ) : (
                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-white tracking-tight leading-tight">
                  {media.title}
                </h1>
              )}

              {/* Meta pills + Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-neutral-300">
                  {media.releaseYear && (
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] font-medium">
                      {media.releaseYear}
                    </span>
                  )}
                  {media.category && (
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold tracking-wide uppercase text-[11px]">
                      {media.category.replace('_', ' ')}
                    </span>
                  )}
                  {media.rating && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 stroke-none" />
                      {media.rating.toFixed(1)}
                    </span>
                  )}
                  {media.runtime && (
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-neutral-400" />
                      {formatRuntime(media.runtime)}
                    </span>
                  )}
                  {currentTorrent?.resolution && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px]">
                      {currentTorrent.resolution}
                    </span>
                  )}
                </div>

                {/* YouTube-style Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Fullscreen Button */}
                  {/* [RECTIFICATION:REMOVE_LIVE_GRADIENT_FILL_IN_BUTTONS] Filled live gradient in primary action button */}
                  <button
                    onClick={handleFullscreenTrigger}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full btn-live-gradient text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title="Watch in Fullscreen (f)"
                  >
                    <Maximize2 size={15} />
                    <span>Fullscreen</span>
                  </button>

                  {/* Theater Mode Toggle */}
                  <button
                    onClick={() => setIsTheater(prev => !prev)}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-neutral-200 hover:text-white text-xs sm:text-sm font-medium transition-all"
                    title={isTheater ? 'Default view (t)' : 'Theater mode (t)'}
                  >
                    <Film size={15} />
                    <span>{isTheater ? 'Default View' : 'Theater Mode'}</span>
                  </button>

                  {/* Watchlist Toggle */}
                  <button
                    onClick={toggleWatchlist}
                    disabled={isWatchlistLoading}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs sm:text-sm font-medium transition-all ${
                      isInWatchlist
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-neutral-200 hover:text-white'
                    }`}
                    title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {isInWatchlist ? (
                      <>
                        <BookmarkCheck size={15} className="text-purple-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={15} />
                        <span>Watchlist</span>
                      </>
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-neutral-200 hover:text-white text-xs sm:text-sm font-medium transition-all"
                    title="Copy movie link"
                  >
                    <Share2 size={15} />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>

              {/* YouTube-style Description / Synopsis Box */}
              <div className="mt-1 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all text-sm leading-relaxed text-neutral-200">
                {/* Genres badges */}
                {parsedGenres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {parsedGenres.map(genre => (
                      <span
                        key={genre}
                        className="px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 text-xs font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                {media.overview ? (
                  <div>
                    {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
                    {/* Description: synopsis in pixel font */}
                    <p className={`text-neutral-300 text-xs sm:text-sm leading-relaxed font-pixelcode tracking-wide ${isOverviewExpanded ? '' : 'line-clamp-3'}`}>
                      {media.overview}
                    </p>
                    <button
                      onClick={() => setIsOverviewExpanded(prev => !prev)}
                      className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isOverviewExpanded ? (
                        <>Show less <ChevronUp size={14} /></>
                      ) : (
                        <>Show more <ChevronDown size={14} /></>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm italic">No synopsis available for this title.</p>
                )}

                {/* Additional metadata row if expanded */}
                {isOverviewExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-400">
                    {media.tagline && (
                      <div className="col-span-full italic text-neutral-300">
                        &ldquo;{media.tagline}&rdquo;
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500 font-medium">Torrents Available: </span>
                      <span className="text-neutral-300">{torrents.length} sources</span>
                    </div>
                    {currentTorrent?.seeders !== undefined && (
                      <div>
                        <span className="text-neutral-500 font-medium">Swarm Health: </span>
                        <span className="text-emerald-400 font-semibold">{currentTorrent.seeders} peers connected</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* [RECTIFICATION:SINGLE_FILE_SERIES_EPISODES] */}
              {/* TV Series Episode Navigator (Single-File & Multi-File Support) */}
              {(media.type === 'SERIES' || media.category === 'TV_SERIES') && seriesEpisodes.length > 0 && (
                <div className="mt-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Tv size={16} />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-heading font-bold text-white tracking-tight">
                          Series Episodes
                        </h2>
                        <span className="text-xs text-neutral-400 font-pixelcode">
                          {seriesEpisodes.length} Episodes Available
                        </span>
                      </div>
                    </div>

                    {isSingleFile && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-[11px] font-bold text-purple-300">
                        <Sparkles size={12} className="text-purple-400 animate-pulse" />
                        <span>Single-File Stream • Auto-Mapped Episodes</span>
                      </div>
                    )}
                  </div>

                  {/* Episodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {seriesEpisodes.map((ep: any) => {
                      const isNowPlaying = activeEpisodeId === ep.id;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => handleEpisodeClick(ep)}
                          className={`text-left p-2.5 rounded-xl border transition-all flex gap-3 group cursor-pointer ${
                            isNowPlaying 
                              ? 'bg-purple-600/15 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/40' 
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                          }`}
                        >
                          {/* Episode Still / Thumbnail */}
                          <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                            <img
                              src={ep.stillPath || media.backdropPath || media.posterPath || '/logo.svg'}
                              alt={ep.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={16} className="text-white fill-white" />
                            </div>
                            {ep.formattedStart && (
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-purple-200">
                                {ep.formattedStart}
                              </div>
                            )}
                          </div>

                          {/* Episode Metadata */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                                S{ep.seasonNumber || 1} E{ep.episodeNumber}
                              </span>
                              {isNowPlaying && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500 text-white font-bold uppercase tracking-wider animate-pulse">
                                  Playing
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5 group-hover:text-purple-300 transition-colors">
                              {ep.title}
                            </h3>
                            {ep.overview && (
                              <p className="text-[11px] text-neutral-400 line-clamp-1 font-pixelcode mt-1">
                                {ep.overview}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (or Bottom in Theater mode): Similar Movies Suggestions */}
          <div className={`${isTheater ? 'w-full mt-2' : 'lg:col-span-4 xl:col-span-4 2xl:col-span-3'} flex flex-col gap-3.5`}>
            
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles size={15} />
                </div>
                <h2 className="text-base sm:text-lg font-heading font-bold text-white tracking-tight">
                  Similar Movies
                </h2>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                {displayMovies.length} recommendations
              </span>
            </div>

            {/* YouTube-style Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 hide-scrollbar">
              {filterOptions.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFilter === chip.id
                      ? 'bg-white text-black shadow-md'
                      : 'bg-white/[0.07] hover:bg-white/[0.13] text-neutral-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Suggested Movies List */}
            <div className="flex flex-col gap-2.5">
              {displayMovies.length > 0 ? (
                displayMovies.map((similar) => {
                  const thumbUrl = similar.backdropPath || similar.posterPath || '/logo.svg';
                  return (
                    <Link
                      key={similar.id}
                      href={`/watch/${similar.id}`}
                      className="group flex gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-pointer"
                    >
                      {/* Thumbnail Container (16:9 ratio like YouTube) */}
                      <div className="relative w-36 sm:w-40 md:w-44 aspect-video rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 shadow-md">
                        <img
                          src={thumbUrl}
                          alt={similar.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Hover Overlay with Play Button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play size={14} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>

                        {/* Duration badge bottom-right */}
                        {similar.runtime && (
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                            {formatRuntime(similar.runtime)}
                          </div>
                        )}

                        {/* Quality badge top-left */}
                        {similar.resolution && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-bold text-purple-300 uppercase tracking-wider backdrop-blur-sm">
                            {similar.resolution}
                          </div>
                        )}
                      </div>

                      {/* Content Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
                        {/* Title (2 lines clamp) */}
                        <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                          {similar.title}
                        </h3>

                        {/* Category & Year */}
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                          <span>{similar.releaseYear || 'Movie'}</span>
                          <span>•</span>
                          <span className="capitalize">{similar.category?.toLowerCase().replace('_', ' ') || 'Movie'}</span>
                        </div>

                        {/* Rating & Genres */}
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                          {similar.rating && (
                            <div className="flex items-center gap-0.5 text-amber-400 font-semibold">
                              <Star size={10} className="fill-amber-400 stroke-none" />
                              <span>{similar.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {similar.rating && (similar.genres || []).filter(isMovieGenre).length > 0 && (
                            <span>•</span>
                          )}
                          {(similar.genres || []).filter(isMovieGenre).length > 0 && (
                            <span className="truncate text-neutral-400">
                              {(similar.genres || []).filter(isMovieGenre).slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-xl text-neutral-400 text-xs">
                  No matching similar movies found.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
