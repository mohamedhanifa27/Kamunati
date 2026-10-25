// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { FastifyInstance } from 'fastify';
import { getEngine } from '../engine/torrentEngine';

export default async function statsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/torrent/stats/:infoHash', async (request, reply) => {
    const { infoHash } = request.params as { infoHash: string };

    // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Validate infoHash format
    if (!infoHash || (!/^[a-fA-F0-9]{40}$/.test(infoHash) && !/^[a-zA-Z2-7]{32}$/.test(infoHash))) {
      return reply.status(400).send({ error: 'Invalid infoHash parameter' });
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection ping
    reply.raw.write(`:\n\n`);

    try {
      const engine = await getEngine(infoHash);
      
      const interval = setInterval(() => {
        if (!reply.raw.writableEnded) {
          reply.raw.write(`data: ${JSON.stringify(engine.stats)}\n\n`);
        }
      }, 1000);

      request.raw.on('close', () => {
        clearInterval(interval);
      });
    } catch (e: any) {
      if (!reply.raw.writableEnded) {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: e.message || "Engine not found" })}\n\n`);
        reply.raw.end();
      }
    }
  });
}
