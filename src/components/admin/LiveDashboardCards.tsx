'use client';

import React, { useState, useEffect } from 'react';
import { featureFlags } from '@/lib/featureFlags';

interface MetricsData {
  totalTitles: number;
  published: number;
  pendingTorrents: number;
  activeUsers: number;
}

export default function LiveDashboardCards({ initialData }: { initialData: MetricsData }) {
  const [data, setData] = useState<MetricsData>(initialData);
  const [status, setStatus] = useState<'connected' | 'reconnecting'>('connected');
  const [lastSeq, setLastSeq] = useState(0);

  useEffect(() => {
    if (!featureFlags.adminRealtime || !featureFlags.adminLiveCards) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      setStatus('reconnecting');
      eventSource = new EventSource('/api/admin/metrics/live');
      
      eventSource.onopen = () => {
        setStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // If we missed a sequence (except initialization), we should ideally request a full snapshot, 
          // but our SSE endpoint sends the full state as delta anyway to ensure integrity (no extrapolation).
          if (parsed.seq > lastSeq) {
            setData(parsed.data);
            setLastSeq(parsed.seq);
          }
        } catch (err) {}
      };

      eventSource.onerror = () => {
        setStatus('reconnecting');
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const kpis = [
    { label: 'Total Titles', value: data.totalTitles, color: 'text-primary' },
    { label: 'Published', value: data.published, color: 'text-green-400' },
    { label: 'Pending Torrents', value: data.pendingTorrents, color: 'text-yellow-400' },
    { label: 'Active Users', value: data.activeUsers, color: 'text-blue-400' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative">
      {status === 'reconnecting' && (
        <div className="absolute -top-6 right-0 text-xs text-yellow-500 font-bold animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          Reconnecting... (Stale Data)
        </div>
      )}
      {kpis.map(kpi => (
        <div key={kpi.label} className={`bg-black/40 border ${status === 'reconnecting' ? 'border-yellow-500/20 opacity-70' : 'border-white/10'} rounded-xl p-6 shadow-md flex flex-col justify-center transition-all`}>
          <h3 className="text-white/50 font-medium text-sm mb-2">{kpi.label}</h3>
          <span className={`text-4xl font-heading font-bold ${kpi.color}`}>{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}
