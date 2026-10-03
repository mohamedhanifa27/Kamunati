'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Link } from 'next-view-transitions';
import { Trash2, X } from 'lucide-react';
import { featureFlags } from '../../lib/featureFlags';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, title, count, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-xl font-heading font-bold mb-2">{title}</h3>
        <p className="text-neutral-400 mb-6 text-sm">
          This removes {count} {count === 1 ? 'item' : 'items'}. This can't be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            autoFocus
            onClick={onCancel}
            className="px-4 py-2 rounded-full font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-full font-medium bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileDashboard() {
  const router = useRouter();
  
  if (!featureFlags.singleProfile) {
    // Fallback if accessed directly while flag is off
    return (
      <div className="min-h-screen pt-32 px-8 flex flex-col items-center">
        <h1 className="text-2xl mb-4">Multi-profile mode active</h1>
        <Link href="/profiles" className="text-primary hover:underline">Go to Profiles</Link>
      </div>
    );
  }

  const { data: profile, mutate: mutateProfile } = useSWR('/api/me/profile', fetcher);
  const { data: stats, mutate: mutateStats } = useSWR('/api/me/stats', fetcher);
  const { data: watchlist, mutate: mutateWatchlist } = useSWR('/api/user/watchlist', fetcher);
  
  const [clearing, setClearing] = useState<{type: 'watchlist' | 'search' | 'watched', title: string, count: number} | null>(null);

  const handleClear = async () => {
    if (!clearing) return;
    
    let endpoint = '';
    if (clearing.type === 'watchlist') endpoint = '/api/watchlist';
    if (clearing.type === 'search') endpoint = '/api/search/history';
    if (clearing.type === 'watched') endpoint = '/api/history/watched';

    try {
      await fetch(endpoint, { method: 'DELETE' });
      
      // Invalidate relevant caches
      if (clearing.type === 'watchlist') mutateWatchlist();
      mutateStats(); // stats update for all
      
      // We could add a toast here
    } catch (e) {
      console.error('Failed to clear', e);
    } finally {
      setClearing(null);
    }
  };

  if (!profile || !stats) {
    return (
      <div className="min-h-screen pt-32 px-8 flex justify-center text-neutral-500 animate-pulse">
        Loading profile...
      </div>
    );
  }

  const memberSinceStr = new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 md:px-16 relative z-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center text-4xl font-bold overflow-hidden shrink-0 border border-white/20">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/50">{profile.displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-heading font-bold">{profile.displayName}</h1>
          <p className="text-neutral-400 mt-1">{profile.email} &bull; Member since {memberSinceStr}</p>
        </div>
        <Link 
          href="/settings/account"
          className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10"
        >
          Edit Profile
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Titles Watched', value: stats.titlesWatched },
          { label: 'Hours Watched', value: stats.hoursWatched },
          { label: 'My List Size', value: stats.listSize },
          { label: 'Reviews', value: stats.reviewsWritten },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col items-center text-center">
            <span className="text-3xl font-bold font-heading mb-1">{s.value}</span>
            <span className="text-sm text-neutral-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-8">
        
        {/* My List Card */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                My List <span className="text-neutral-500 text-sm font-normal">({stats.listSize})</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/list" className="text-sm font-medium hover:text-primary transition-colors">View all</Link>
              <Link href="/settings/my-list" className="text-sm font-medium hover:text-primary transition-colors">Customize</Link>
              <button 
                disabled={stats.listSize === 0}
                onClick={() => setClearing({ type: 'watchlist', title: 'Clear My List?', count: stats.listSize })}
                className="p-2 text-neutral-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-full"
                aria-label="Clear My List"
                title="Clear My List"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          {stats.listSize === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-neutral-400 mb-2">Your list is empty.</p>
              <Link href="/" className="text-primary hover:underline text-sm font-medium">Browse titles</Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-hidden">
              {/* Assuming watchlist is populated, display max 6 */}
              {(watchlist || []).slice(0, 6).map((item: any) => (
                <div key={item.id} className="w-24 md:w-32 aspect-[2/3] rounded-lg bg-neutral-800 overflow-hidden shrink-0 border border-white/10">
                  <img src={item.posterPath || item.media?.posterPath || '/logo_vector.svg'} alt={item.title || item.media?.title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Search History Card */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-heading font-bold">Search History</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/search" className="text-sm font-medium hover:text-primary transition-colors">View all</Link>
              <button 
                onClick={() => setClearing({ type: 'search', title: 'Clear Search History?', count: 5 /* Mock count since search endpoint is stubbed */ })}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 rounded-full"
                aria-label="Clear Search History"
                title="Clear Search History"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-neutral-400 mb-2">No recent searches.</p>
            <Link href="/search" className="text-primary hover:underline text-sm font-medium">Start searching</Link>
          </div>
        </section>

        {/* Watched List Card */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                Watched List <span className="text-neutral-500 text-sm font-normal">({stats.titlesWatched})</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile/watched" className="text-sm font-medium hover:text-primary transition-colors">View all</Link>
              <button 
                disabled={stats.titlesWatched === 0}
                onClick={() => setClearing({ type: 'watched', title: 'Clear Watched List?', count: stats.titlesWatched })}
                className="p-2 text-neutral-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-full"
                aria-label="Clear Watched List"
                title="Clear Watched List"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          {stats.titlesWatched === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-neutral-400 mb-2">You haven't finished watching anything yet.</p>
              <Link href="/" className="text-primary hover:underline text-sm font-medium">Browse titles</Link>
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-neutral-400 text-sm">Recently watched titles will appear here.</p>
            </div>
          )}
        </section>

      </div>

      <ConfirmDialog 
        isOpen={!!clearing}
        title={clearing?.title || ''}
        count={clearing?.count || 0}
        onConfirm={handleClear}
        onCancel={() => setClearing(null)}
      />
    </div>
  );
}
