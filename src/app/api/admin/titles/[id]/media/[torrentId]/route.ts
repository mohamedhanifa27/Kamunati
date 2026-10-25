import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request, props: { params: Promise<{ id: string, torrentId: string }> }) {
  try {
    const params = await props.params;
    
    // Verify source belongs to this media before deleting
    const source = await prisma.torrentSource.findUnique({
      where: { id: params.torrentId }
    });

    if (!source || (source.mediaId !== params.id && !source.episodeId)) {
      return NextResponse.json({ error: 'Torrent source not found on this media' }, { status: 404 });
    }

    await prisma.torrentSource.delete({
      where: { id: params.torrentId }
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/titles/:id/media/:torrentId error:', err);
    return NextResponse.json({ error: 'Failed to delete media source' }, { status: 500 });
  }
}
