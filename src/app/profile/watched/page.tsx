'use client';

import React from 'react';
import useSWR from 'swr';
import { Link } from 'next-view-transitions';
import { X, ArrowLeft } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WatchedListPage() {
  const { data: watched, mutate } = useSWR('/api/history/watched/list', fetcher);
  
  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/history/watched/list?id=${id}`, { method: 'DELETE' });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  if (!watched) {
    return <div className="min-h-screen pt-32 px-8 flex justify-center text-neutral-500 animate-pulse">Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 md:px-16 relative z-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-heading font-bold">Watched List</h1>
      </div>

      {watched.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-neutral-400 mb-2">You haven't finished watching anything yet.</p>
          <Link href="/" className="text-primary hover:underline text-sm font-medium">Browse titles</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {watched.map((item: any) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden bg-neutral-900 border border-white/10 aspect-[2/3]">
              <img src={item.media?.posterPath || '/logo_vector.svg'} alt={item.media?.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full backdrop-blur-md transition-colors"
                  aria-label="Remove from watched list"
                >
                  <X size={16} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <p className="font-bold text-sm truncate">{item.media?.title}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Watched {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
