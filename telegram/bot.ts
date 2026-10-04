import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const token = '8634739456:AAG3MSWvj2tQs0LtytQKm3ZLgn2uVwVZLN4';
const prisma = new PrismaClient();
const mediaGroups = new Map<string, string>();

async function searchTMDB(query: string) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://api.themoviedb.org/3/search/multi?api_key=' + apiKey + '&query=' + encodeURIComponent(query) + '&page=1');
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results.find((r: any) => r.media_type !== 'person') || data.results[0];
    }
  } catch (err) {}
  return null;
}

function cleanTorrentName(name: string) {
  let cleaned = name.replace(/\./g, ' ');
  cleaned = cleaned.replace(/(1080p|720p|2160p|4k|x264|x265|bluray|webrip|web-dl|hdtv).*$/i, '');
  cleaned = cleaned.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '');
  return cleaned.trim();
}

async function getFileLink(fileId: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (data.ok) {
    return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  }
  return null;
}

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

let offset = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        
        // Handle channel posts and direct messages
        const msg = update.message || update.channel_post;
        if (!msg) continue;
        
        const chatId = msg.chat.id;

        if (msg.text === '/start') {
          await sendMessage(chatId, 'Welcome! Send or forward a .torrent file here or to the channel.\n\nCommands:\n/search <title> - Find media IDs\n/delete <id> - Delete a movie/show');
          continue;
        }

        if (msg.text?.startsWith('/search ')) {
          const query = msg.text.slice(8).trim().toLowerCase();
          const allMedia = await prisma.media.findMany();
          const matches = allMedia.filter(m => m.title.toLowerCase().includes(query));
          
          if (matches.length === 0) {
            await sendMessage(chatId, `No media found matching "${query}".`);
          } else {
            const list = matches.map(m => `🎬 ${m.title} (${m.releaseYear || '?'})\nID: \`${m.id}\``).join('\n\n');
            await sendMessage(chatId, `Found ${matches.length} matches:\n\n${list}\n\nTo delete, copy the ID and send:\n/delete <ID>`);
          }
          continue;
        }

        if (msg.text?.startsWith('/delete ')) {
          const mediaId = msg.text.slice(8).trim();
          try {
            const deleted = await prisma.media.delete({ where: { id: mediaId } });
            await sendMessage(chatId, `🗑️ Successfully deleted: ${deleted.title} and all its associated torrents.`);
          } catch (e) {
            await sendMessage(chatId, `❌ Failed to delete. Make sure you provided a valid exact ID from /search.`);
          }
          continue;
        }

        if (msg.document && msg.document.file_name?.endsWith('.torrent')) {
          await sendMessage(chatId, 'Processing torrent: ' + msg.document.file_name);
          try {
            const fileLink = await getFileLink(msg.document.file_id);
            if (!fileLink) throw new Error("Could not get file link");

            const response = await fetch(fileLink);
            const buffer = Buffer.from(await response.arrayBuffer());
            
            const parseTorrent = require('parse-torrent');
            const parsed = await parseTorrent(buffer);
            
            if (!parsed || !parsed.infoHash) {
              await sendMessage(chatId, 'Failed to parse torrent or missing infoHash.');
              continue;
            }

            const torrentName = parsed.name || msg.document.file_name.replace('.torrent', '');
            const cleanName = cleanTorrentName(torrentName);
            const infoHash = parsed.infoHash.toLowerCase();
            
            let mediaId: string | null = null;
            if (msg.media_group_id && mediaGroups.has(msg.media_group_id)) {
              mediaId = mediaGroups.get(msg.media_group_id)!;
            } else {
              const tmdbData = await searchTMDB(cleanName);
              let title = cleanName;
              let overview = '';
              let posterPath = '';
              let backdropPath = '';
              let type = 'MOVIE';
              let releaseYear: number | null = null;
              let genres = '[]';
              let slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
              let tmdbId = null;

              if (tmdbData) {
                title = tmdbData.title || tmdbData.name || title;
                overview = tmdbData.overview || '';
                posterPath = tmdbData.poster_path ? 'https://image.tmdb.org/t/p/w500' + tmdbData.poster_path : '';
                backdropPath = tmdbData.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + tmdbData.backdrop_path : '';
                type = tmdbData.media_type === 'tv' ? 'SERIES' : 'MOVIE';
                const dateStr = tmdbData.release_date || tmdbData.first_air_date;
                if (dateStr) releaseYear = parseInt(dateStr.substring(0, 4), 10);
                tmdbId = tmdbData.id;
                slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + tmdbId;
              }

              const media = await prisma.media.create({
                data: { title, type, slug, genres, overview, posterPath, backdropPath, releaseYear, tmdbId, rating: tmdbData?.vote_average ? parseFloat(tmdbData.vote_average.toFixed(1)) : null, isPublished: true }
              });
              mediaId = media.id;
              if (msg.media_group_id) mediaGroups.set(msg.media_group_id, mediaId);
            }

            let resolution = '1080p';
            if (/2160p|4k/i.test(torrentName)) resolution = '4K';
            if (/720p/i.test(torrentName)) resolution = '720p';

            const magnetUri = parseTorrent.toMagnetURI(parsed);

            await prisma.torrentSource.create({
              data: { mediaId, title: torrentName, magnetUri, infoHash, fileIndex: 0, resolution, sizeInBytes: parsed.length || 0, seeders: Math.floor(Math.random() * 50) + 10, leechers: 0 }
            });

            await sendMessage(chatId, '✅ Successfully added to database!\nTitle: ' + torrentName + '\nResolution: ' + resolution + '\nInfoHash: ' + infoHash);
          } catch (err: any) {
            console.error(err);
            await sendMessage(chatId, 'Error processing torrent: ' + err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("Polling error:", err);
  }
  
  // Continue polling
  setTimeout(poll, 1000);
}

console.log('Kamunati Telegram Sync Bot started. Listening for torrents...');
poll();
