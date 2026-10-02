import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';

export async function setupSecurity(app: FastifyInstance) {
  // Helmet for secure HTTP headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Essential for MSE video playback and external subtitle blobs
    crossOriginEmbedderPolicy: false
  });

  // Strict CORS Configuration
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range']
  });

  // Global Rate Limiting
  await app.register(fastifyRateLimit, {
    max: 100, // 100 requests per minute globally per IP
    timeWindow: '1 minute',
    errorResponseBuilder: (req, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please try again later. Limit: ${context.max}, TTL: ${context.ttl}ms`
      }
    })
  });

  // Note: For specific heavy routes (like TMDB imports or Inspector), 
  // you apply `config: { rateLimit: { max: 10, timeWindow: '1 minute' } }`
  // directly in the route declaration in Fastify.
}
