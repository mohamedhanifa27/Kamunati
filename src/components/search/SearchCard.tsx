'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchStore } from '../../store/searchStore';
import { Search as SearchIcon, X, Clock, Trash2, TrendingUp, History, ArrowRight } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAmbientFocus } from '../../features/ambient';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SearchCard() {
  const { isOpen, closeSearch } = useSearchStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 150);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { focus: ambientFocus, release: ambientRelease } = useAmbientFocus();

  // Close on esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  // Trap focus (naive implementation, just auto focus on open)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Manage browser history to close on back button
      window.history.pushState({ searchOpen: true }, '');
      const handlePop = () => {
        closeSearch();
      };
      window.addEventListener('popstate', handlePop);
      return () => window.removeEventListener('popstate', handlePop);
    }
  }, [isOpen, closeSearch]);

  // Local storage migration
  useEffect(() => {
    const migrated = localStorage.getItem('kamunati_search_migrated');
    if (!migrated) {
      const oldHistory = localStorage.getItem('search_history') || localStorage.getItem('recentSearches');
      if (oldHistory) {
        try {
          const parsed = JSON.parse(oldHistory);
          if (Array.isArray(parsed)) {
            Promise.all(parsed.map(q => 
              fetch('/api/search/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: typeof q === 'string' ? q : q.query })
              })
            )).then(() => {
              localStorage.removeItem('search_history');
              localStorage.removeItem('recentSearches');
            });
          }
        } catch(e) {}
      }
      localStorage.setItem('kamunati_search_migrated', 'true');
    }
  }, []);

  const { data: historyData, mutate: mutateHistory } = useSWR(isOpen && debouncedQuery.length === 0 ? '/api/search/history' : null, fetcher);
  const { data: trendingData } = useSWR(isOpen && debouncedQuery.length === 0 ? '/api/search/trending' : null, fetcher);
  const { data: searchResults, isLoading: searchLoading } = useSWR(debouncedQuery.length > 1 ? `/api/media/search?q=${encodeURIComponent(debouncedQuery)}` : null, fetcher);
  const { data: similarData } = useSWR(debouncedQuery.length > 1 ? `/api/search/similar?q=${encodeURIComponent(debouncedQuery)}` : null, fetcher);

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    
    // Save to history
    try {
      await fetch('/api/search/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed })
      });
      mutateHistory();
    } catch(e) {}
    
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const removeHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/search/history/${id}`, { method: 'DELETE' });
      mutateHistory();
    } catch(e) {}
  };

  const clearAllHistory = async () => {
    if (!confirm('Clear all search history?')) return;
    try {
      await fetch('/api/search/history', { method: 'DELETE' });
      mutateHistory();
    } catch(e) {}
  };

  const handleResultClick = async (mediaId: string, mediaTitle: string) => {
    try {
      await fetch('/api/search/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mediaTitle })
      });
    } catch(e) {}
    closeSearch();
    router.push(`/title/${mediaId}`);
  };

  if (!isOpen) return null;

  const history = historyData?.results || [];
  const trending = trendingData?.results || [];
  const results = searchResults?.results?.slice(0, 6) || [];
  const similar = similarData?.results || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
            onClick={closeSearch} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-0 bottom-0 md:bottom-auto md:top-24 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-2xl bg-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl z-[101] md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Input Header */}
            <div className="flex items-center p-4 border-b border-white/10 shrink-0">
              <SearchIcon className="w-5 h-5 text-neutral-400 ml-2" />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSubmit(query);
                }}
                placeholder="Search movies, series..."
                className="flex-1 bg-transparent border-none text-xl font-heading px-4 py-2 focus:outline-none text-white placeholder-neutral-500"
                role="combobox"
                aria-expanded="true"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-2 text-neutral-400 hover:text-white rounded-full">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-2">
              {debouncedQuery.length === 0 ? (
                // Empty state: History & Trending
                <div className="space-y-6 p-4">
                  {history.length > 0 ? (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                          <History className="w-4 h-4" /> Recent Searches
                        </h3>
                        <button onClick={clearAllHistory} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Clear All
                        </button>
                      </div>
                      <div className="space-y-1">
                        {history.slice(0, 8).map((h: any) => (
                          <div 
                            key={h.id} 
                            tabIndex={0}
                            onClick={() => { setQuery(h.query); handleSubmit(h.query); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setQuery(h.query);
                                handleSubmit(h.query);
                              } else if (e.key === 'Delete' && e.shiftKey) {
                                removeHistory(e as any, h.id);
                              }
                            }}
                            className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 focus:bg-white/10 cursor-pointer text-neutral-200 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-neutral-500" />
                              <span>{h.query}</span>
                            </div>
                            <button 
                              tabIndex={0}
                              onClick={(e) => removeHistory(e, h.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-all focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-white"
                              aria-label={`Remove ${h.query} from history`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="text-neutral-500 text-sm">No recent searches.</p>
                  )}

                  {trending.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4" /> Trending Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trending.map((t: any) => (
                          <button 
                            key={t.query} 
                            onClick={() => { setQuery(t.query); handleSubmit(t.query); }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm text-neutral-200 transition-colors"
                          >
                            {t.query}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                // Typing state: Similar & Results
                <div className="p-2 space-y-4">
                  {searchLoading && (
                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-b-2"></div></div>
                  )}

                  {!searchLoading && similar.length > 0 && (
                    <div className="px-2 pb-2 border-b border-white/5">
                      {similar.map((s: any) => (
                        <button 
                          key={s.query}
                          tabIndex={0}
                          onClick={() => handleSubmit(s.query)}
                          className="w-full text-left p-2 rounded-lg hover:bg-white/5 focus:bg-white/10 text-neutral-300 flex items-center gap-3 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                        >
                          <SearchIcon className="w-4 h-4 text-neutral-500" />
                          <span>{s.query}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchLoading && results.length > 0 && (
                    <div className="space-y-1">
                      <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 mt-4">Titles</h3>
                      {results.map((r: any) => {
                        let ambientPalette: any;
                        try {
                          if (typeof r.ambientPalette === 'string') ambientPalette = JSON.parse(r.ambientPalette);
                          else ambientPalette = r.ambientPalette;
                        } catch(e) {}
                        
                        return (
                          <div 
                            key={r.id} 
                            tabIndex={0}
                            onClick={() => handleResultClick(r.id, r.title)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleResultClick(r.id, r.title);
                            }}
                            onMouseEnter={() => {
                              if (ambientPalette) ambientFocus(ambientPalette);
                            }}
                            onMouseLeave={() => {
                              if (ambientPalette) ambientRelease(ambientPalette.id);
                            }}
                            className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 focus:bg-white/10 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <div className="w-12 h-16 bg-white/10 rounded overflow-hidden shrink-0">
                              {(r.posterPath || r.backdropPath) ? (
                                <img src={r.posterPath || r.backdropPath} alt={r.title} className="w-full h-full object-cover" />
                              ) : null}
                            </div>
                            <div>
                              <p className="font-medium text-white">{r.title}</p>
                              <p className="text-sm text-neutral-400">{r.releaseYear} • {r.category?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {!searchLoading && results.length === 0 && (
                    <div className="text-center py-12 text-neutral-400">
                      No titles found for "{debouncedQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {debouncedQuery.length > 1 && (
              <div 
                className="p-4 border-t border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => handleSubmit(debouncedQuery)}
              >
                <span className="font-medium text-primary">See all results for "{debouncedQuery}"</span>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            )}
            
            {debouncedQuery.length === 0 && (
              <div className="hidden md:flex p-3 border-t border-white/10 bg-black/20 text-xs text-neutral-500 justify-center gap-6">
                <span><kbd className="bg-white/10 px-1 rounded">↵</kbd> to search</span>
                <span><kbd className="bg-white/10 px-1 rounded">esc</kbd> to close</span>
                <span><kbd className="bg-white/10 px-1 rounded">Shift</kbd> + <kbd className="bg-white/10 px-1 rounded">Del</kbd> to remove</span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
