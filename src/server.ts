import fastify from 'fastify';
import cors from '@fastify/cors';
import streamRoutes from './routes/stream';
import inspectRoutes from './routes/inspect';

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

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
