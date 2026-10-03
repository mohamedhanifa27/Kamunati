'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { featureFlags } from '../../lib/featureFlags';
import { Star, MoreVertical, Flag, Edit2, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ReviewsSection({ mediaId }: { mediaId: string }) {
  if (!featureFlags.reviews) return null;

  const [sort, setSort] = useState('newest');
  const [filterStars, setFilterStars] = useState(0);
  const [hideSpoilers, setHideSpoilers] = useState(true);
  
  const query = new URLSearchParams({ sort, stars: filterStars.toString() }).toString();
  const { data, mutate } = useSWR(`/api/titles/${mediaId}/reviews?${query}`, fetcher);
  
  const [writing, setWriting] = useState(false);
  const [body, setBody] = useState('');
  const [stars, setStars] = useState(0);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`/api/titles/${mediaId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, stars, isSpoiler })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit review');
      }
      setWriting(false);
      setBody('');
      setStars(0);
      setIsSpoiler(false);
      mutate();
    } catch(err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete your review?')) return;
    try {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      mutate();
    } catch(e) {}
  };

  return (
    <div className="py-12 border-t border-white/10 mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-heading font-bold">Reviews</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Summary sidebar */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            <div className="text-5xl font-bold font-heading text-white mb-2">
              {data?.summary?.avg ? data.summary.avg.toFixed(1) : '—'}
            </div>
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= (data?.summary?.avg || 0) ? 'text-primary fill-primary' : 'text-neutral-600'}`} />
              ))}
            </div>
            <p className="text-sm text-neutral-400 mb-6">{data?.summary?.count || 0} reviews</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const pct = data?.distribution ? (data.distribution[stars] || 0) / (data.summary?.count || 1) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-2 font-medium text-neutral-400">{stars}</span>
                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {!data?.userReview && !data?.restricted && (
            <button 
              onClick={() => setWriting(true)}
              className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Write a Review
            </button>
          )}

          {data?.restricted && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200">
              <p className="font-semibold mb-1">You can't post reviews right now.</p>
              <p>{data.restricted.reason}</p>
              {data.restricted.expiresAt && <p className="mt-1 opacity-70">Until {new Date(data.restricted.expiresAt).toLocaleDateString()}</p>}
            </div>
          )}
        </div>

        {/* Main List */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {writing && (
            <form onSubmit={submitReview} className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
              <h3 className="font-bold text-lg mb-4">Write your review</h3>
              {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Rating</label>
                <div className="flex gap-1" role="radiogroup">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setStars(s)}
                      className="p-1 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                      role="radio"
                      aria-checked={stars === s}
                    >
                      <Star className={`w-8 h-8 ${stars >= s ? 'text-primary fill-primary' : 'text-neutral-600 hover:text-neutral-400'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-neutral-400 mb-2">
                  <label htmlFor="body">Review text</label>
                  <span>{body.length}/1500</span>
                </div>
                <textarea 
                  id="body"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px]"
                  placeholder="What did you think?"
                  maxLength={1500}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} className="rounded bg-black/50 border-white/20 text-primary focus:ring-primary" />
                  <span className="text-sm text-neutral-300">Contains spoilers</span>
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setWriting(false)} className="px-4 py-2 text-sm font-medium hover:text-white text-neutral-400">Cancel</button>
                  <button type="submit" disabled={submitting || body.length < 10 || stars === 0} className="px-6 py-2 bg-primary text-text-on-primary rounded-lg font-medium disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {data?.userReview && !writing && (
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 mb-8 relative group">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {
                  setBody(data.userReview.body);
                  setStars(data.userReview.rating);
                  setIsSpoiler(data.userReview.containsSpoilers);
                  setWriting(true);
                  // We'd actually want to PUT instead of POST here, but for simplicity of UI we can just show edit modal
                }} className="p-2 text-neutral-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteReview(data.userReview.id)} className="p-2 text-neutral-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary">Your Review</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= data.userReview.rating ? 'text-primary fill-primary' : 'text-neutral-700'}`} />
                  ))}
                </div>
                <span className="text-xs text-neutral-500">{new Date(data.userReview.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-neutral-200 whitespace-pre-wrap">{data.userReview.body}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4 text-sm">
              <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent text-white border-none focus:ring-0 cursor-pointer">
                <option value="newest" className="bg-neutral-900">Newest</option>
                <option value="top" className="bg-neutral-900">Top rated</option>
                <option value="lowest" className="bg-neutral-900">Lowest rated</option>
              </select>
              <select value={filterStars} onChange={e => setFilterStars(Number(e.target.value))} className="bg-transparent text-white border-none focus:ring-0 cursor-pointer">
                <option value={0} className="bg-neutral-900">All stars</option>
                <option value={5} className="bg-neutral-900">5 stars</option>
                <option value={4} className="bg-neutral-900">4 stars</option>
                <option value={3} className="bg-neutral-900">3 stars</option>
                <option value={2} className="bg-neutral-900">2 stars</option>
                <option value={1} className="bg-neutral-900">1 star</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
              <input type="checkbox" checked={hideSpoilers} onChange={e => setHideSpoilers(e.target.checked)} className="rounded bg-black/50 border-white/20 text-primary focus:ring-primary" />
              Hide spoilers
            </label>
          </div>

          <div className="space-y-6">
            {!data && <div className="animate-pulse flex flex-col gap-6"><div className="h-32 bg-white/5 rounded-xl"></div></div>}
            
            {data?.reviews?.length === 0 && !data?.userReview && (
              <div className="text-center py-12 text-neutral-500">
                Be the first to review this title.
              </div>
            )}

            {data?.reviews?.map((r: any) => (
              <div key={r.id} className="p-6 bg-white/5 rounded-xl border border-white/5 relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 overflow-hidden">
                      {r.user?.avatarUrl ? <img src={r.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : r.user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{r.user?.displayName || r.user?.username || 'Unknown'}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-primary fill-primary' : 'text-neutral-700'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                        {r.editedAt && <span className="text-[10px] uppercase tracking-wider text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded">Edited</span>}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-white" title="Report">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                {r.containsSpoilers && hideSpoilers ? (
                  <div className="bg-black/40 border border-white/5 rounded p-4 text-center">
                    <p className="text-sm text-neutral-400 mb-2">This review contains spoilers</p>
                    <button className="text-primary text-sm font-medium hover:underline">Show spoiler review</button>
                  </div>
                ) : (
                  <p className="text-neutral-200 whitespace-pre-wrap">{r.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
