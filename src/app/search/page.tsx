'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { 
  Search as SearchIcon, 
  X, 
  Sparkles, 
  Film, 
  Tv, 
  TrendingUp, 
  Compass, 
  SlidersHorizontal,
  Flame,
  ArrowRight
} from 'lucide-react';
import MediaCard from '../../components/browse/MediaCard';
import { SearchIconCards } from '../../components/search/SearchIconCards';
import { useDebounce } from 'use-debounce';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const RibbonFieldBackground = dynamic(
  () => import('../../shaders/ribbon-field/RibbonFieldBackground').then(mod => mod.RibbonFieldBackground),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then(res => res.json());

const QUICK_SUGGESTIONS = [
  { label: 'Trending', query: 'Trending', icon: TrendingUp },
  { label: 'Action', query: 'Action', icon: Flame },
  { label: 'Sci-Fi', query: 'Science Fiction', icon: Sparkles },
  { label: 'Crime', query: 'Crime', icon: Compass },
  { label: 'Top Rated', query: 'Top Rated', icon: Sparkles },
  { label: 'Movies', query: 'Movie', icon: Film },
  { label: 'Series', query: 'Series', icon: Tv },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MOVIE' | 'TV_SERIES' | 'ANIME'>('ALL');
  
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== query) {
      setQuery(q);
    }
  }, [searchParams]);

  const [debouncedQuery] = useDebounce(query, 350);

  // Sync debounced query to URL query parameter without full reload
  useEffect(() => {
    if (debouncedQuery.trim()) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`, { scroll: false });
    } else if (searchParams.get('q')) {
      router.replace('/search', { scroll: false });
    }
  }, [debouncedQuery, router]);

  const searchUrl = debouncedQuery.length > 0 
    ? `/api/media/search?q=${encodeURIComponent(debouncedQuery)}${activeCategory !== 'ALL' ? `&category=${activeCategory}` : ''}`
    : null;

  const { data, error, isLoading } = useSWR(searchUrl, fetcher);

  const rawResults: any[] = data?.results || [];

  // Filter results client-side for immediate responsive tab switching
  const filteredResults = useMemo(() => {
    if (activeCategory === 'ALL') return rawResults;
    return rawResults.filter(m => m.category === activeCategory);
  }, [rawResults, activeCategory]);

  const handleSelectIconCategory = (catQuery: string) => {
    setQuery(catQuery);
    setActiveCategory('ALL');
  };

  const handleClear = () => {
    setQuery('');
    setActiveCategory('ALL');
  };

  const moviesCount = rawResults.filter(m => m.category === 'MOVIE').length;
  const seriesCount = rawResults.filter(m => m.category === 'TV_SERIES').length;
  const animeCount = rawResults.filter(m => m.category === 'ANIME').length;

  const hasSearchQuery = debouncedQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-bg pt-24 px-6 md:px-12 lg:px-16 text-text relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen">
        <RibbonFieldBackground hue={265} saturation={1.3} speed={0.3} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-10 pb-28">
        {/* Search Header Banner */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles size={14} />
            <span>Interactive Media Finder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight">
            Search & Explore
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Find films, TV series, directors, and genres or browse effortlessly using category cards.
          </p>
        </div>

        {/* Halo Search Input Bar */}
        <div className="space-y-4">
          <div className="relative group max-w-3xl mx-auto">
            {/* [RECTIFICATION:REMOVE_LIVE_GRADIENT_FILL_IN_BUTTONS] */}
            {/* Live gradient removed from search bar outline/glow and filled into buttons */}
            <div className="relative z-10 flex items-center bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10 group-focus-within:border-white/25 rounded-2xl shadow-2xl transition-all duration-300">
              <SearchIcon className="ml-5 text-white/40 group-focus-within:text-white w-6 h-6 transition-colors shrink-0" />
              
              <input 
                type="text" 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, director, cast, or genre (e.g. Nolan, Sci-Fi)..."
                className="w-full bg-transparent text-lg md:text-xl font-heading text-white placeholder:text-white/30 py-5 pl-4 pr-4 focus:outline-none"
              />
              <button
                type="submit"
                className="mr-3 px-5 py-2.5 rounded-xl btn-live-gradient text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                Search
              </button>

              {query && (
                <button 
                  onClick={handleClear}
                  className="mr-5 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  title="Clear query"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-3xl mx-auto">
            <span className="text-xs text-white/40 font-medium mr-1 flex items-center gap-1">
              <SlidersHorizontal size={12} /> Popular:
            </span>
            {QUICK_SUGGESTIONS.map(item => {
              const Icon = item.icon;
              const isCurrent = query.toLowerCase() === item.query.toLowerCase();
              return (
                <button
                  key={item.label}
                  onClick={() => handleSelectIconCategory(item.query)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(80,26,150,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                  }`}
                >
                  <Icon size={12} className={isCurrent ? 'text-white' : 'text-primary/70'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        {hasSearchQuery ? (
          /* Search Results View */
          <div className="space-y-6 animate-fadeIn">
            {/* Active search filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">
                  Showing results for:
                </span>
                <span className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/40 text-sm font-semibold text-white flex items-center gap-2">
                  <span>"{debouncedQuery}"</span>
                  <button onClick={handleClear} className="hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </span>
                {!isLoading && (
                  <span className="text-xs text-white/40">
                    ({filteredResults.length} title{filteredResults.length === 1 ? '' : 's'})
                  </span>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeCategory === 'ALL'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  All ({rawResults.length})
                </button>

                <button
                  onClick={() => setActiveCategory('MOVIE')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeCategory === 'MOVIE'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Movies ({moviesCount})
                </button>

                <button
                  onClick={() => setActiveCategory('TV_SERIES')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeCategory === 'TV_SERIES'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  TV Series ({seriesCount})
                </button>

                {animeCount > 0 && (
                  <button
                    onClick={() => setActiveCategory('ANIME')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeCategory === 'ANIME'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Anime ({animeCount})
                  </button>
                )}
              </div>
            </div>

            {/* Loading Spinner */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <div key={n} className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              /* No Results Empty State */
              <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/40">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">No titles matched "{debouncedQuery}"</h3>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  Try checking for typos, searching by director or genre, or select one of the popular categories below.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleClear}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors shadow-lg"
                  >
                    Browse All Categories
                  </button>
                </div>
              </div>
            ) : (
              /* Results Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.map((media: any) => {
                  let ambientPalette;
                  try {
                    if (typeof media.ambientPalette === 'string') ambientPalette = JSON.parse(media.ambientPalette);
                    else ambientPalette = media.ambientPalette;
                  } catch(e) {}

                  let parsedGenres: string[] = [];
                  try {
                    if (media.genres) parsedGenres = JSON.parse(media.genres);
                  } catch(e) {}

                  return (
                    <MediaCard 
                      key={media.id} 
                      id={media.id} 
                      title={media.title} 
                      posterUrl={media.posterPath || media.backdropPath || '/logo.svg'}
                      backdropUrl={media.backdropPath || media.posterPath}
                      hoverBannerUrl={media.hoverBannerKey}
                      hoverClipUrl={media.hoverClipKey}
                      hoverTagline={media.hoverTagline}
                      ambientPalette={ambientPalette}
                      qualityBadge={media.infoHash ? 'HD' : undefined}
                      metadata={{
                        category: media.category,
                        year: media.releaseYear,
                        rating: media.rating,
                        runtime: media.runtime,
                        genres: parsedGenres
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Category Cards Section underneath results for fast hopping */}
            <div className="pt-12 border-t border-white/10">
              <SearchIconCards 
                onSelectCategory={handleSelectIconCategory}
                selectedQuery={query}
              />
            </div>
          </div>
        ) : (
          /* Default Discovery View: Card-Based UI for Search from Icons */
          <div className="space-y-8 animate-fadeIn">
            <SearchIconCards 
              onSelectCategory={handleSelectIconCategory}
              selectedQuery={query}
            />
          </div>
        )}
      </div>
    </div>
  );
}
