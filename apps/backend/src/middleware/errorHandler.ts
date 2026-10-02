import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    
    // Log the error for internal tracing (avoid logging raw payloads in prod for privacy)
    request.log.error({ err: error, path: request.url }, error.message);

    // Zod Validation Errors
    if (error instanceof ZodError || error.code === 'FST_ERR_VALIDATION') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload format',
          details: error instanceof ZodError ? error.errors : error.message
        }
      });
    }

    // Prisma Specific Database Errors
    if (error.code && typeof error.code === 'string' && error.code.startsWith('P2')) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: 'A record with this unique attribute already exists.',
            details: (error as any).meta
          }
        });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'The requested database record does not exist.'
          }
        });
      }
      return reply.status(400).send({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred during the transaction.',
          details: (error as any).meta
        }
      });
    }

    // Fastify built-in errors (e.g. Rate Limit Exceeded, Payload Too Large)
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code || 'HTTP_ERROR',
          message: error.message
        }
      });
    }

    // Fallback unhandled server error
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred.'
      }
    });
  });
}
