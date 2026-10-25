import { useState, useEffect } from 'react';

export interface BufferedRange {
  start: number; // percentage 0-100
  end: number;   // percentage 0-100
}

export interface SwarmStats {
  peers: number;
  seeders: number;
  leechers: number;
  downloadSpeed: string;
  uploadSpeed: string;
  bufferHealthSeconds: number;
  droppedFrames: number;
  resolution: string;
  audioCodec: string;
  downloadedPieces: BufferedRange[]; // Represents continuous byte chunks relative to total size
}


function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function useSwarmStats(infoHash: string | undefined, enabled: boolean) {
  const [stats, setStats] = useState<SwarmStats | null>(null);

  useEffect(() => {
    if (!infoHash || !enabled) {
      setStats(null);
      return;
    }

    // Connect to SSE stream
    const sse = new EventSource(`http://localhost:8080/api/v1/torrent/stats/${infoHash}`);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats({
          peers: data.peers || 0,
          seeders: data.seeders || 0,
          leechers: data.leechers || 0,
          downloadSpeed: formatBytes(data.downloadSpeed || 0),
          uploadSpeed: formatBytes(data.uploadSpeed || 0),
          bufferHealthSeconds: data.bufferHealthSeconds || 0,
          droppedFrames: data.droppedFrames || 0,
          resolution: data.resolution || 'Unknown',
          audioCodec: data.audioCodec || 'Unknown',
          downloadedPieces: data.downloadedPieces || [],
        });
      } catch (err) {
        console.error('Error parsing swarm stats SSE', err);
      }
    };

    sse.onerror = (err) => {
      console.error('Swarm Stats SSE Error:', err);
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [infoHash, enabled]);

  return stats;
}
