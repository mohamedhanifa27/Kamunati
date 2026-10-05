import React from 'react';
import TorrentHealthDashboard from '../../../components/admin/TorrentHealthDashboard';

export default function AdminTorrentsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white font-heading">Torrent Health</h1>
        <p className="text-white/40 text-sm mt-1">Live swarm peers and in-app viewers for every torrent. Search by name or TMDB ID.</p>
      </div>

      <TorrentHealthDashboard />
    </div>
  );
}
