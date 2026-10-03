'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Play, EyeOff, Check, RotateCcw, Trash2, MoreVertical } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ManageContinueWatching() {
  const { data: items, mutate } = useSWR('/api/progress/continue', fetcher);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAction = async (action: 'hide' | 'mark-watched' | 'reset', mediaId: string) => {
    // Optimistic UI could be added here
    let url = '';
    let method = 'POST';

    if (action === 'hide') {
      url = `/api/progress/continue/${mediaId}`;
      method = 'DELETE';
    } else if (action === 'mark-watched') {
      url = `/api/progress/${mediaId}/mark-watched`;
    } else if (action === 'reset') {
      url = `/api/progress/${mediaId}/reset`;
    }

    try {
      await fetch(url, { method });
      mutate();
    } catch(e) {}
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/progress/continue', { method: 'DELETE' });
      setShowClearConfirm(false);
      mutate();
    } catch(e) {}
  };

  if (!items) return <div className="text-neutral-500 py-12 flex justify-center animate-pulse">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto md:mx-0">
      <div className="flex justify-between items-start md:items-center mb-8 gap-4 flex-col md:flex-row">
        <div>
          <h2 className="text-2xl font-heading font-bold">Continue Watching</h2>
          <p className="text-neutral-400 text-sm mt-1">Manage titles you're currently watching.</p>
        </div>
        <button 
          onClick={() => setShowClearConfirm(true)}
          disabled={items.length === 0}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-white/5 text-neutral-300 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl">
          <p className="text-neutral-400 text-lg">No titles in progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => {
            const media = item.media;
            const episode = item.episode;
            // Dummy total duration if not available on media (typically derived or hardcoded for mock)
            const totalDuration = episode ? 24 * 60 : 120 * 60; // 24m or 120m
            const progressPct = Math.min(100, (item.timestampSec / totalDuration) * 100);

            return (
              <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-24 md:w-32 aspect-video shrink-0 bg-neutral-800 rounded-lg overflow-hidden relative border border-white/10">
                  <img src={media?.posterPath || '/logo_vector.svg'} alt={media?.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-lg truncate">{media?.title}</h4>
                  <p className="text-sm text-neutral-400 truncate">
                    {episode ? `S${episode.seasonNumber} E${episode.episodeNumber} - ${episode.title}` : 'Movie'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2 hidden sm:block">
                    Watched {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="hidden md:flex px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-medium transition-colors items-center gap-2">
                    <Play size={16} className="fill-white" /> Resume
                  </button>
                  
                  <div className="relative group/menu">
                    <button className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/20 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                      <button onClick={() => handleAction('hide', media.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <EyeOff size={16} /> Hide from list
                      </button>
                      <button onClick={() => handleAction('mark-watched', media.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Check size={16} /> Mark as watched
                      </button>
                      <button onClick={() => handleAction('reset', media.id)} className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                        <RotateCcw size={16} /> Start over
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-heading font-bold mb-2">Clear Continue Watching?</h3>
            <p className="text-neutral-400 mb-6 text-sm">
              This will hide all {items.length} titles from your list. They will reappear if you watch them again.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-full font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 rounded-full font-medium bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
