import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { infoHash, fileIndex, title, resolution, sizeInBytes, magnetUri } = body;
    
    if (!infoHash || fileIndex === undefined || !title) {
      return NextResponse.json({ error: 'Missing required torrent info' }, { status: 400 });
    }

    await prisma.torrentSource.create({
      data: {
        mediaId: params.id,
        title,
        magnetUri: magnetUri || `magnet:?xt=urn:btih:${infoHash}`,
        infoHash,
        fileIndex,
        resolution: resolution || 'Auto',
        sizeInBytes: sizeInBytes || 0,
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/admin/titles/:id/media/add error:', err);
    return NextResponse.json({ error: 'Failed to add media source' }, { status: 500 });
  }
}
