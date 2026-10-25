export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import parseTorrent from 'parse-torrent';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No torrent file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed: any = await parseTorrent(buffer);

    if (!parsed || !parsed.infoHash) {
      return NextResponse.json({ error: 'Invalid torrent file or missing infoHash' }, { status: 400 });
    }

    const infoHash = parsed.infoHash.toLowerCase();

    // Persist .torrent file to data/torrents for local engine caching
    const torrentsDir = path.join(process.cwd(), 'data', 'torrents');
    if (!fs.existsSync(torrentsDir)) {
      fs.mkdirSync(torrentsDir, { recursive: true });
    }
    const torrentFilePath = path.join(torrentsDir, `${infoHash}.torrent`);
    fs.writeFileSync(torrentFilePath, buffer);

    const files = (parsed.files || []).map((f: any, idx: number) => ({
      name: f.name || path.basename(f.path || ''),
      path: f.path || f.name || '',
      length: f.length || 0,
      index: idx
    }));

    const magnetUri = parseTorrent.toMagnetURI(parsed);

    return NextResponse.json({
      infoHash,
      name: parsed.name || file.name.replace(/\.torrent$/i, ''),
      files,
      magnetUri,
      totalLength: parsed.length || 0
    });
  } catch (err: any) {
    console.error('Torrent parse error:', err);
    return NextResponse.json({ error: 'Failed to parse .torrent file: ' + err.message }, { status: 500 });
  }
}
