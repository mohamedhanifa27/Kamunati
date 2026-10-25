import React from 'react';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { PlayIcon, PlusIcon, CheckIcon, StarIcon } from 'lucide-react';
import MediaRow from '../../../components/browse/MediaRow';
import { ReviewsSection } from '../../../components/title/ReviewsSection';

const prisma = new PrismaClient();

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const media = await prisma.media.findUnique({
    where: { id },
  });

  if (!media) {
    return notFound();
  }

  // Get similar for "More like this"
  const similar = await prisma.media.findMany({
    where: {
      isPublished: true,
      category: media.category,
      id: { not: media.id }
    },
    take: 10
  });

  const similarMapped = similar.map((m: any) => {
    let ambientPalette;
    try {
      if (typeof m.ambientPalette === 'string') ambientPalette = JSON.parse(m.ambientPalette);
      else ambientPalette = m.ambientPalette;
    } catch(e) {}
    return {
      id: m.id,
      title: m.title,
      posterUrl: m.posterPath || m.backdropPath || '/logo.svg',
      backdropUrl: m.backdropPath || m.posterPath,
      category: m.category,
      releaseYear: m.releaseYear,
      ambientPalette
    }
  });

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] w-full">
        <div className="absolute inset-0">
          <img 
            src={media.backdropPath || media.posterPath || '/logo.svg'}
            alt={media.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-end px-8 md:px-16 pb-12">
          {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
          {/* Title: render media title logo if available, fallback to title heading */}
          {media.logoPath ? (
            <div className="mb-4 max-w-sm md:max-w-md">
              <img 
                src={media.logoPath} 
                alt={media.title} 
                className="max-h-24 md:max-h-36 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]" 
              />
            </div>
          ) : (
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">{media.title}</h1>
          )}
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-300 mb-6">
            <span>{media.releaseYear}</span>
            <span>{media.category?.replace('_', ' ')}</span>
            {media.rating && <span>{media.rating}</span>}
            {media.runtime && <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>}
          </div>
          {/* [RECTIFICATION:PIXEL_FONT_DESCRIPTION_AND_TITLE_LOGO] */}
          {/* Description: render overview with pixel font */}
          {media.overview && (
            <p className="max-w-2xl text-base md:text-lg text-neutral-200 mb-8 line-clamp-3 font-pixelcode tracking-wide leading-relaxed">
              {media.overview}
            </p>
          )}
          <div className="flex items-center gap-4">
            <Link 
              href={`/watch/${media.id}`}
              className="flex items-center justify-center bg-white text-black font-bold py-3 px-8 rounded-md hover:bg-neutral-200 transition-colors"
            >
              <PlayIcon size={20} className="mr-2" fill="currentColor" /> Play
            </Link>
            <button className="flex items-center justify-center bg-white/20 text-white font-bold py-3 px-4 rounded-md hover:bg-white/30 transition-colors">
              <PlusIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-16 space-y-12">
        {/* More Like This */}
        {similarMapped.length > 0 && (
          <div>
            <MediaRow title="More Like This" items={similarMapped} />
          </div>
        )}

        {/* Reviews Section */}
        <div className="max-w-5xl">
          <ReviewsSection mediaId={media.id} />
        </div>
      </div>
    </div>
  );
}
