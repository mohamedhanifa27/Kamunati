import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import VideoPlayer from '../../../components/player/VideoPlayer';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const media = await prisma.media.findUnique({
    where: { id },
    include: { torrents: true }
  });

  if (!media || !media.torrents || media.torrents.length === 0) {
    return notFound();
  }

  const torrent = media.torrents[0];

  // Construct the stream URL for the backend engine
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const streamUrl = `${apiUrl}/api/v1/stream/${torrent.infoHash}?fileIndex=${torrent.fileIndex || 0}`;

  return (
    <div className="w-screen h-screen bg-bg overflow-hidden relative">
      <VideoPlayer 
        mediaId={media.id}
        title={media.title}
        src={streamUrl}
        infoHash={torrent.infoHash}
      />
    </div>
  );
}
