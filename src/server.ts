import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import streamRoutes from './routes/stream';
import inspectRoutes from './routes/inspect';
import statsRoutes from './routes/stats';
import { startCacheCleaner } from './engine/cacheCleaner';

const server = fastify({
  logger: true
});

const start = async () => {
  try {
    await server.register(cors, {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
    });

    await server.register(streamRoutes);
    await server.register(inspectRoutes);
    await server.register(statsRoutes);

    // Initialize automatic 24-hour cache cleaner
    const cacheCleaner = startCacheCleaner({
      logger: server.log
    });

    server.addHook('onClose', (_instance, done) => {
      cacheCleaner.stop();
      done();
    });

    const port = (process.env.PORT || process.env.Port) ? parseInt((process.env.PORT || process.env.Port)!, 10) : 8080;
    
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
