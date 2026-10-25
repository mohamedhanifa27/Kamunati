import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN || '8634739456:AAG3MSWvj2tQs0LtytQKm3ZLgn2uVwVZLN4';
const prisma = new PrismaClient();
const mediaGroups = new Map<string, string>();
const magnetSessions = new Map<string, string>();
const tmdbCache = new Map<string, any>();

// Ensure data/torrents directory exists for caching .torrent files
const torrentDir = path.join(__dirname, '../data/torrents');
if (!fs.existsSync(torrentDir)) {
  fs.mkdirSync(torrentDir, { recursive: true });
}

function cleanTorrentName(name: string): string {
  let cleaned = name.replace(/\./g, ' ');
  cleaned = cleaned.replace(/(1080p|720p|2160p|4k|x264|x265|bluray|webrip|web-dl|hdtv).*$/i, '');
  cleaned = cleaned.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
  return cleaned.trim();
}

async function searchTMDB(query: string): Promise<any> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !query) return null;

  const normalized = query.toLowerCase().trim();
  if (tmdbCache.has(normalized)) {
    return tmdbCache.get(normalized);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://api.tmdb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`,
      { signal: controller.signal as any }
    );
    clearTimeout(timeoutId);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const match = data.results.find((r: any) => r.media_type !== 'person') || data.results[0];
      tmdbCache.set(normalized, match);
      return match;
    }
  } catch (err) {
    console.warn(`TMDB lookup timed out or failed for "${query}":`, err);
  }

  tmdbCache.set(normalized, null);
  return null;
}

async function getFileLink(fileId: string, retries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
      const data = await res.json();
      if (data.ok && data.result?.file_path) {
        return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
      }
      if (data.error_code === 429) {
        const retryAfter = (data.parameters?.retry_after || 2) * 1000;
        console.log(`Telegram rate limited getFile. Waiting ${retryAfter}ms before retry...`);
        await new Promise(r => setTimeout(r, retryAfter + 500));
        continue;
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function sendMessage(chatId: string | number, text: string, retries = 3): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
      });
      const data = await res.json();
      if (data.ok) return true;
      if (data.error_code === 429) {
        const retryAfter = (data.parameters?.retry_after || 2) * 1000;
        console.log(`Telegram rate limited sendMessage. Waiting ${retryAfter}ms before retry...`);
        await new Promise(r => setTimeout(r, retryAfter + 500));
        continue;
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function processParsedTorrent(
  parsed: any,
  fileName: string,
  chatId: string | number,
  mediaGroupId?: string,
  forcedMediaId?: string,
  buffer?: Buffer
) {
  if (!parsed || !parsed.infoHash) {
    await sendMessage(chatId, '❌ Failed to parse torrent or missing infoHash.');
    return;
  }

  const torrentName = parsed.name || fileName.replace('.torrent', '');
  const cleanName = cleanTorrentName(torrentName);
  const infoHash = parsed.infoHash.toLowerCase();

  // Save the .torrent file on disk so the streaming server and metadata parser can access it directly
  if (buffer) {
    try {
      const filePath = path.join(torrentDir, `${infoHash}.torrent`);
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.warn('Could not save .torrent file to disk:', e);
    }
  }

  let mediaId: string | null = forcedMediaId || null;
  if (!mediaId && mediaGroupId && mediaGroups.has(mediaGroupId)) {
    mediaId = mediaGroups.get(mediaGroupId)!;
  }

  if (!mediaId) {
    const tmdbData = await searchTMDB(cleanName);
    let title = cleanName;
    let overview = '';
    let posterPath = '';
    let backdropPath = '';
    let logoPath = '';
    let type = 'MOVIE';
    let releaseYear: number | null = null;
    let genres = '[]';
    let tmdbId: number | null = null;

    if (tmdbData) {
      title = tmdbData.title || tmdbData.name || title;
      overview = tmdbData.overview || '';
      posterPath = tmdbData.poster_path ? 'https://image.tmdb.org/t/p/w500' + tmdbData.poster_path : '';
      backdropPath = tmdbData.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + tmdbData.backdrop_path : '';
      type = tmdbData.media_type === 'tv' ? 'SERIES' : 'MOVIE';
      const dateStr = tmdbData.release_date || tmdbData.first_air_date;
      if (dateStr) releaseYear = parseInt(dateStr.substring(0, 4), 10);
      tmdbId = tmdbData.id;

      try {
        const typeStr = tmdbData.media_type === 'tv' ? 'tv' : 'movie';
        const imgRes = await fetch(
          `https://api.tmdb.org/3/${typeStr}/${tmdbId}/images?api_key=${process.env.TMDB_API_KEY}&include_image_language=en,null`
        );
        const imgData = await imgRes.json();
        if (imgData.logos && imgData.logos.length > 0) {
          const best = imgData.logos
            .filter((l: any) => l.iso_639_1 === 'en' || !l.iso_639_1)
            .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))[0];
          if (best) logoPath = 'https://image.tmdb.org/t/p/w500' + best.file_path;
        }
      } catch (e) {}
    }

    // 1. Check if an existing title has this TMDB ID
    if (tmdbId) {
      const existingMedia = await prisma.media.findUnique({
        where: { tmdbId }
      });
      if (existingMedia) {
        mediaId = existingMedia.id;
      }
    }

    // 2. Check if an existing title has a matching clean title
    if (!mediaId) {
      const existingByTitle = await prisma.media.findFirst({
        where: {
          title: {
            equals: title
          }
        }
      });
      if (existingByTitle) {
        mediaId = existingByTitle.id;
      }
    }

    // 3. If still not found, create a new media record
    if (!mediaId) {
      const uniqueSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tmdbId || Date.now()}`;
      const media = await prisma.media.create({
        data: {
          title,
          type,
          slug: uniqueSlug,
          genres,
          overview,
          posterPath,
          backdropPath,
          logoPath,
          releaseYear,
          tmdbId,
          rating: tmdbData?.vote_average ? parseFloat(tmdbData.vote_average.toFixed(1)) : null,
          isPublished: true
        }
      });
      mediaId = media.id;
    }

    if (mediaGroupId) mediaGroups.set(mediaGroupId, mediaId);
  }

  let resolution = '1080p';
  if (/2160p|4k/i.test(torrentName)) resolution = '4K';
  else if (/720p/i.test(torrentName)) resolution = '720p';
  else if (/480p/i.test(torrentName)) resolution = '480p';

  const parseTorrent = require('parse-torrent');
  const magnetUri = parseTorrent.toMagnetURI(parsed);

  const media = await prisma.media.findUnique({
    where: { id: mediaId! },
    include: { torrents: true }
  });

  if (media?.type === 'SERIES' && parsed.files && parsed.files.length > 0) {
    let seasonNumber = 1;
    const sMatch = torrentName.match(/S(\d+)/i);
    if (sMatch) seasonNumber = parseInt(sMatch[1], 10);

    let season = await prisma.season.findUnique({
      where: { mediaId_seasonNumber: { mediaId: mediaId!, seasonNumber } }
    });
    if (!season) {
      season = await prisma.season.create({
        data: { mediaId: mediaId!, seasonNumber, name: `Season ${seasonNumber}` }
      });
    }

    let addedCount = 0;
    for (let i = 0; i < parsed.files.length; i++) {
      const file = parsed.files[i];
      if (!file.name.match(/\.(mp4|mkv|avi|webm)$/i)) continue;

      let epNumber = i + 1;
      const eMatch =
        file.name.match(/E(\d+)/i) ||
        file.name.match(/-\s*(\d+)/) ||
        file.name.match(/Episode\s*(\d+)/i) ||
        file.name.match(/ep\s*(\d+)/i);
      if (eMatch) epNumber = parseInt(eMatch[1], 10);
      else {
        const numMatch = file.name.match(/^(\d+)\./);
        if (numMatch) epNumber = parseInt(numMatch[1], 10);
      }

      let episode = await prisma.episode.findUnique({
        where: { seasonId_episodeNumber: { seasonId: season.id, episodeNumber: epNumber } }
      });
      if (!episode) {
        episode = await prisma.episode.create({
          data: { seasonId: season.id, episodeNumber: epNumber, title: `Episode ${epNumber}` }
        });
      }

      const existingEpTorrent = await prisma.torrentSource.findFirst({
        where: { episodeId: episode.id, infoHash, fileIndex: i }
      });

      if (!existingEpTorrent) {
        await prisma.torrentSource.create({
          data: {
            episodeId: episode.id,
            title: file.name,
            magnetUri,
            infoHash,
            fileIndex: i,
            resolution,
            sizeInBytes: file.length || 0,
            seeders: Math.floor(Math.random() * 50) + 10,
            leechers: 0
          }
        });
        addedCount++;
      }
    }

    if (addedCount === 0) {
      const existingTorrent = await prisma.torrentSource.findFirst({
        where: { mediaId: mediaId!, infoHash, fileIndex: 0 }
      });
      if (!existingTorrent) {
        await prisma.torrentSource.create({
          data: {
            mediaId: mediaId!,
            title: torrentName,
            magnetUri,
            infoHash,
            fileIndex: 0,
            resolution,
            sizeInBytes: parsed.length || 0,
            seeders: Math.floor(Math.random() * 50) + 10,
            leechers: 0
          }
        });
      }
    }

    await sendMessage(
      chatId,
      `✅ Added TV Series to database!\nTitle: ${media.title}\nResolution: ${resolution}\nEpisodes Added: ${addedCount}`
    );
  } else {
    // Check if this exact torrent source is already linked
    const existingTorrent = await prisma.torrentSource.findFirst({
      where: { mediaId: mediaId!, infoHash, fileIndex: 0 }
    });

    if (existingTorrent) {
      await sendMessage(
        chatId,
        `ℹ️ Torrent already attached to "${media?.title || torrentName}"!\nResolution: ${resolution}\nInfoHash: ${infoHash}`
      );
    } else {
      await prisma.torrentSource.create({
        data: {
          mediaId: mediaId!,
          title: torrentName,
          magnetUri,
          infoHash,
          fileIndex: 0,
          resolution,
          sizeInBytes: parsed.length || 0,
          seeders: Math.floor(Math.random() * 50) + 10,
          leechers: 0
        }
      });
      await sendMessage(
        chatId,
        `✅ Added Torrent Source to "${media?.title || torrentName}"!\nResolution: ${resolution}\nInfoHash: ${infoHash}`
      );
    }
  }
}

// ─── SEQUENTIAL TASK QUEUE (FIFO) ──────────────────────────────────────────
// Prevents Telegram 429 rate limit errors and SQLite database write locks
// when users upload multiple .torrent files simultaneously.
interface UpdateTask {
  update: any;
}

const taskQueue: UpdateTask[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (taskQueue.length > 0) {
    const { update } = taskQueue.shift()!;
    try {
      await handleSingleUpdate(update);
    } catch (err: any) {
      console.error('Error handling update in queue:', err);
    }
    // Rate limit guard: wait 400ms between processing jobs to stay well within
    // Telegram's single-chat rate limit (1 msg/sec) and avoid SQLite lock contention
    await new Promise(r => setTimeout(r, 400));
  }

  isProcessingQueue = false;
}

async function handleSingleUpdate(update: any) {
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message.chat.id;
    const dataStr = cb.data;

    if (dataStr.startsWith('get_torrent_') || dataStr.startsWith('add_media_')) {
      const shortId = dataStr.split('_')[2];
      const magnetUri = magnetSessions.get(shortId);
      if (!magnetUri) {
        await sendMessage(chatId, '❌ Session expired or invalid magnet link.');
        return;
      }

      await sendMessage(chatId, '⏳ Processing magnet link...');
      const parseTorrent = require('parse-torrent');
      try {
        const parsed = parseTorrent(magnetUri);
        await processParsedTorrent(parsed, (parsed.name || 'download') + '.torrent', chatId.toString());
      } catch (e: any) {
        await sendMessage(chatId, '❌ Error parsing magnet link: ' + e.message);
      }
      return;
    }
  }

  const msg = update.message || update.channel_post;
  if (!msg) return;
  const chatId = msg.chat.id;

  if (msg.text && msg.text.trim().startsWith('/attach ') && msg.text.includes('magnet:?')) {
    const parts = msg.text.trim().split(' ');
    const mediaId = parts[1];
    const magnetUri = parts.slice(2).join(' ').trim();

    await sendMessage(chatId, '⏳ Processing magnet link...');
    const parseTorrent = require('parse-torrent');
    try {
      const parsed = parseTorrent(magnetUri);
      await processParsedTorrent(parsed, (parsed.name || 'download') + '.torrent', chatId.toString(), undefined, mediaId);
    } catch (e: any) {
      await sendMessage(chatId, '❌ Error parsing magnet link: ' + e.message);
    }
    return;
  }

  if (msg.text && msg.text.trim().startsWith('magnet:?')) {
    const shortId = Math.random().toString(36).substring(2, 10);
    magnetSessions.set(shortId, msg.text.trim());

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'What do you want to do with this magnet link?',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Get .torrent file', callback_data: `get_torrent_${shortId}` },
              { text: 'Add to Media', callback_data: `add_media_${shortId}` }
            ]
          ]
        }
      })
    });
    return;
  }

  if (msg.text === '/start') {
    await sendMessage(
      chatId,
      '🎬 Welcome to Kamunati Bot!\n\nSend or forward .torrent files here. When sending multiple files, they will be processed smoothly in queue.\n\nCommands:\n/status - View queue status\n/search <title> - Find media IDs\n/attach <id> - Attach next file to an existing media\n/delete <id> - Delete a title'
    );
    return;
  }

  if (msg.text === '/status') {
    const remaining = taskQueue.length;
    await sendMessage(
      chatId,
      `📊 Bot Status:\nQueue remaining: ${remaining} file(s)\nWorker active: ${isProcessingQueue ? 'Yes' : 'Idle'}`
    );
    return;
  }

  if (msg.text?.startsWith('/search ')) {
    const query = msg.text.slice(8).trim().toLowerCase();
    const allMedia = await prisma.media.findMany();
    const matches = allMedia.filter(m => m.title.toLowerCase().includes(query));

    if (matches.length === 0) {
      await sendMessage(chatId, `No media found matching "${query}".`);
    } else {
      const list = matches
        .slice(0, 15)
        .map(m => `🎬 ${m.title} (${m.releaseYear || '?'})\nID: \`${m.id}\``)
        .join('\n\n');
      await sendMessage(
        chatId,
        `Found ${matches.length} matches:\n\n${list}\n\nTo attach a torrent to a title, send:\n/attach <ID>\nTo delete, send:\n/delete <ID>`
      );
    }
    return;
  }

  if (msg.text?.startsWith('/delete ')) {
    const mediaId = msg.text.slice(8).trim();
    try {
      const deleted = await prisma.media.delete({ where: { id: mediaId } });
      await sendMessage(chatId, `🗑️ Successfully deleted: ${deleted.title} and its associated torrents.`);
    } catch (e) {
      await sendMessage(chatId, `❌ Failed to delete. Make sure you provided a valid exact ID from /search.`);
    }
    return;
  }

  if (msg.document && msg.document.file_name?.endsWith('.torrent')) {
    const queuePos = taskQueue.length + 1;
    const queueMsg = queuePos > 1 ? ` (Position in queue: ${queuePos})` : '';
    await sendMessage(chatId, `⏳ Ingesting: ${msg.document.file_name}${queueMsg}`);

    try {
      const fileLink = await getFileLink(msg.document.file_id);
      if (!fileLink) throw new Error('Could not retrieve file link from Telegram (rate limit or timeout)');

      const response = await fetch(fileLink);
      const buffer = Buffer.from(await response.arrayBuffer());

      let forcedId;
      if (msg.caption && msg.caption.startsWith('/attach ')) {
        forcedId = msg.caption.split(' ')[1];
      }

      const parseTorrent = require('parse-torrent');
      const parsed = await parseTorrent(buffer);
      await processParsedTorrent(
        parsed,
        msg.document.file_name,
        chatId.toString(),
        msg.media_group_id,
        forcedId,
        buffer
      );
    } catch (err: any) {
      console.error(`Error processing torrent ${msg.document.file_name}:`, err);
      await sendMessage(chatId, `❌ Error processing "${msg.document.file_name}": ${err.message}`);
    }
  }
}

let offset = 0;

async function poll() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`, {
      signal: controller.signal as any
    });
    clearTimeout(timeoutId);
    const data = await res.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = Math.max(offset, update.update_id + 1);
        taskQueue.push({ update });
      }
      // Start processing the queue sequentially
      processQueue();
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Telegram Polling error:', err);
    }
  }

  setTimeout(poll, 1000);
}

console.log('Kamunati Telegram Sync Bot started with Sequential Queue. Listening for torrents...');
poll();
