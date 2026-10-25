import { FastifyInstance } from 'fastify';
import { getEngine } from '../engine/torrentEngine';
import { needsTranscoding, streamTranscoded } from '../engine/transcoder';
import { probeStream, getCachedProbe } from '../engine/ffprobe';
import { findTorrentExternalSubtitles, convertSubtitleToWebVTT } from '../engine/subtitles';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
const mime = require('mime-types');

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.hevc', '.h265', '.h264', '.webm', '.avi', '.ts', '.m4v', '.mov'];

function isVideo(fileName?: string, length?: number): boolean {
  if (!fileName) return false;
  const ext = path.extname(fileName).toLowerCase();
  if (VIDEO_EXTENSIONS.includes(ext)) return true;
  return (length !== undefined && length > 20 * 1024 * 1024);
}

// [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
// Resolve the target file in multi-file torrents cleanly.
// When fileIndex is specified, strictly honor it without falling back inappropriately.
function resolveTargetFile(engine: any, fileIndex?: string | number): { file: any; index: number } {
  const files = engine?.files || [];
  if (files.length === 0) return { file: null, index: 0 };

  if (fileIndex !== undefined && fileIndex !== null && fileIndex !== '') {
    const idx = typeof fileIndex === 'number' ? fileIndex : parseInt(String(fileIndex), 10);
    if (!isNaN(idx) && idx >= 0 && idx < files.length && files[idx]) {
      return { file: files[idx], index: idx };
    }
  }

  // Fallback to primary video file
  const primary = engine.getPrimaryFile?.();
  if (primary) {
    const pIdx = files.indexOf(primary);
    return { file: primary, index: pIdx >= 0 ? pIdx : 0 };
  }

  // Fallback: search for first video file
  for (let i = 0; i < files.length; i++) {
    if (isVideo(files[i].name, files[i].length)) {
      return { file: files[i], index: i };
    }
  }

  // Fallback to largest file
  let largestIdx = 0;
  let largestLen = 0;
  files.forEach((f: any, i: number) => {
    if (f.length > largestLen) {
      largestLen = f.length;
      largestIdx = i;
    }
  });

  return { file: files[largestIdx], index: largestIdx };
}

// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
export function isValidInfoHashOrMagnet(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  // Prevent any path traversal characters, directory separators, null bytes, or spaces
  if (input.includes('..') || input.includes('/') || input.includes('\\') || input.includes('\0') || input.includes(' ')) {
    return false;
  }
  // Standard hex infoHash (40 chars) or base32 infoHash (32 chars)
  if (/^[a-fA-F0-9]{40}$/.test(input) || /^[a-zA-Z2-7]{32}$/.test(input)) {
    return true;
  }
  // Standard magnet link
  if (input.startsWith('magnet:?')) {
    return /^magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}/i.test(input);
  }
  return false;
}

// [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
// Check complete verification for the specific file before bypassing torrent-stream.
// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] With strict path traversal protection
function getLocalDiskPath(infoHash: string, file: any, engine?: any): string | null {
  if (!file) return null;

  if (!infoHash || (!/^[a-fA-F0-9]{40}$/.test(infoHash) && !/^[a-zA-Z2-7]{32}$/.test(infoHash))) {
    return null;
  }

  if (!engine || typeof engine.isFileComplete !== 'function' || !engine.isFileComplete(file)) {
    return null;
  }

  const localTorrentDir = path.resolve(process.cwd(), 'tmp', 'torrent-stream', infoHash.toLowerCase());
  if (!fs.existsSync(localTorrentDir)) return null;

  // 1. Direct path with path traversal protection
  const relPath = file.path || file.name;
  if (!relPath || relPath.includes('..') || relPath.includes('\0')) return null;
  const directPath = path.resolve(localTorrentDir, relPath);
  if (!directPath.startsWith(localTorrentDir)) return null;
  if (fs.existsSync(directPath)) {
    const stat = fs.statSync(directPath);
    if (stat.size >= (file.length || 1024 * 1024)) return directPath;
  }

  // 2. Base name with path traversal protection
  const safeBase = path.basename(file.name || '');
  if (!safeBase || safeBase.includes('..') || safeBase.includes('\0')) return null;
  const baseNamePath = path.resolve(localTorrentDir, safeBase);
  if (!baseNamePath.startsWith(localTorrentDir)) return null;
  if (fs.existsSync(baseNamePath)) {
    const stat = fs.statSync(baseNamePath);
    if (stat.size >= (file.length || 1024 * 1024)) return baseNamePath;
  }

  return null;
}

export default async function streamRoutes(fastify: FastifyInstance) {
  // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
  // Return all files in the torrent so client can inspect and choose from multi-file torrents
  fastify.get('/api/v1/stream/:infoHashOrMagnet/files', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash or magnet URI format' });
    }
    try {
      const engine = await getEngine(infoHashOrMagnet);
      const files = (engine.files || []).map((f: any, index: number) => ({
        index,
        name: f.name,
        path: f.path,
        length: f.length,
        isVideo: isVideo(f.name, f.length)
      }));
      return reply.send({
        torrentName: (engine as any).torrent?.name || '',
        infoHash: engine.infoHash,
        files
      });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to retrieve torrent files: ' + err.message });
    }
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet/probe', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash or magnet URI format' });
    }
    const { fileIndex } = request.query as { fileIndex?: string };

    let externalSubtitles: any[] = [];
    let fIdx = 0;
    let torrentName = '';
    let filesList: any[] = [];
    let diskPath: string | null = null;

    try {
      const engine = await getEngine(infoHashOrMagnet);
      const target = resolveTargetFile(engine, fileIndex);
      fIdx = target.index;
      torrentName = (engine as any).torrent?.name || target.file?.name || '';
      
      // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
      // Pre-fetch the target file's head (16 pieces) and tail (10 pieces)
      if (target.file && typeof engine.prioritizeFile === 'function') {
        engine.prioritizeFile(target.file);
      }

      if (engine && engine.files) {
        filesList = engine.files.map((f: any, idx: number) => ({
          index: idx,
          name: f.name,
          path: f.path,
          length: f.length,
          isVideo: isVideo(f.name, f.length)
        }));
        externalSubtitles = findTorrentExternalSubtitles(engine.files);
      }

      diskPath = getLocalDiskPath(engine.infoHash, target.file, engine);
    } catch (e: any) {
      (fastify.log as any).warn('Could not discover external torrent subtitles/engine: ' + e.message);
    }

    const streamUrl = `http://127.0.0.1:8080/api/v1/stream/${infoHashOrMagnet}?fileIndex=${fIdx}`;

    try {
      const data = await probeStream(streamUrl, infoHashOrMagnet, fIdx, diskPath);
      return reply.send({
        ...data,
        torrentName,
        activeFileIndex: fIdx,
        files: filesList,
        externalSubtitles
      });
    } catch(err: any) {
      (fastify.log as any).warn('probeStream fallback: ' + err.message);
      return reply.send({
        streams: [],
        chapters: [],
        format: {},
        torrentName,
        activeFileIndex: fIdx,
        files: filesList,
        externalSubtitles,
        error: err.message
      });
    }
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet/play', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash parameter' });
    }
    const { audio, start, fileIndex, transcode } = request.query as { audio?: string, start?: string, fileIndex?: string, transcode?: string };
    
    let engine: any = null;
    let fIdx = 0;
    let file: any = null;
    try {
      engine = await getEngine(infoHashOrMagnet);
      const target = resolveTargetFile(engine, fileIndex);
      fIdx = target.index;
      file = target.file;

      // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
      // Ensure target file head and tail pieces are prioritized immediately
      if (file && typeof engine.prioritizeFile === 'function') {
        engine.prioritizeFile(file);
      }
    } catch (err: any) {
      (fastify.log as any).warn('getEngine error in play route: ' + err.message);
    }

    const isExplicitTranscode = transcode === 'true' || transcode === '1';
    let videoStreamIndex: number | null = null;
    let audioStreamIndex: number | null = null;
    let isHevc = false;

    // Fast non-blocking check if probe metadata was already cached
    const cachedProbe = getCachedProbe(infoHashOrMagnet, fIdx);
    if (cachedProbe && cachedProbe.streams) {
      const realVideoStreams = cachedProbe.streams.filter(
        (s: any) => s.codec_type === 'video' && 
                    s.codec_name !== 'mjpeg' && 
                    s.codec_name !== 'png' && 
                    !s.disposition?.attached_pic
      );
      const vStream = realVideoStreams[0] || cachedProbe.streams.find((s: any) => s.codec_type === 'video');
      if (vStream) {
        videoStreamIndex = vStream.index;
        const cName = (vStream.codec_name || '').toLowerCase();
        if (cName.includes('hevc') || cName.includes('h265')) {
          isHevc = true;
        }
      }
      const aStream = cachedProbe.streams.find((s: any) => s.codec_type === 'audio');
      if (aStream) {
        audioStreamIndex = aStream.index;
      }
    }

    // Also check torrent file name for HEVC / x265 keywords
    if (file && file.name) {
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('hevc') || lowerName.includes('x265') || lowerName.includes('h.265')) {
        isHevc = true;
      }
    }

    const diskPath = engine ? getLocalDiskPath(engine.infoHash, file, engine) : null;
    const streamUrl = `http://127.0.0.1:8080/api/v1/stream/${infoHashOrMagnet}?fileIndex=${fIdx}`;
    const inputTarget = diskPath || streamUrl;

    const videoMap = videoStreamIndex !== null ? `0:${videoStreamIndex}` : '0:V:0?';

    // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
    // Reconnect and network resilience parameters to ensure streams do not abort near media end
    const inputArgs: string[] = [
      '-ss', start || '0',
      '-err_detect', 'ignore_err'
    ];

    if (!diskPath) {
      inputArgs.push(
        '-reconnect', '1',
        '-reconnect_at_eof', '0',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-reconnect_on_network_error', '1'
      );
    }

    inputArgs.push(
      '-analyzeduration', '3000000',
      '-probesize', '3000000',
      '-i', inputTarget,
      '-map', videoMap
    );

    const args = [...inputArgs];

    if (audio !== undefined && audio !== '') {
      args.push('-map', `0:${audio}`);
    } else if (audioStreamIndex !== null) {
      args.push('-map', `0:${audioStreamIndex}`);
    } else {
      args.push('-map', '0:a:0?');
    }

    const shouldTranscode = isExplicitTranscode || (isHevc && transcode !== '0' && (request.query as any).copy !== '1');
    if (shouldTranscode) {
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '24',
        '-vf', "scale=-2:'min(720,ih)'",
        '-b:v', '2500k',
        '-maxrate', '3500k',
        '-bufsize', '5000k'
      );
    } else {
      args.push('-c:v', 'copy');
      if (isHevc) {
        args.push('-tag:v', 'hvc1');
      }
    }

    args.push(
      '-c:a', 'aac', '-b:a', '256k', '-ac', '2',
      '-max_muxing_queue_size', '2048',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
      '-flush_packets', '1',
      'pipe:1'
    );

    reply.header('Content-Type', 'video/mp4');
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Transfer-Encoding', 'chunked');
    
    const ffmpegPath = require('ffmpeg-static');
    const ffmpeg = spawn(ffmpegPath, args);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== 255 && !request.raw.destroyed) {
        (fastify.log as any).warn(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`);
      }
    });
    
    ffmpeg.on('error', (e) => {
      (fastify.log as any).error(e, 'ffmpeg spawn error');
    });

    request.raw.on('close', () => {
      try { ffmpeg.kill('SIGKILL'); } catch {}
    });

    return reply.send(ffmpeg.stdout);
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet/subtitle', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash parameter' });
    }
    const { track, fileIndex } = request.query as { track?: string; fileIndex?: string };
    const safeFIdx = Math.max(0, parseInt(fileIndex || '0', 10) || 0);
    const safeTrack = (track || 's0').replace(/[^a-zA-Z0-9_\-:]/g, '');
    
    const vttDir = path.resolve(process.cwd(), 'tmp', 'subs');
    if (!fs.existsSync(vttDir)) fs.mkdirSync(vttDir, { recursive: true });
    
    const safeHash = infoHashOrMagnet.toLowerCase().replace(/[^a-z0-9]/g, '');
    const vttPath = path.resolve(vttDir, `${safeHash}_${safeFIdx}_${safeTrack}.vtt`);
    if (!vttPath.startsWith(vttDir)) {
      return reply.status(400).send({ error: 'Invalid subtitle path' });
    }
    
    reply.header('Content-Type', 'text/vtt; charset=utf-8');

    if (fs.existsSync(vttPath) && fs.statSync(vttPath).size > 100) {
      return reply.send(fs.createReadStream(vttPath));
    }

    const streamUrl = `http://127.0.0.1:8080/api/v1/stream/${infoHashOrMagnet}?fileIndex=${safeFIdx}`;
    
    const ffmpegPath = require('ffmpeg-static');
    const mapSelector = /^s:\d+$/.test(safeTrack) ? safeTrack : (/^\d+$/.test(safeTrack) ? safeTrack : 's:0');
    const ffmpeg = spawn(ffmpegPath, [
      '-i', streamUrl,
      '-map', `0:${mapSelector}`,
      '-f', 'webvtt',
      '-y',
      vttPath
    ]);
    
    ffmpeg.on('error', (e) => (fastify.log as any).error(e, 'ffmpeg sub err'));
    
    let headSent = false;

    ffmpeg.stderr.on('data', () => {});
    
    const sendReady = () => {
       if (!headSent && fs.existsSync(vttPath) && fs.statSync(vttPath).size > 10) {
           headSent = true;
           const s = fs.createReadStream(vttPath);
           s.pipe(reply.raw);
       }
    };
    
    const iv = setInterval(sendReady, 1000);
    
    ffmpeg.on('close', () => {
       clearInterval(iv);
       if (!headSent) {
          if (fs.existsSync(vttPath) && fs.statSync(vttPath).size > 10) {
            fs.createReadStream(vttPath).pipe(reply.raw);
          } else {
            reply.raw.end('WEBVTT\n\n');
          }
       }
    });

    request.raw.on('close', () => {
      clearInterval(iv);
      try { ffmpeg.kill('SIGKILL'); } catch {}
    });
    
    return reply;
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet/ext-subtitle', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send('WEBVTT\n\n');
    }
    const { fileIndex } = request.query as { fileIndex?: string };
    const safeFIdx = Math.max(0, parseInt(fileIndex || '0', 10) || 0);

    reply.header('Content-Type', 'text/vtt; charset=utf-8');

    try {
      const engine = await getEngine(infoHashOrMagnet);
      const files = engine.files;
      if (!files || !files[safeFIdx]) {
        return reply.status(404).send('WEBVTT\n\n');
      }

      const file = files[safeFIdx];
      const ext = path.extname(file.name || '').toLowerCase().replace('.', '');

      // Check if file is already on disk in tmp/torrent-stream with path traversal protection
      const localTorrentDir = path.resolve(process.cwd(), 'tmp', 'torrent-stream', engine.infoHash.toLowerCase());
      const relPath = file.path || file.name;
      if (!relPath || relPath.includes('..') || relPath.includes('\0')) {
        return reply.status(400).send('WEBVTT\n\n');
      }
      const diskFilePath = path.resolve(localTorrentDir, relPath);
      if (!diskFilePath.startsWith(localTorrentDir)) {
        return reply.status(400).send('WEBVTT\n\n');
      }

      let buffer: Buffer;
      if (fs.existsSync(diskFilePath) && fs.statSync(diskFilePath).size >= file.length) {
        buffer = fs.readFileSync(diskFilePath);
      } else {
        // Read directly from torrent stream
        buffer = await new Promise<Buffer>((resolve, reject) => {
          const stream = file.createReadStream();
          const chunks: Buffer[] = [];
          const readTimeout = setTimeout(() => {
            if (chunks.length > 0) resolve(Buffer.concat(chunks));
            else reject(new Error('Subtitle download timeout'));
          }, 10000);

          stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          stream.on('end', () => {
            clearTimeout(readTimeout);
            resolve(Buffer.concat(chunks));
          });
          stream.on('error', (err: any) => {
            clearTimeout(readTimeout);
            reject(err);
          });
        });
      }

      const vtt = convertSubtitleToWebVTT(buffer, ext);
      return reply.send(vtt);
    } catch (err: any) {
      (fastify.log as any).warn('Could not serve external subtitle: ' + err.message);
      return reply.send('WEBVTT\n\n');
    }
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash or magnet URI format' });
    }
    const { fileIndex } = request.query as { fileIndex?: string };
    
    const engine = await getEngine(infoHashOrMagnet);
    const { file, index: fIdx } = resolveTargetFile(engine, fileIndex);
    if (!file) {
      return reply.status(404).send({ error: 'No files in torrent' });
    }

    // [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
    // Prioritize file head and tail
    if (typeof engine.prioritizeFile === 'function') {
      engine.prioritizeFile(file);
    }

    const diskPath = getLocalDiskPath(engine.infoHash, file, engine);
    const contentType = mime.lookup(file.name) || 'video/mp4';

    const range = request.headers.range;
    if (!range) {
      if (!diskPath) engine.setStreamPosition?.(0, file);
      reply.header('Content-Length', file.length);
      reply.header('Content-Type', contentType);
      reply.header('Accept-Ranges', 'bytes');
      return reply.send(diskPath ? fs.createReadStream(diskPath) : file.createReadStream());
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunksize = (end - start) + 1;

    if (!diskPath) engine.setStreamPosition?.(start, file);

    reply.code(206);
    reply.header('Content-Range', `bytes ${start}-${end}/${file.length}`);
    reply.header('Accept-Ranges', 'bytes');
    reply.header('Content-Length', chunksize);
    reply.header('Content-Type', contentType);

    const stream = diskPath ? fs.createReadStream(diskPath, { start, end }) : file.createReadStream({ start, end });
    return reply.send(stream);
  });

  fastify.get('/api/v1/stream/:infoHashOrMagnet/stats', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    if (!isValidInfoHashOrMagnet(infoHashOrMagnet)) {
      return reply.status(400).send({ error: 'Invalid infoHash parameter' });
    }
    try {
      const engine = await getEngine(infoHashOrMagnet);
      const s = engine.stats;
      return reply.send({
        downloadSpeed: s?.downloadSpeed || 0,
        uploadSpeed: s?.uploadSpeed || 0,
        peers: s?.peers || 0,
        activeSeeders: s?.activeSeeders || 0,
        downloaded: s?.downloaded || 0,
        percentVerified: s?.percentVerified || 0
      });
    } catch {
      return reply.send({
        downloadSpeed: 0,
        uploadSpeed: 0,
        peers: 0,
        activeSeeders: 0,
        downloaded: 0,
        percentVerified: 0
      });
    }
  });
}
