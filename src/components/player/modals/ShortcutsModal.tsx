// [RECTIFICATION:VLC_PLAYER_FUNCTIONALITIES]
"use client";

import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  items: { key: string; label: string }[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    title: 'Playback & Jumps (VLC)',
    items: [
      { key: 'Space / K', label: 'Play / Pause' },
      { key: 'Shift + ← / →', label: 'Very short jump (3s)' },
      { key: '← / →', label: 'Short jump (10s)' },
      { key: 'Ctrl + ← / →', label: 'Medium jump (1 min)' },
      { key: 'Ctrl + Alt + ← / →', label: 'Long jump (5 min)' },
      { key: '[ / ]', label: 'Decrease / Increase Speed (±0.1x)' },
      { key: '=', label: 'Normal Speed (1.0x)' },
      { key: 'F', label: 'Toggle Fullscreen' },
      { key: 'M', label: 'Toggle Mute' },
      { key: '↑ / ↓', label: 'Volume up / down' }
    ]
  },
  {
    title: 'Audio & Equalizer (VLC)',
    items: [
      { key: 'C / Ctrl + E', label: 'Adjustments & 10-Band EQ Dialog' },
      { key: 'Shift + G / H', label: 'Audio Delay (-50ms / +50ms)' },
      { key: 'Shift + J / K', label: 'Audio Delay (-50ms / +50ms)' },
      { key: 'B', label: 'Cycle Audio Tracks' }
    ]
  },
  {
    title: 'Video, Geometry & Snapshot',
    items: [
      { key: 'Shift + S', label: 'Take Video Snapshot (PNG)' },
      { key: 'A', label: 'Cycle Aspect Ratio (16:9, 4:3, Fill...)' },
      { key: 'Z', label: 'Cycle Zoom Level (1x, 1.25x, 1.5x, 2x)' },
      { key: 'E', label: 'Step one frame forward' },
      { key: 'Shift + E', label: 'Step one frame backward' }
    ]
  },
  {
    title: 'Subtitles & Bookmarks',
    items: [
      { key: 'G / H', label: 'Subtitle Delay (-50ms / +50ms)' },
      { key: 'V', label: 'Cycle Subtitle Tracks' },
      { key: 'R', label: 'Toggle A-B Repeat Loop (A → B → Clear)' },
      { key: 'Shift + B', label: 'Add Bookmark at Current Time' },
      { key: 'Ctrl + J', label: 'Media Information Panel' },
      { key: '?', label: 'Open Keyboard Shortcuts Help' }
    ]
  }
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c0c0e] border border-[#8B5CF6]/40 rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#8B5CF6]/20 bg-[#121118]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B5CF6]/15 rounded-lg text-[#8B5CF6]">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-pixel uppercase tracking-wider">
                VLC Keyboard Shortcuts <span className="text-xs text-[#8B5CF6] normal-case ml-2 font-mono">(?)</span>
              </h2>
              <p className="text-xs text-neutral-400">Complete suite of VLC media player keyboard controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map(cat => (
            <div key={cat.title} className="space-y-2.5">
              <h3 className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-wider font-pixel">
                {cat.title}
              </h3>
              <div className="space-y-1.5 font-mono text-[11px]">
                {cat.items.map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded bg-neutral-900/60 border border-neutral-800/60"
                  >
                    <span className="text-neutral-300 font-sans">{item.label}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-black/80 border border-neutral-700 text-[#8B5CF6] font-semibold text-[10px]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-[#8B5CF6]/20 bg-[#121118]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-lg font-pixel text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
