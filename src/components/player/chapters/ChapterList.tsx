"use client";

import React from 'react';
import { Bookmark } from 'lucide-react';

export interface ChapterItem {
  id: number | string;
  title: string;
  start: number;
  end: number;
}

interface ChapterMarkersProps {
  chapters: ChapterItem[];
  duration: number;
}

function formatChapterTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function ChapterMarkers({ chapters, duration }: ChapterMarkersProps) {
  if (!chapters || chapters.length === 0 || !duration || duration <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {chapters.map((ch, idx) => {
        if (ch.start <= 0 || ch.start >= duration) return null;
        const leftPercent = (ch.start / duration) * 100;
        return (
          <div
            key={`marker-${idx}`}
            className="absolute top-0 bottom-0 w-[2px] bg-white/40 hover:bg-[#8B5CF6] transition-colors"
            style={{ left: `${leftPercent}%` }}
            title={`${ch.title} (${formatChapterTime(ch.start)})`}
          />
        );
      })}
    </div>
  );
}

interface ChapterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  currentTime: number;
  onSelectChapter: (startSec: number) => void;
}

export function ChapterMenu({
  isOpen,
  onClose,
  chapters,
  currentTime,
  onSelectChapter
}: ChapterMenuProps) {
  if (!isOpen || !chapters || chapters.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-6 z-40 w-72 max-h-80 bg-black/95 border border-[#8B5CF6]/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col font-sans animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#8B5CF6]/20 bg-[#121118]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8B5CF6] font-pixel uppercase tracking-wider">
          <Bookmark className="w-3.5 h-3.5" /> Chapters ({chapters.length})
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-neutral-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.map((ch, idx) => {
          const isCurrent = currentTime >= ch.start && (idx === chapters.length - 1 || currentTime < chapters[idx + 1].start);
          return (
            <button
              key={`ch-btn-${idx}`}
              onClick={() => {
                onSelectChapter(ch.start);
                onClose();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                isCurrent
                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] font-semibold border border-[#8B5CF6]/30'
                  : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <span className="truncate pr-2">{ch.title}</span>
              <span className="font-mono text-[10px] text-neutral-500 shrink-0">{formatChapterTime(ch.start)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
