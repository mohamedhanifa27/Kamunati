'use client';

import React from 'react';
import useSWR from 'swr';
import { Link } from 'next-view-transitions';
import { Star, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { featureFlags } from '../../../lib/featureFlags';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MyReviewsPage() {
  if (!featureFlags.reviews) {
    return (
      <div className="pt-32 px-8 text-center text-neutral-400">
        Reviews feature is disabled.
      </div>
    );
  }

  const { data, mutate } = useSWR('/api/me/reviews', fetcher);

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      mutate();
    } catch(e) {}
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-8 md:px-16 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-heading font-bold">My Reviews</h1>
      </div>

      {!data && (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-xl"></div>
          <div className="h-32 bg-white/5 rounded-xl"></div>
        </div>
      )}

      {data?.reviews?.length === 0 && (
        <div className="text-center py-12 text-neutral-500 border border-dashed border-white/10 rounded-xl">
          You haven't written any reviews yet.
        </div>
      )}

      <div className="space-y-6">
        {data?.reviews?.map((r: any) => (
          <div key={r.id} className="p-6 bg-white/5 rounded-xl border border-white/10 relative group">
            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/title/${r.media.id}`} className="p-2 text-neutral-400 hover:text-white" title="Edit on title page">
                <Edit2 className="w-4 h-4" />
              </Link>
              <button onClick={() => deleteReview(r.id)} className="p-2 text-neutral-400 hover:text-red-400" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <Link href={`/title/${r.media.id}`} className="flex items-start gap-4 hover:opacity-80 transition-opacity">
              <div className="w-16 h-24 bg-neutral-800 rounded shrink-0 overflow-hidden">
                {(r.media.posterPath || r.media.backdropPath) && (
                  <img src={r.media.posterPath || r.media.backdropPath} alt={r.media.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white mb-1">{r.media.title} <span className="text-sm font-normal text-neutral-500">({r.media.releaseYear})</span></h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-primary fill-primary' : 'text-neutral-700'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  {r.editedAt && <span className="text-[10px] uppercase tracking-wider text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded">Edited</span>}
                  {r.status === 'HIDDEN' && <span className="text-[10px] uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">Hidden by moderators</span>}
                </div>
                <p className="text-sm text-neutral-300 line-clamp-3">{r.containsSpoilers ? '[Spoiler review]' : r.body}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
