// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { FastifyInstance } from 'fastify';
import { inspectTorrent } from '../engine/torrentEngine';

export default async function inspectRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/torrent/inspect', async (request, reply) => {
    const { magnet } = request.query as { magnet?: string };

    if (!magnet) {
      reply.status(400).send({ error: 'Missing magnet query parameter.' });
      return;
    }

    // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Validate magnet URI format or valid infoHash
    const isCleanMagnet = magnet.startsWith('magnet:?xt=urn:btih:') && !magnet.includes('\0');
    const isCleanHash = /^[a-fA-F0-9]{40}$/.test(magnet) || /^[a-zA-Z2-7]{32}$/.test(magnet);
    if (!isCleanMagnet && !isCleanHash) {
      reply.status(400).send({ error: 'Invalid magnet or infoHash parameter format.' });
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
