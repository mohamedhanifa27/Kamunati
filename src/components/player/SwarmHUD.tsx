import React from 'react';
import { SwarmStats } from '../../hooks/useSwarmStats';
import { Activity, Network, HardDrive, Cpu, Radio } from 'lucide-react';

interface SwarmHUDProps {
  stats: SwarmStats | null;
  visible: boolean;
}

export default function SwarmHUD({ stats, visible }: SwarmHUDProps) {
  if (!visible) return null;

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 w-72 text-white font-mono text-xs shadow-2xl z-50 pointer-events-none">
      <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          Stats for Geeks
        </h3>
        <div className="flex items-center gap-1 text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-white/50 block flex items-center gap-1"><Network size={12}/> Swarm</span>
            <span className="font-semibold">{stats?.peers || 0} Peers</span>
          </div>
          <div>
            <span className="text-white/50 block">Seed / Leech</span>
            <span className="font-semibold text-green-400">{stats?.seeders || 0}</span> / <span className="font-semibold text-red-400">{stats?.leechers || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded">
          <div>
            <span className="text-white/50 block">Down</span>
            <span className="font-semibold text-blue-400">{stats?.downloadSpeed || '0 B/s'}</span>
          </div>
          <div>
            <span className="text-white/50 block">Up</span>
            <span className="font-semibold text-purple-400">{stats?.uploadSpeed || '0 B/s'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-white/50 block flex items-center gap-1"><HardDrive size={12}/> Buffer Health</span>
            <span className="font-semibold">{stats?.bufferHealthSeconds || 0} sec</span>
          </div>
          <div>
            <span className="text-white/50 block">Dropped</span>
            <span className="font-semibold">{stats?.droppedFrames || 0}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
          <div>
            <span className="text-white/50 block flex items-center gap-1"><Cpu size={12}/> Codec</span>
            <span className="font-semibold">{stats?.audioCodec || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-white/50 block flex items-center gap-1"><Radio size={12}/> Res</span>
            <span className="font-semibold">{stats?.resolution || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
