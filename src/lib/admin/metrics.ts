import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardMetrics() {
  const [totalMedia, publishedMedia, pendingTorrents, activeUsers] = await Promise.all([
    prisma.media.count(),
    prisma.media.count({ where: { isPublished: true } }),
    prisma.media.count({ where: { torrents: { none: {} } } }), // using the implicit M-to-M or 1-to-M relation length
    prisma.userPresence.count({ where: { state: 'ONLINE' } })
  ]);

  return {
    totalTitles: totalMedia,
    published: publishedMedia,
    pendingTorrents,
    activeUsers
  };
}
