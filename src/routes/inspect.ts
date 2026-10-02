import { FastifyInstance } from 'fastify';
import { inspectTorrent } from '../engine/torrentEngine';

export default async function inspectRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/torrent/inspect', async (request, reply) => {
    const { magnet } = request.query as { magnet?: string };

    if (!magnet) {
      reply.status(400).send({ error: 'Missing magnet query parameter.' });
      return;
    }

    try {
      const metadata = await inspectTorrent(magnet);
      return reply.send(metadata);
    } catch (err: any) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Failed to inspect torrent', details: err.message });
    }
  });
}
