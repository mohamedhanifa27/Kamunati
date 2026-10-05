'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Activity, Users, ArrowUp, ArrowDown, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface TorrentHealth {
  id: string;
  infoHash: string;
  title: string;
  resolution: string;
  mediaTitle: string | null;
  tmdbId: number | null;
  mediaId: string | null;
  seeders: number;
  leechers: number;
  lastCheckedAt: string | null;
  viewers: number;
}

interface HealthHistory {
  [torrentId: string]: { timestamp: number; seeders: number; leechers: number; viewers: number }[];
}

function MiniGraph({ data, dataKey, color }: { data: { timestamp: number; [key: string]: number }[]; dataKey: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const values = data.map(d => d[dataKey] as number);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < values.length; i++) {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((values[i] - min) / range) * (h * 0.85);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((values[i] - min) / range) * (h * 0.85);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latest dot
    if (values.length > 0) {
      const lastX = w;
      const lastY = h - ((values[values.length - 1] - min) / range) * (h * 0.85);
      ctx.beginPath();
      ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [data, dataKey, color]);

  if (data.length < 2) {
    return <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">Collecting...</div>;
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export default function TorrentHealthDashboard() {
  const [torrents, setTorrents] = useState<TorrentHealth[]>([]);
  const [history, setHistory] = useState<HealthHistory>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'connected' | 'reconnecting'>('reconnecting');
  const [lastSeq, setLastSeq] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const MAX_HISTORY = 60; // Keep last 60 data points (5 min at 5s intervals)

  const updateHistory = useCallback((newData: TorrentHealth[]) => {
    const now = Date.now();
    setHistory(prev => {
      const next = { ...prev };
      for (const t of newData) {
        const existing = next[t.id] || [];
        const point = { timestamp: now, seeders: t.seeders, leechers: t.leechers, viewers: t.viewers };
        next[t.id] = [...existing.slice(-MAX_HISTORY + 1), point];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      setStatus('reconnecting');
      const es = new EventSource('/api/admin/torrents/health/live');
      eventSourceRef.current = es;

      es.onopen = () => setStatus('connected');

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.seq > lastSeq) {
            setTorrents(parsed.data);
            updateHistory(parsed.data);
            setLastSeq(parsed.seq);
          }
        } catch (err) {}
      };

      es.onerror = () => {
        setStatus('reconnecting');
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  // Client-side filter (the search box is for immediate filtering of already-loaded data)
  const filtered = torrents.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    // Check if it's a TMDB ID search
    if (/^\d+$/.test(search) && t.tmdbId !== null) {
      return t.tmdbId.toString().includes(search);
    }
    return (
      t.title.toLowerCase().includes(q) ||
      (t.mediaTitle?.toLowerCase().includes(q) ?? false) ||
      t.infoHash.toLowerCase().includes(q)
    );
  });

  const totalSeeders = filtered.reduce((sum, t) => sum + t.seeders, 0);
  const totalLeechers = filtered.reduce((sum, t) => sum + t.leechers, 0);
  const totalViewers = filtered.reduce((sum, t) => sum + t.viewers, 0);

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-white/40 mb-1">Total Torrents</div>
          <div className="text-2xl font-bold text-white">{filtered.length}</div>
        </div>
        <div className="bg-black/40 border border-green-500/20 rounded-xl p-4">
          <div className="text-xs text-green-400/60 mb-1 flex items-center gap-1"><ArrowUp size={12} /> Seeders</div>
          <div className="text-2xl font-bold text-green-400">{totalSeeders}</div>
        </div>
        <div className="bg-black/40 border border-orange-500/20 rounded-xl p-4">
          <div className="text-xs text-orange-400/60 mb-1 flex items-center gap-1"><ArrowDown size={12} /> Leechers</div>
          <div className="text-2xl font-bold text-orange-400">{totalLeechers}</div>
        </div>
        <div className="bg-black/40 border border-blue-500/20 rounded-xl p-4">
          <div className="text-xs text-blue-400/60 mb-1 flex items-center gap-1"><Users size={12} /> App Viewers</div>
          <div className="text-2xl font-bold text-blue-400">{totalViewers}</div>
        </div>
      </div>

      {/* Search + Status */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, TMDB ID, or info hash..."
            className="w-full bg-black/60 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
          />
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${status === 'connected' ? 'border-green-500/20 text-green-400 bg-green-500/10' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/10 animate-pulse'}`}>
          {status === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
          {status === 'connected' ? 'Live' : 'Reconnecting...'}
        </div>
      </div>

      {/* Torrent rows */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30 border border-white/10 border-dashed rounded-xl">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {torrents.length === 0 ? 'Waiting for torrent data...' : 'No torrents match your search.'}
          </div>
        )}

        {filtered.map(torrent => {
          const healthScore = torrent.seeders > 5 ? 'healthy' : torrent.seeders > 0 ? 'weak' : 'dead';
          const healthColor = healthScore === 'healthy' ? 'border-green-500/30' : healthScore === 'weak' ? 'border-yellow-500/30' : 'border-red-500/30';
          const healthDot = healthScore === 'healthy' ? 'bg-green-500' : healthScore === 'weak' ? 'bg-yellow-500' : 'bg-red-500';
          const torrentHistory = history[torrent.id] || [];

          return (
            <div key={torrent.id} className={`bg-black/30 border ${healthColor} rounded-xl p-4 md:p-5 transition-all hover:bg-black/50`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${healthDot} ${healthScore === 'healthy' ? 'animate-pulse' : ''}`} />
                    <h3 className="text-white font-semibold truncate">{torrent.mediaTitle || torrent.title}</h3>
                    <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded border border-white/10 uppercase">{torrent.resolution}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="font-mono truncate">{torrent.infoHash.slice(0, 16)}...</span>
                    {torrent.tmdbId && <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">TMDB {torrent.tmdbId}</span>}
                    {torrent.lastCheckedAt && <span>Checked {new Date(torrent.lastCheckedAt).toLocaleTimeString()}</span>}
                  </div>
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg min-w-[70px]">
                    <div className="text-lg font-bold text-green-400">{torrent.seeders}</div>
                    <div className="text-[10px] text-green-400/60 uppercase tracking-wider">Seeders</div>
                  </div>
                  <div className="text-center px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg min-w-[70px]">
                    <div className="text-lg font-bold text-orange-400">{torrent.leechers}</div>
                    <div className="text-[10px] text-orange-400/60 uppercase tracking-wider">Leechers</div>
                  </div>
                  <div className="text-center px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg min-w-[70px]">
                    <div className="text-lg font-bold text-blue-400">{torrent.viewers}</div>
                    <div className="text-[10px] text-blue-400/60 uppercase tracking-wider">Viewers</div>
                  </div>
                </div>

                {/* Mini graph */}
                <div className="w-full lg:w-48 h-16 shrink-0">
                  <MiniGraph data={torrentHistory} dataKey="seeders" color="#22c55e" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
