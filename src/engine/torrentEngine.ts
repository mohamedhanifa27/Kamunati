// @ts-nocheck
import torrentStream from 'torrent-stream';
import { EngineInstance, MediaFile, SwarmStats, TorrentMetadata } from '../types/torrent';

const engines = new Map<string, EngineInstance>();
const pendingEngines = new Map<string, Promise<EngineInstance>>();
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function getActiveEngineHashes(): string[] {
  const active = new Set<string>();
  for (const key of engines.keys()) {
    active.add(key.toLowerCase());
  }
  for (const key of pendingEngines.keys()) {
    active.add(key.toLowerCase());
  }
  return Array.from(active);
}

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.hevc', '.h265', '.h264', '.webm', '.avi', '.ts', '.m4v', '.mov'];

export const MASTER_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://open.stealth.si:80/announce',
  'udp://open.demonii.com:1337/announce',
  'https://tracker.zhuqiy.com:443/announce',
  'https://tracker.pmman.tech:443/announce',
  'udp://tracker.corpscorp.online:80/announce',
  'udp://tracker.opentorrent.top:6969/announce',
  'http://tracker.mywaifu.best:6969/announce',
  'udp://tracker.dler.com:6969/announce',
  'http://tracker.ipv6tracker.ru:80/announce',
  'udp://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.internetwarriors.net:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://explodie.org:6969/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://tracker.tiny-vps.com:6969/announce',
  'udp://tracker.cyberia.is:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'http://tracker.tamilmv.ch:6969/announce',
  'http://tracker.tamilmv.cz:6969/announce',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz'
];

export function enrichMagnetUri(magnetOrHash: string): string {
  let magnet = magnetOrHash;
  if (!magnet.startsWith('magnet:')) {
    magnet = `magnet:?xt=urn:btih:${magnet}`;
  }
  const existingTrackers = new Set(
    Array.from(magnet.matchAll(/tr=([^&]+)/g)).map(m => decodeURIComponent(m[1]))
  );
  for (const tr of MASTER_TRACKERS) {
    if (!existingTrackers.has(tr)) {
      magnet += `&tr=${encodeURIComponent(tr)}`;
    }
  }
  return magnet;
}

// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
export function isValidInfoHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  if (hash.includes('..') || hash.includes('/') || hash.includes('\\') || hash.includes('\0')) {
    return false;
  }
  return /^[a-fA-F0-9]{40}$/.test(hash) || /^[a-zA-Z2-7]{32}$/.test(hash);
}

export async function getEngine(infoHashOrMagnet: string): Promise<EngineInstance> {
  let infoHash = infoHashOrMagnet;
  if (infoHashOrMagnet.startsWith('magnet:')) {
    const match = infoHashOrMagnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
    if (match && match[1]) {
      infoHash = match[1].toLowerCase();
    }
  } else {
    infoHash = infoHash.toLowerCase();
  }

  // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Validate infoHash before any disk or engine operations
  if (!isValidInfoHash(infoHash)) {
    throw new Error(`Security Exception: Invalid infoHash format: ${infoHash}`);
  }

  if (engines.has(infoHash)) {
    const engineInstance = engines.get(infoHash)!;
    engineInstance.resetIdleTimer();
    return engineInstance;
  }

  if (pendingEngines.has(infoHash)) {
    return pendingEngines.get(infoHash)!;
  }

  const enginePromise = (async () => {
    const fs = require('fs');
    const path = require('path');
    let torrentInput: any = infoHashOrMagnet;
    // [RECTIFICATION:TORRENT_AVAILABILITY_AND_LOCAL_CACHE]
    const torrentPath = path.join(process.cwd(), 'data/torrents', `${infoHash}.torrent`);
    const cachedTorrentPath = path.join(process.cwd(), 'tmp/torrent-stream', `${infoHash}.torrent`);
    if (fs.existsSync(torrentPath)) {
      torrentInput = fs.readFileSync(torrentPath);
    } else if (fs.existsSync(cachedTorrentPath)) {
      torrentInput = fs.readFileSync(cachedTorrentPath);
    } else if (!infoHashOrMagnet.startsWith('magnet:')) {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const t = await prisma.torrentSource.findFirst({ where: { infoHash } });
        if (t && t.magnetUri) {
          torrentInput = enrichMagnetUri(t.magnetUri);
        } else {
          torrentInput = enrichMagnetUri(infoHash);
        }
        await prisma.$disconnect();
      } catch (e) {
        torrentInput = enrichMagnetUri(infoHash);
      }
    } else {
      torrentInput = enrichMagnetUri(infoHashOrMagnet);
    }

    return new Promise<EngineInstance>((resolve, reject) => {
      const engine = torrentStream(torrentInput, {
      connections: 80,
      uploads: 2,
      tmp: './tmp',
      dht: true,
      verify: false,
      trackers: MASTER_TRACKERS
    });

    // Timeout if torrent metadata cannot be fetched
    const fetchTimeout = setTimeout(() => {
      engine.destroy(() => {
        reject(new Error("Timeout fetching torrent metadata. No seeders available."));
      });
    }, 45000);

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
      clearTimeout(fetchTimeout);

      // [RECTIFICATION:TORRENT_AVAILABILITY_AND_LOCAL_CACHE]
      // Cache resolved .torrent file into data/torrents for instant zero-latency future streaming
      try {
        const cachedPath = path.join(process.cwd(), 'tmp/torrent-stream', `${infoHash}.torrent`);
        const targetPath = path.join(process.cwd(), 'data/torrents', `${infoHash}.torrent`);
        if (fs.existsSync(cachedPath) && !fs.existsSync(targetPath)) {
          fs.copyFileSync(cachedPath, targetPath);
        }
      } catch {}
      const pieceLength = engine.torrent.pieceLength || (1024 * 1024);
      const totalPieces = Math.ceil(engine.torrent.length / (pieceLength || 1));

      let lastDownloaded = engine.swarm.downloaded || 0;
      let lastSpeedCheckTime = Date.now();
      let smoothedSpeed = 0;

      const speedInterval = setInterval(() => {
        const now = Date.now();
        const dt = (now - lastSpeedCheckTime) / 1000;
        if (dt >= 0.4) {
          const curDownloaded = engine.swarm.downloaded || 0;
          const delta = Math.max(0, curDownloaded - lastDownloaded);
          const instSpeed = delta / dt;
          smoothedSpeed = Math.round(smoothedSpeed * 0.65 + instSpeed * 0.35);
          lastDownloaded = curDownloaded;
          lastSpeedCheckTime = now;
        }
      }, 500);

      let instance: EngineInstance;

      // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
      // Pre-fetch container head (first 16 pieces) and cues/moov trailer (last 10 pieces) for any target file.
      // This ensures seamless container parsing, fast seek index discovery, and eliminates stalling near end.
      const prioritizeFile = (targetFile: any) => {
        if (!targetFile || !pieceLength || totalPieces <= 0) return;
        const fileOffset = (typeof targetFile.offset === 'number') ? targetFile.offset : 0;
        const fileStartPiece = Math.floor(fileOffset / pieceLength);
        const fileEndPiece = Math.min(Math.floor((fileOffset + targetFile.length - 1) / pieceLength), totalPieces - 1);

        // 1. First 16 pieces for container headers / initial playback
        const headEnd = Math.min(fileStartPiece + 15, fileEndPiece);
        if (typeof (engine as any).critical === 'function') {
          (engine as any).critical(fileStartPiece, Math.min(8, headEnd - fileStartPiece + 1));
        }
        engine.select(fileStartPiece, headEnd, 2);

        // 2. Last 10 pieces for cues/index and trailer metadata
        if (fileEndPiece > fileStartPiece + 16) {
          const tailStart = Math.max(fileStartPiece, fileEndPiece - 9);
          if (typeof (engine as any).critical === 'function') {
            (engine as any).critical(tailStart, fileEndPiece - tailStart + 1);
          }
          engine.select(tailStart, fileEndPiece, 2);
        }
      };

      const files: MediaFile[] = engine.files.map((f: any) => ({
        name: f.name,
        path: f.path,
        length: f.length,
        offset: f.offset,
        createReadStream: (opts?: { start: number; end: number }) => {
          const stream = f.createReadStream(opts);
          const startByte = opts?.start || 0;
          let bytesStreamed = 0;
          let lastPieceTriggered = -1;

          // Immediately prime lookahead window for start of read
          if (instance && instance.setStreamPosition) {
            instance.setStreamPosition(startByte, f);
          }

          stream.on('data', (chunk: any) => {
            bytesStreamed += chunk.length;
            const currentByte = startByte + bytesStreamed;
            // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
            // Calculate absolute piece index using (f.offset + currentByte) to avoid floor sum off-by-one errors
            const pieceIdx = Math.floor(((f.offset || 0) + currentByte) / (pieceLength || 1));
            if (pieceIdx !== lastPieceTriggered) {
              lastPieceTriggered = pieceIdx;
              if (instance && instance.setStreamPosition) {
                instance.setStreamPosition(currentByte, f);
              }
            }
          });

          return stream;
        }
      }));

      const primaryFile = files.find((f: any) => {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
      }) || (files.length > 0 ? files.reduce((prev: any, current: any) => (prev.length > current.length ? prev : current)) : null);

      if (primaryFile) {
        prioritizeFile(primaryFile);
      } else {
        engine.select(0, Math.min(5, totalPieces - 1), 2);
      }

      resetIdleTimer();

      instance = {
        infoHash,
        files,
        torrent: engine.torrent,
        bitfield: engine.bitfield,
        get stats(): SwarmStats {
          const downloaded = engine.swarm.downloaded;
          const liveSwarmSpeed = engine.swarm.downloadSpeed();
          const activeSpeed = Math.max(liveSwarmSpeed, smoothedSpeed);
          return {
            peers: engine.swarm.wires.length,
            activeSeeders: engine.swarm.wires.filter((w: any) => !w.peerChoking).length,
            activeLeechers: engine.swarm.wires.filter((w: any) => w.peerChoking).length,
            downloadSpeed: activeSpeed,
            uploadSpeed: engine.swarm.uploadSpeed(),
            downloaded,
            uploaded: engine.swarm.uploaded,
            percentVerified: (engine.torrent.pieces ? engine.torrent.pieces.filter((p: any) => p).length / engine.torrent.pieces.length : 0) * 100
          };
        },
        destroy(callback) {
          clearInterval(speedInterval);
          clearTimeout(idleTimer);
          engine.destroy(callback);
          engines.delete(infoHash);
        },
        // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
        // Checks whether all pieces of a specific file in the torrent have been verified
        isFileComplete(targetFile: MediaFile): boolean {
          if (!engine || !engine.bitfield || !pieceLength || !targetFile) return false;
          const fileOffset = (typeof targetFile.offset === 'number') ? targetFile.offset : 0;
          const fileStartPiece = Math.floor(fileOffset / pieceLength);
          const fileEndPiece = Math.min(Math.floor((fileOffset + targetFile.length - 1) / pieceLength), totalPieces - 1);
          for (let p = fileStartPiece; p <= fileEndPiece; p++) {
            if (!engine.bitfield.get(p)) return false;
          }
          return true;
        },
        prioritizeFile(targetFile: MediaFile) {
          prioritizeFile(targetFile);
        },
        // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
        // Sliding window lookahead ensuring uninterrupted playback till the end of the media:
        // - Adaptive lookahead (~80-120MB)
        // - Immediate 12 pieces critical
        // - All remaining pieces to file end marked critical when approaching end of media
        setStreamPosition(byteOffset: number, file: MediaFile) {
          resetIdleTimer();
          if (!pieceLength || totalPieces <= 0) return;

          const fileOffset = (file && typeof file.offset === 'number') ? file.offset : 0;
          const fileLength = file?.length || 0;
          const fileStartPiece = Math.floor(fileOffset / pieceLength);
          const fileEndPiece = Math.min(
            fileLength > 0 ? Math.floor((fileOffset + fileLength - 1) / pieceLength) : totalPieces - 1,
            totalPieces - 1
          );

          // Absolute position in entire torrent
          const absoluteByte = Math.max(0, fileOffset + byteOffset);
          const targetPiece = Math.min(Math.max(Math.floor(absoluteByte / pieceLength), fileStartPiece), fileEndPiece);

          // Determine adaptive forward lookahead (~80-120MB buffer window)
          const lookaheadPieces = Math.max(50, Math.ceil((90 * 1024 * 1024) / pieceLength));
          const endPiece = Math.min(targetPiece + lookaheadPieces, fileEndPiece);

          // Mark immediate upcoming pieces (next 12 pieces) as critical for zero-latency playback
          const immediateCritical = Math.min(12, fileEndPiece - targetPiece + 1);
          if (typeof (engine as any).critical === 'function') {
            (engine as any).critical(targetPiece, immediateCritical);
          }

          // If playback is approaching the end of the media (within 25 pieces of the file end):
          // Mark ALL remaining pieces up to fileEndPiece as critical so playback finishes without buffering
          const remainingPiecesToFileEnd = fileEndPiece - targetPiece + 1;
          if (remainingPiecesToFileEnd <= 25 && typeof (engine as any).critical === 'function') {
            (engine as any).critical(targetPiece, remainingPiecesToFileEnd);
          }

          // Clean up old sliding lookahead windows to prevent selection queue bloat
          if (Array.isArray(engine.selection)) {
            engine.selection = engine.selection.filter((s: any) => !s._isSlidingWindow);
          }

          if (targetPiece <= endPiece) {
            const slidingEntry: any = {
              from: targetPiece,
              to: endPiece,
              offset: 0,
              priority: 2, // High priority above background selections
              notify: () => {},
              _isSlidingWindow: true
            };
            engine.selection.unshift(slidingEntry);
          }

          // Wake up swarm wires immediately so new piece requests are dispatched without delay
          if (typeof (engine as any)._refresh === 'function') {
            (engine as any)._refresh();
          } else if (typeof (engine as any).refresh === 'function') {
            (engine as any).refresh();
          }
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
  })();

  pendingEngines.set(infoHash, enginePromise);
  try {
    const instance = await enginePromise;
    return instance;
  } finally {
    pendingEngines.delete(infoHash);
  }
}

export function inspectTorrent(infoHashOrMagnet: string): Promise<TorrentMetadata> {
  return new Promise((resolve, reject) => {
    let infoHash = infoHashOrMagnet;
    if (infoHashOrMagnet.startsWith('magnet:')) {
      const match = infoHashOrMagnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
      if (match && match[1]) infoHash = match[1].toLowerCase();
    } else {
      infoHash = infoHash.toLowerCase();
    }
    
    // Ensure infoHash is valid length (40 hex chars or 32 base32 chars)
    if (infoHash.length < 32 || infoHash.length > 40) {
      return reject(new Error('Invalid magnet link: the infoHash is incomplete or malformed.'));
    }
    const fs = require('fs');
    const path = require('path');
    let torrentInput = enrichMagnetUri(infoHashOrMagnet);
    const torrentPath = path.join(process.cwd(), 'data/torrents', `${infoHash}.torrent`);
    if (fs.existsSync(torrentPath)) {
      torrentInput = fs.readFileSync(torrentPath);
    }
    const engine = torrentStream(torrentInput, {
      tmp: './tmp',
      verify: false,
      trackers: MASTER_TRACKERS
    });

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
