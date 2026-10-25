import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'next-view-transitions';

import MediaEditor from '../../../../components/admin/MediaEditor';
import TMDBImportModalWrapper from './TMDBImportModalWrapper';

const prisma = new PrismaClient();

export default async function EditMediaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isNew = params.id === 'new';

  let mediaData = null;

  if (!isNew) {
    mediaData = await prisma.media.findUnique({
      where: { id: params.id },
      include: { torrents: true }
    });

    if (!mediaData) {
      notFound();
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/media" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{isNew ? 'Create New Media' : 'Edit Media Profile'}</h1>
            <p className="text-white/40 text-sm mt-1">Manage metadata, artwork, seasons, and playback sources.</p>
          </div>
        </div>
        
        {isNew && <TMDBImportModalWrapper />}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {isNew ? (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-12 text-center shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-xl font-medium text-white mb-2">Start by importing from TMDB</h3>
            <p className="text-white/50 mb-6 max-w-md">Search for a movie or TV show to automatically pull the title, overview, poster, and background art.</p>
            {/* The wrapper handles the button rendering too for simplicity, or we can just render it */}
            <TMDBImportModalWrapper isButton />
          </div>
        ) : (
          <MediaEditor initialData={mediaData} />
        )}
      </div>
    </div>
  );
}
