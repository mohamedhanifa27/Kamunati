import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import VideoPlayer from '../../../../components/player/VideoPlayer';

const prisma = new PrismaClient();

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const media = await prisma.media.findUnique({
    where: { id }
  });

  if (!media || !media.infoHash) {
    return notFound();
  }

  // Construct the stream URL for the backend engine
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const streamUrl = `${apiUrl}/api/v1/stream/${media.infoHash}?fileIndex=${media.fileIndex || 0}`;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <VideoPlayer 
        mediaId={media.id}
        title={media.title}
        src={streamUrl}
        infoHash={media.infoHash}
      />
    </div>
  );
}
