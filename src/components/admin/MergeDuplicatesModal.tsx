'use client';

import React, { useState, useEffect } from 'react';
import { GitMerge, Loader2, CheckCircle2, Film, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../ui/NotificationProvider';
import { DuplicateGroup } from '@/lib/mediaMerge';

export default function MergeDuplicatesModal() {
  const { notify } = useNotification();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergingKey, setMergingKey] = useState<string | null>(null);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/media/merge-by-tmdb');
      if (!res.ok) throw new Error('Failed to scan for duplicates');
      const data = await res.json();
      setGroups(data.duplicateGroups || []);
      setTotalCount(data.totalDuplicateCount || 0);
    } catch (err: any) {
      console.error('fetchDuplicates error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleMergeAll = async () => {
    setIsMerging(true);
    try {
      const res = await fetch('/api/admin/media/merge-by-tmdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoScan: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to merge duplicates');

      notify(
        'Success',
        `Merged ${data.mergedCount || 0} duplicate titles! Consolidated ${data.movedTorrentsCount || 0} torrents.`,
        'success'
      );
      await fetchDuplicates();
      router.refresh();
      if ((data.mergedCount || 0) > 0) {
        setIsOpen(false);
      }
    } catch (err: any) {
      notify('Notification', '❌ ' + err.message, 'default');
    } finally {
      setIsMerging(false);
    }
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    setMergingKey(group.key);
    try {
      let mergedCount = 0;
      let torrentsCount = 0;
      for (const dup of group.duplicates) {
        const res = await fetch('/api/admin/media/merge-by-tmdb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: dup.id, targetId: group.primary.id })
        });
        const data = await res.json();
        if (data.success) {
          mergedCount++;
          torrentsCount += (data.result?.movedTorrentsCount || 0);
        }
      }

      notify(
        'Success',
        `Merged into "${group.primary.title}"! Combined ${torrentsCount} torrents.`,
        'success'
      );
      await fetchDuplicates();
      router.refresh();
    } catch (err: any) {
      notify('Notification', '❌ ' + err.message, 'default');
    } finally {
      setMergingKey(null);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          fetchDuplicates();
        }}
        className="relative bg-white/5 hover:bg-white/10 text-white border border-white/15 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all hover:border-white/30"
        title="Find and merge media sharing the same TMDB ID or title"
      >
        <GitMerge size={17} className="text-primary" />
        <span>Merge Duplicates</span>
        {totalCount > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full animate-pulse">
            {totalCount}
          </span>
        )}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121118] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  <GitMerge className="text-primary" size={20} />
                  <span>Merge Duplicate Media & Torrents</span>
                </h3>
                <p className="text-sm text-white/50 mt-1">
                  Consolidate titles sharing the same TMDB ID or title so all resolutions & qualities merge into a single entry.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-white/50 gap-3">
                  <Loader2 size={28} className="animate-spin text-primary" />
                  <p className="text-sm">Scanning catalog for duplicate TMDB IDs and titles...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-white/60">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
                    <CheckCircle2 size={24} className="text-green-400" />
                  </div>
                  <h4 className="text-base font-semibold text-white">No duplicates found!</h4>
                  <p className="text-sm text-white/40 max-w-sm mt-1">
                    Every title in your library has a unique TMDB ID. All torrents are properly consolidated.
                  </p>
                  <button
                    onClick={fetchDuplicates}
                    className="mt-4 text-xs text-primary hover:underline"
                  >
                    Run scan again
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/50 pb-2 border-b border-white/5">
                    <span>Detected {groups.length} duplicate groups ({totalCount} redundant entries)</span>
                    <button
                      onClick={fetchDuplicates}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Refresh
                    </button>
                  </div>

                  {groups.map((group) => {
                    const isGroupMerging = mergingKey === group.key || isMerging;
                    return (
                      <div
                        key={group.key}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                            {group.key}
                          </span>
                          <button
                            onClick={() => handleMergeGroup(group)}
                            disabled={isGroupMerging}
                            className="text-xs bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            {mergingKey === group.key ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <GitMerge size={12} />
                            )}
                            Merge Group
                          </button>
                        </div>

                        {/* Primary Target */}
                        <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-lg border border-white/5">
                          {group.primary.posterPath ? (
                            <img
                              src={group.primary.posterPath}
                              alt={group.primary.title}
                              className="w-10 h-14 object-cover rounded border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center shrink-0">
                              <Film size={18} className="text-white/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-green-500/20 text-green-400 font-semibold px-1.5 py-0.5 rounded border border-green-500/30">
                                Primary Keeper
                              </span>
                              <span className="text-sm font-semibold text-white truncate block">
                                {group.primary.title}
                              </span>
                            </div>
                            <span className="text-xs text-white/40 block mt-0.5">
                              {group.primary.releaseYear || 'Unknown Year'} • {group.primary.torrentCount} torrent(s)
                            </span>
                          </div>
                        </div>

                        {/* Duplicates to merge into primary */}
                        <div className="pl-4 border-l-2 border-primary/30 space-y-2">
                          <div className="text-[11px] font-medium text-white/40 flex items-center gap-1">
                            <ArrowRight size={12} className="text-primary" />
                            <span>Torrents from these entries will merge into Primary:</span>
                          </div>
                          {group.duplicates.map((dup) => (
                            <div
                              key={dup.id}
                              className="flex items-center justify-between text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/5"
                            >
                              <div className="truncate min-w-0 flex-1 pr-2">
                                <span className="text-white/80 font-medium block truncate">
                                  {dup.title}
                                </span>
                                <span className="text-white/40 text-[10px]">
                                  {dup.torrentCount} torrent(s) will be transferred
                                </span>
                              </div>
                              <span className="text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 shrink-0">
                                Will be removed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Close
              </button>
              {groups.length > 0 && (
                <button
                  onClick={handleMergeAll}
                  disabled={isMerging}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(80,26,150,0.4)]"
                >
                  {isMerging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <GitMerge size={16} />
                  )}
                  <span>Merge All ({totalCount} Duplicates)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
