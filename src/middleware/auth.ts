import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

interface JwtPayload {
  userId: string;
  role: 'ADMIN' | 'USER';
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (request as any).user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  
  if (reply.sent) return;

  const user = (request as any).user as JwtPayload;
  if (user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden: Admin access required' });
  }
}
