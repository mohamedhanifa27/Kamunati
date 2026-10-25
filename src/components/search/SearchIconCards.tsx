'use client';

import React from 'react';
import { 
  TrendingUp, 
  Zap, 
  Rocket, 
  Compass, 
  Smile, 
  Ghost, 
  Sparkles, 
  Film, 
  Tv, 
  Award, 
  Heart, 
  Music,
  ArrowUpRight
} from 'lucide-react';

export interface SearchCategoryCard {
  id: string;
  name: string;
  query: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string; // Tailwind color classes for glow & accents
  gradient: string;
  borderHover: string;
}

export const SEARCH_ICON_CATEGORIES: SearchCategoryCard[] = [
  {
    id: 'trending',
    name: 'Trending Now',
    query: 'Trending',
    tagline: 'Most streamed & watched right now',
    icon: TrendingUp,
    accentColor: 'text-amber-400',
    gradient: 'from-amber-500/20 via-red-500/10 to-transparent',
    borderHover: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]'
  },
  {
    id: 'action',
    name: 'Action & Adventure',
    query: 'Action',
    tagline: 'High-octane fights, chases & adrenaline',
    icon: Zap,
    accentColor: 'text-orange-400',
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    borderHover: 'hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]'
  },
  {
    id: 'scifi',
    name: 'Sci-Fi & Cyberpunk',
    query: 'Science Fiction',
    tagline: 'Future worlds, AI, space & time travel',
    icon: Rocket,
    accentColor: 'text-cyan-400',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    borderHover: 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]'
  },
  {
    id: 'crime',
    name: 'Crime & Mystery',
    query: 'Crime',
    tagline: 'Noir, heists, detectives & conspiracies',
    icon: Compass,
    accentColor: 'text-purple-400',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    borderHover: 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]'
  },
  {
    id: 'comedy',
    name: 'Comedy & Laughs',
    query: 'Comedy',
    tagline: 'Feel-good humor, satire & wild antics',
    icon: Smile,
    accentColor: 'text-yellow-400',
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    borderHover: 'hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.25)]'
  },
  {
    id: 'horror',
    name: 'Horror & Thriller',
    query: 'Horror',
    tagline: 'Supernatural chills, gore & intense suspense',
    icon: Ghost,
    accentColor: 'text-rose-400',
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    borderHover: 'hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]'
  },
  {
    id: 'anime',
    name: 'Anime Central',
    query: 'Anime',
    tagline: 'Shonen, mecha, fantasy & iconic animation',
    icon: Sparkles,
    accentColor: 'text-pink-400',
    gradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
    borderHover: 'hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]'
  },
  {
    id: 'movies',
    name: 'Feature Movies',
    query: 'Movie',
    tagline: 'Blockbusters, indie cinema & epics',
    icon: Film,
    accentColor: 'text-emerald-400',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    borderHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]'
  },
  {
    id: 'series',
    name: 'TV & Series',
    query: 'Series',
    tagline: 'Binge-worthy seasons and miniseries',
    icon: Tv,
    accentColor: 'text-blue-400',
    gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    borderHover: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]'
  },
  {
    id: 'toprated',
    name: 'Top Rated Classics',
    query: 'Top Rated',
    tagline: 'Highest rated masterpieces of all time',
    icon: Award,
    accentColor: 'text-amber-300',
    gradient: 'from-amber-400/20 via-yellow-500/10 to-transparent',
    borderHover: 'hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]'
  },
  {
    id: 'drama',
    name: 'Drama & Romance',
    query: 'Drama',
    tagline: 'Deep storytelling, romance & emotion',
    icon: Heart,
    accentColor: 'text-red-400',
    gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    borderHover: 'hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]'
  },
  {
    id: 'music',
    name: 'Music & Arts',
    query: 'Music',
    tagline: 'Concerts, musicals & sound-driven stories',
    icon: Music,
    accentColor: 'text-fuchsia-400',
    gradient: 'from-fuchsia-500/20 via-purple-500/10 to-transparent',
    borderHover: 'hover:border-fuchsia-500/50 hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]'
  }
];

interface SearchIconCardsProps {
  onSelectCategory: (query: string) => void;
  selectedQuery?: string;
}

export function SearchIconCards({ onSelectCategory, selectedQuery }: SearchIconCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <span>Browse by Category & Genre</span>
          </h2>
          <p className="text-white/50 text-xs mt-0.5">
            Click any card to instantly discover titles matching that mood or theme.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {SEARCH_ICON_CATEGORIES.map(category => {
          const Icon = category.icon;
          const isSelected = selectedQuery?.toLowerCase() === category.query.toLowerCase();

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.query)}
              className={`group relative text-left p-5 rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] overflow-hidden ${
                isSelected
                  ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(80,26,150,0.4)] scale-[1.02]'
                  : `border-white/10 bg-black/40 hover:bg-black/60 ${category.borderHover} hover:-translate-y-1`
              }`}
            >
              {/* Subtle dynamic background gradient */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} 
              />

              <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Top: Icon + Arrow */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 shadow-lg ${category.accentColor}`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                {/* Bottom: Title & Subtitle */}
                <div>
                  <h3 className="font-heading font-bold text-base text-white group-hover:text-white flex items-center gap-2">
                    {category.name}
                  </h3>
                  <p className="text-white/50 text-xs mt-1 line-clamp-1 group-hover:text-white/70 transition-colors">
                    {category.tagline}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
