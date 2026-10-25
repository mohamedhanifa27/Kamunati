"use client";

import React, { useMemo } from 'react';
import { Users, Download, Loader2 } from 'lucide-react';

interface BufferRange {
  start: number;
  end: number;
}

interface BufferVisualizerProps {
  buffered: TimeRanges | null;
  duration: number;
}

export function MultiRangeBufferedBar({ buffered, duration }: BufferVisualizerProps) {
  const ranges = useMemo<BufferRange[]>(() => {
    if (!buffered || duration <= 0) return [];
    const list: BufferRange[] = [];
    for (let i = 0; i < buffered.length; i++) {
      list.push({
        start: buffered.start(i),
        end: buffered.end(i)
      });
    }
    return list;
  }, [buffered, duration]);

  if (ranges.length === 0 || duration <= 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none rounded overflow-hidden">
      {ranges.map((r, idx) => {
        const leftPercent = Math.max(0, (r.start / duration) * 100);
        const widthPercent = Math.min(100 - leftPercent, ((r.end - r.start) / duration) * 100);
        return (
          <div
            key={`buff-${idx}`}
            className="absolute top-0 bottom-0 bg-[#8B5CF6]/35"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`
            }}
          />
        );
      })}
    </div>
  );
}

interface SwarmTelemetryProps {
  peers?: number;
  downloadSpeed?: number; // bytes/sec
  isBuffering?: boolean;
}

function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

export function SwarmTelemetryBadge({ peers = 0, downloadSpeed = 0, isBuffering = false }: SwarmTelemetryProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-black/60 border border-neutral-800 text-[10px] font-mono text-neutral-400 select-none">
      {isBuffering && (
        <span className="flex items-center gap-1 text-[#8B5CF6] animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Waiting for pieces...</span>
        </span>
      )}
      <span className="flex items-center gap-1" title="Connected Swarm Peers">
        <Users className="w-3 h-3 text-[#8B5CF6]" />
        <span>{peers}</span>
      </span>
      <span className="flex items-center gap-1" title="Torrent Download Speed">
        <Download className="w-3 h-3 text-neutral-400" />
        <span>{formatSpeed(downloadSpeed)}</span>
      </span>
    </div>
  );
}
