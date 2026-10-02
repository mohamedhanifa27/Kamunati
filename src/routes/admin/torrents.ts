import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/auth';
import { torrentAttachSchema } from '../../validators/mediaSchema';
import { PrismaClient } from '@prisma/client';
import { inspectTorrent } from '../../engine/torrentEngine';

const prisma = new PrismaClient();

export default async function adminTorrentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.post('/api/v1/admin/torrents/attach', async (request, reply) => {
    const parsed = torrentAttachSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { mediaId, episodeId, magnetUri, fileIndex, resolution, ...rest } = parsed.data;

    try {
      // Validate with torrent-stream engine if possible
      const match = magnetUri.match(/xt=urn:btih:([a-zA-Z0-9]+)/);
      if (!match) {
        return reply.status(400).send({ error: 'Invalid magnet URI' });
      }
      const infoHash = match[1].toLowerCase();

      // Check existence
      if (mediaId) {
        const media = await prisma.media.findUnique({ where: { id: mediaId } });
        if (!media) return reply.status(404).send({ error: 'Media not found' });
      } else if (episodeId) {
        const episode = await prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode) return reply.status(404).send({ error: 'Episode not found' });
      }

      const torrentSource = await prisma.torrentSource.create({
        data: {
          mediaId,
          episodeId,
          magnetUri,
          infoHash,
          fileIndex,
          resolution,
          ...rest
        }
      });

      return reply.status(201).send(torrentSource);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to attach torrent', details: err.message });
    }
  });

  fastify.get('/api/v1/admin/torrents/verify/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const torrentSource = await prisma.torrentSource.findUnique({ where: { id } });
    if (!torrentSource) {
      return reply.status(404).send({ error: 'Torrent Source not found' });
    }

    try {
      // Use inspectTorrent to hit the DHT and verify health
      const metadata = await inspectTorrent(torrentSource.magnetUri);
      
      const updated = await prisma.torrentSource.update({
        where: { id },
        data: {
          lastCheckedAt: new Date()
        }
      });

      return reply.send({ success: true, metadata, updated });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to verify torrent health', details: err.message });
    }
  });
}
