import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { mergeMedia } from '@/lib/mediaMerge';

const prisma = new PrismaClient();

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    
    // Convert releaseYear to int if provided
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.originalTitle !== undefined) updateData.originalTitle = body.originalTitle;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.hoverTagline !== undefined) updateData.hoverTagline = body.hoverTagline;
    if (body.overview !== undefined) updateData.overview = body.overview;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.releaseYear !== undefined) {
      const parsed = parseInt(body.releaseYear);
      updateData.releaseYear = isNaN(parsed) ? null : parsed;
    }
    if (body.runtime !== undefined) {
      const parsed = parseInt(body.runtime);
      updateData.runtime = isNaN(parsed) ? null : parsed;
    }
    if (body.logoPath !== undefined) updateData.logoPath = body.logoPath;
    if (body.tmdbId !== undefined) {
      const parsed = parseInt(body.tmdbId);
      updateData.tmdbId = isNaN(parsed) ? null : parsed;
    }
    if (body.imdbId !== undefined) updateData.imdbId = body.imdbId;
    if (body.posterPath !== undefined) updateData.posterPath = body.posterPath;
    if (body.backdropPath !== undefined) updateData.backdropPath = body.backdropPath;
    const validateJsonArray = (val: any) => {
      if (Array.isArray(val)) return JSON.stringify(val);
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? val : JSON.stringify([]);
        } catch {
          return JSON.stringify([]);
        }
      }
      return JSON.stringify([]);
    };

    if (body.genres !== undefined) updateData.genres = validateJsonArray(body.genres);
    if (body.cast !== undefined) updateData.cast = validateJsonArray(body.cast);
    if (body.directors !== undefined) updateData.directors = validateJsonArray(body.directors);
    if (body.tmdbReviews !== undefined) updateData.tmdbReviews = body.tmdbReviews;
    if (body.maturityRating !== undefined) updateData.maturityRating = body.maturityRating;
    if (body.rating !== undefined) {
      const parsed = parseFloat(body.rating);
      updateData.rating = isNaN(parsed) ? null : parsed;
    }
    if (body.voteCount !== undefined) {
      const parsed = parseInt(body.voteCount);
      updateData.voteCount = isNaN(parsed) ? null : parsed;
    }
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;

    // Check if the assigned TMDB ID already exists on another media entry
    if (updateData.tmdbId) {
      const existingWithTmdb = await prisma.media.findUnique({
        where: { tmdbId: updateData.tmdbId }
      });

      if (existingWithTmdb && existingWithTmdb.id !== params.id) {
        // Automatically merge current media's torrents/seasons/episodes into the existing media!
        const mergeRes = await mergeMedia(params.id, existingWithTmdb.id, prisma);
        if (!mergeRes.success) {
          return NextResponse.json({ error: mergeRes.error || 'Failed to merge media with same TMDB ID' }, { status: 500 });
        }

        // Apply any updated metadata to the existing target media
        const updatedTarget = await prisma.media.update({
          where: { id: existingWithTmdb.id },
          data: updateData
        });

        return NextResponse.json({
          ...updatedTarget,
          merged: true,
          targetId: existingWithTmdb.id,
          sourceId: params.id,
          movedTorrentsCount: mergeRes.movedTorrentsCount,
          sourceTitle: mergeRes.sourceTitle,
          targetTitle: mergeRes.targetTitle,
          message: `Merged torrents into "${existingWithTmdb.title}" (TMDB ID: ${updateData.tmdbId})`
        });
      }
    }

    const updated = await prisma.media.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/admin/titles/:id error:', err);
    return NextResponse.json({ error: 'Failed to update title metadata' }, { status: 500 });
  }
}
