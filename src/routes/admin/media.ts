import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/auth';
import { importTmdbSchema, manualMediaSchema, updateMediaSchema } from '../../validators/mediaSchema';
import { fetchDetails, fetchSeriesStructure, getImageUrl } from '../../services/tmdbService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function adminMediaRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.post('/api/v1/admin/media/import-tmdb', async (request, reply) => {
    const parsed = importTmdbSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { tmdbId, type, isPublished } = parsed.data;

    try {
      const tmdbData = await fetchDetails(tmdbId, type);
      
      const media = await prisma.$transaction(async (tx) => {
        let releaseYear = null;
        const dateStr = tmdbData.release_date || tmdbData.first_air_date;
        if (dateStr) {
          releaseYear = new Date(dateStr).getFullYear();
        }

        const genres = tmdbData.genres ? tmdbData.genres.map((g: any) => g.name) : [];
        const slug = (tmdbData.title || tmdbData.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + tmdbId;

        const newMedia = await tx.media.create({
          data: {
            tmdbId,
            imdbId: tmdbData.imdb_id,
            title: tmdbData.title || tmdbData.name,
            originalTitle: tmdbData.original_title || tmdbData.original_name,
            type,
            slug,
            overview: tmdbData.overview,
            tagline: tmdbData.tagline,
            posterPath: getImageUrl(tmdbData.poster_path),
            backdropPath: getImageUrl(tmdbData.backdrop_path),
            releaseYear,
            runtime: tmdbData.runtime || (tmdbData.episode_run_time ? tmdbData.episode_run_time[0] : null),
            rating: tmdbData.vote_average,
            voteCount: tmdbData.vote_count,
            genres: JSON.stringify(genres),
            isPublished,
          }
        });

        if (type === 'SERIES' && tmdbData.number_of_seasons) {
          const seasons = await fetchSeriesStructure(tmdbId, tmdbData.number_of_seasons);
          
          for (const s of seasons) {
            if (s.season_number === 0) continue; // skip specials for now
            
            const season = await tx.season.create({
              data: {
                mediaId: newMedia.id,
                seasonNumber: s.season_number,
                name: s.name,
                overview: s.overview,
                posterPath: getImageUrl(s.poster_path),
                airDate: s.air_date ? new Date(s.air_date) : null
              }
            });

            if (s.episodes && s.episodes.length > 0) {
              const episodesData = s.episodes.map((ep: any) => ({
                seasonId: season.id,
                episodeNumber: ep.episode_number,
                title: ep.name,
                overview: ep.overview,
                stillPath: getImageUrl(ep.still_path),
                airDate: ep.air_date ? new Date(ep.air_date) : null,
                duration: ep.runtime
              }));
              
              await tx.episode.createMany({
                data: episodesData
              });
            }
          }
        }
        
        return newMedia;
      });

      return reply.status(201).send(media);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to import from TMDB', details: err.message });
    }
  });

  fastify.post('/api/v1/admin/media', async (request, reply) => {
    const parsed = manualMediaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    
    const data = {
        ...parsed.data,
        genres: JSON.stringify(parsed.data.genres || [])
    };
    
    const media = await prisma.media.create({ data });
    return reply.status(201).send(media);
  });

  fastify.patch('/api/v1/admin/media/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateMediaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    
    const updateData: any = { ...parsed.data };
    if (parsed.data.genres) {
        updateData.genres = JSON.stringify(parsed.data.genres);
    }

    const media = await prisma.media.update({
      where: { id },
      data: updateData
    });

    return reply.send(media);
  });

  fastify.delete('/api/v1/admin/media/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.media.delete({ where: { id } });
    return reply.status(204).send();
  });
}
