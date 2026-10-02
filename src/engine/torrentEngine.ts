import torrentStream from 'torrent-stream';
import { EngineInstance, MediaFile, SwarmStats, TorrentMetadata } from '../types/torrent';

const engines = new Map<string, EngineInstance>();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.webm'];

export function getEngine(infoHashOrMagnet: string): Promise<EngineInstance> {
  return new Promise((resolve, reject) => {
    let infoHash = infoHashOrMagnet;
    if (infoHashOrMagnet.startsWith('magnet:')) {
      const match = infoHashOrMagnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        infoHash = match[1].toLowerCase();
      }
    }

    if (engines.has(infoHash)) {
      const engineInstance = engines.get(infoHash)!;
      engineInstance.resetIdleTimer();
      return resolve(engineInstance);
    }

    const engine = torrentStream(infoHashOrMagnet, {
      connections: 100,
      uploads: 10,
      tmp: './tmp',
      trackers: [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
      ]
    });

    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        engine.destroy(() => {
          engines.delete(infoHash);
          console.log(`Engine ${infoHash} destroyed due to inactivity.`);
        });
      }, IDLE_TIMEOUT_MS);
    };

    engine.on('ready', () => {
      const files: MediaFile[] = engine.files.map((f: any) => ({
        name: f.name,
        path: f.path,
        length: f.length,
        offset: f.offset,
        createReadStream: (opts?: { start: number; end: number }) => f.createReadStream(opts)
      }));

      // Prioritize first and last pieces
      const pieceLength = engine.torrent.pieceLength;
      engine.select(0, 1, false);
      const totalPieces = Math.ceil(engine.torrent.length / pieceLength);
      if (totalPieces > 1) {
        engine.select(totalPieces - 1, totalPieces, false);
      }

      resetIdleTimer();

      const instance: EngineInstance = {
        infoHash,
        files,
        get stats(): SwarmStats {
          const downloaded = engine.swarm.downloaded;
          const total = engine.torrent.length || 1;
          return {
            peers: engine.swarm.wires.length,
            activeSeeders: engine.swarm.wires.filter((w: any) => !w.peerChoking).length,
            activeLeechers: engine.swarm.wires.filter((w: any) => w.peerChoking).length,
            downloadSpeed: engine.swarm.downloadSpeed(),
            uploadSpeed: engine.swarm.uploadSpeed(),
            downloaded,
            uploaded: engine.swarm.uploaded,
            percentVerified: (engine.torrent.pieces ? engine.torrent.pieces.filter((p: any) => p).length / engine.torrent.pieces.length : 0) * 100
          };
        },
        destroy(callback) {
          clearTimeout(idleTimer);
          engine.destroy(callback);
          engines.delete(infoHash);
        },
        setStreamPosition(byteOffset: number, file: MediaFile) {
          resetIdleTimer();
          const fileStartPiece = Math.floor(file.offset / pieceLength);
          const currentPieceOffset = Math.floor(byteOffset / pieceLength);
          const targetPiece = fileStartPiece + currentPieceOffset;
          
          // Deselect past pieces
          if (targetPiece > 0) {
            engine.deselect(0, targetPiece - 1, false);
          }
          
          // Select current piece and next 15 pieces with high priority
          const endPiece = Math.min(targetPiece + 15, totalPieces - 1);
          engine.select(targetPiece, endPiece, true);
        },
        getPrimaryFile() {
          let largestFile: MediaFile | null = null;
          for (const file of files) {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (VIDEO_EXTENSIONS.includes(ext)) {
              if (!largestFile || file.length > largestFile.length) {
                largestFile = file;
              }
            }
          }
          return largestFile || files.reduce((prev, current) => (prev.length > current.length) ? prev : current);
        },
        resetIdleTimer
      };

      engines.set(infoHash, instance);
      resolve(instance);
    });

    engine.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export function inspectTorrent(infoHashOrMagnet: string): Promise<TorrentMetadata> {
  return new Promise((resolve, reject) => {
    const engine = torrentStream(infoHashOrMagnet);

    const timeout = setTimeout(() => {
      engine.destroy(() => {
        reject(new Error('Timeout fetching metadata'));
      });
    }, 15000);

    engine.on('ready', () => {
      clearTimeout(timeout);
      const metadata: TorrentMetadata = {
        name: engine.torrent.name,
        infoHash: engine.infoHash,
        files: engine.files.map((f: any) => ({
          name: f.name,
          path: f.path,
          length: f.length
        }))
      };
      
      engine.destroy(() => {
        resolve(metadata);
      });
    });
    
    engine.on('error', (err: Error) => {
      clearTimeout(timeout);
      engine.destroy(() => {
         reject(err);
      });
    });
  });
}
