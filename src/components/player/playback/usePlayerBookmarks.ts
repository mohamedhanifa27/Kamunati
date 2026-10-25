// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
"use client";

import { useState, useEffect, useCallback } from 'react';

export interface PlayerBookmark {
  id: string;
  timeSec: number;
  formattedTime: string;
  name: string;
  createdAt: number;
}

export function formatBookmarkTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function usePlayerBookmarks(mediaId: string) {
  const storageKey = `kamunati_bookmarks_${mediaId}`;
  const [bookmarks, setBookmarks] = useState<PlayerBookmark[]>([]);

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !mediaId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setBookmarks(JSON.parse(raw));
      }
    } catch {}
  }, [mediaId, storageKey]);

  // Save to localStorage
  const saveBookmarks = useCallback((list: PlayerBookmark[]) => {
    setBookmarks(list);
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {}
  }, [storageKey]);

  // Add bookmark at currentTime
  const addBookmark = useCallback((timeSec: number, name?: string): PlayerBookmark => {
    const formatted = formatBookmarkTime(timeSec);
    const newBm: PlayerBookmark = {
      id: `bm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timeSec: Math.round(timeSec * 10) / 10,
      formattedTime: formatted,
      name: name || `Bookmark @ ${formatted}`,
      createdAt: Date.now()
    };
    saveBookmarks([...bookmarks, newBm].sort((a, b) => a.timeSec - b.timeSec));
    return newBm;
  }, [bookmarks, saveBookmarks]);

  // Remove bookmark
  const removeBookmark = useCallback((id: string) => {
    saveBookmarks(bookmarks.filter(b => b.id !== id));
  }, [bookmarks, saveBookmarks]);

  // Clear all bookmarks
  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    clearBookmarks
  };
}
