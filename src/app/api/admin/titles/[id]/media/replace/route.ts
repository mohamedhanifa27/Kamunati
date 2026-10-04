import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { infoHash, fileIndex, name } = body;
    
    if (!infoHash || fileIndex === undefined) {
      return NextResponse.json({ error: 'Missing infoHash or fileIndex' }, { status: 400 });
    }

    // Wrap in transaction as required by spec (impact preview -> apply mapper)
    await prisma.$transaction(async (tx) => {
      // Create or update Torrent
      const torrent = await tx.torrent.upsert({
        where: { infoHash },
        update: { name, status: 'READY' }, // naive status for mock
        create: { infoHash, name, status: 'READY', source: 'ADMIN' }
      });
      
      // Upsert MediaAsset mapping
      await tx.mediaAsset.upsert({
        where: { mediaId: params.id },
        update: {
          torrentId: torrent.id,
          fileIndex,
          status: 'READY'
        },
        create: {
          id: `asset-${params.id}`,
          mediaId: params.id,
          torrentId: torrent.id,
          fileIndex,
          type: 'MOVIE',
          status: 'READY'
        }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/admin/titles/:id/media/replace error:', err);
    return NextResponse.json({ error: 'Failed to replace media' }, { status: 500 });
  }
}
