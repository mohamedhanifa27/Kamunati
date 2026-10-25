import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

const probeCache = new Map<string, any>();

export function getCachedProbe(infoHash: string, fileIndex: number): any | null {
  const cacheKey = `${infoHash.toLowerCase()}-${fileIndex}`;
  return probeCache.get(cacheKey) || null;
}

function parseFps(rateStr?: string): number {
  if (!rateStr) return 24;
  const parts = rateStr.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (den > 0 && num > 0) return Math.round((num / den) * 100) / 100;
  }
  const parsed = parseFloat(rateStr);
  return isNaN(parsed) || parsed <= 0 ? 24 : Math.round(parsed * 100) / 100;
}

// [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
// Probe the stream for the exact fileIndex requested.
// Avoid picking a random largest video file from disk which corrupted duration and metadata for multi-file torrents.
export function probeStream(streamUrl: string, infoHash: string, fileIndex: number, directDiskPath?: string | null): Promise<any> {
  const cacheKey = `${infoHash.toLowerCase()}-${fileIndex}`;
  if (probeCache.has(cacheKey)) {
    return Promise.resolve(probeCache.get(cacheKey));
  }

  return new Promise((resolve, reject) => {
    // Only use local disk if explicitly verified complete for this exact file
    const targetInput = (directDiskPath && fs.existsSync(directDiskPath)) ? directDiskPath : streamUrl;

    const args = [
      '-v', 'error',
      '-analyzeduration', '4000000',
      '-probesize', '4000000',
      '-show_entries', 'stream=index,codec_name,codec_long_name,codec_type,profile,width,height,r_frame_rate,avg_frame_rate,pix_fmt,channels,channel_layout,sample_rate,bit_rate,tags,disposition',
      '-show_entries', 'format=format_name,format_long_name,duration,size,bit_rate,tags',
      '-show_chapters',
      '-of', 'json',
      targetInput
    ];

    let settled = false;
    const ffprobe = spawn(ffprobePath, args);
    let out = '';
    let err = '';

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { ffprobe.kill('SIGKILL'); } catch {}
        reject(new Error('ffprobe timed out waiting for stream headers'));
      }
    }, 15000);

    ffprobe.stdout.on('data', d => out += d.toString());
    ffprobe.stderr.on('data', d => err += d.toString());

    ffprobe.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error('ffprobe spawn error: ' + e.message));
    });

    ffprobe.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error('ffprobe failed: ' + err));
      }
      try {
        const data = JSON.parse(out);

        const enrichedStreams = (data.streams || []).map((s: any) => {
          const lang = s.tags?.language || s.tags?.LANGUAGE || s.tags?.lang || '';
          const title = s.tags?.title || s.tags?.TITLE || '';
          const isDefault = s.disposition?.default === 1;

          if (s.codec_type === 'audio') {
            const layout = s.channel_layout || (s.channels === 6 ? '5.1' : s.channels === 2 ? 'stereo' : s.channels === 1 ? 'mono' : `${s.channels || 2}ch`);
            return {
              ...s,
              language: lang,
              title: title,
              channel_layout: layout,
              isDefault
            };
          }

          if (s.codec_type === 'video') {
            const fps = parseFps(s.avg_frame_rate && s.avg_frame_rate !== '0/0' ? s.avg_frame_rate : s.r_frame_rate);
            return {
              ...s,
              language: lang,
              title: title,
              fps,
              isDefault
            };
          }

          if (s.codec_type === 'subtitle') {
            const cName = (s.codec_name || '').toLowerCase();
            const isBitmap = ['pgssub', 'hdmv_pgs_subtitle', 'dvd_subtitle', 'vobsub', 'dvb_subtitle', 'xsub'].includes(cName);
            return {
              ...s,
              language: lang,
              title: title,
              isBitmap,
              isDefault
            };
          }

          return s;
        });

        const chapters = (data.chapters || []).map((c: any, idx: number) => ({
          id: c.id ?? idx,
          title: c.tags?.title || c.tags?.TITLE || `Chapter ${idx + 1}`,
          start: parseFloat(c.start_time || '0'),
          end: parseFloat(c.end_time || '0')
        }));

        const result = {
          ...data,
          streams: enrichedStreams,
          chapters,
          format: data.format || {}
        };

        probeCache.set(cacheKey, result);
        resolve(result);
      } catch(e) {
        reject(e);
      }
    });
  });
}
