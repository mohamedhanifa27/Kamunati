import { FastifyInstance } from 'fastify';
import { getEngine } from '../engine/torrentEngine';
import { needsTranscoding, streamTranscoded } from '../engine/transcoder';
import mime from 'mime-types';

export default async function streamRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/stream/:infoHashOrMagnet', async (request, reply) => {
    const { infoHashOrMagnet } = request.params as { infoHashOrMagnet: string };
    const rangeHeader = request.headers.range;

    try {
      const engine = await getEngine(infoHashOrMagnet);
      const file = engine.getPrimaryFile();

      if (!file) {
        reply.status(404).send({ error: 'No suitable media file found in torrent.' });
        return;
      }

      const fileSize = file.length;
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';

      if (needsTranscoding(file.name)) {
        reply.status(200);
        engine.setStreamPosition(0, file);
        const stream = file.createReadStream();
        const ffStream = streamTranscoded(stream, reply);
        return reply.send(ffStream);
      }

      if (!rangeHeader) {
        reply.status(200);
        reply.header('Accept-Ranges', 'bytes');
        reply.header('Content-Length', fileSize);
        reply.header('Content-Type', mimeType);

        engine.setStreamPosition(0, file);
        const stream = file.createReadStream();
        
        reply.raw.on('close', () => {
           (stream as any).destroy();
        });
        
        return reply.send(stream);
      }

      const positions = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(positions[0], 10);
      const end = positions[1] ? parseInt(positions[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      reply.status(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Length', chunksize);
      reply.header('Content-Type', mimeType);

      engine.setStreamPosition(start, file);

      const stream = file.createReadStream({ start, end });
      
      reply.raw.on('close', () => {
         (stream as any).destroy();
      });

      return reply.send(stream);
    } catch (err: any) {
      fastify.log.error(err);
      reply.status(500).send({ error: 'Failed to stream media', details: err.message });
    }
  });
}
