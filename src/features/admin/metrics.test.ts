import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getDashboardMetrics } from '../../lib/admin/metrics';

const prisma = new PrismaClient();

describe('Admin Dashboard Metrics Integrity', () => {
  beforeAll(async () => {
    // Clear out test state
    await prisma.media.deleteMany({});
    await prisma.userPresence.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('accurately reflects database state exactly', async () => {
    // 1. Initial State
    let metrics = await getDashboardMetrics();
    expect(metrics.totalTitles).toBe(0);
    expect(metrics.published).toBe(0);
    expect(metrics.pendingTorrents).toBe(0);
    expect(metrics.activeUsers).toBe(0);

    // 2. Add Media
    const m1 = await prisma.media.create({
      data: {
        title: 'Integrity Test Movie',
        type: 'MOVIE',
        slug: 'integrity-test-movie',
        genres: '[]',
        isPublished: false
      }
    });

    metrics = await getDashboardMetrics();
    expect(metrics.totalTitles).toBe(1);
    expect(metrics.published).toBe(0);
    expect(metrics.pendingTorrents).toBe(1); // 0 torrents -> pending

    // 3. Toggle Live
    await prisma.media.update({
      where: { id: m1.id },
      data: { isPublished: true }
    });

    metrics = await getDashboardMetrics();
    expect(metrics.published).toBe(1);

    // 4. Link a Torrent
    await prisma.torrentSource.create({
      data: {
        id: 't-123',
        media: { connect: { id: m1.id } },
        
        
        title: 'Movie.1080p',
        magnetUri: 'magnet:?xt=urn:btih:AABBCCDDEEFF11223344',
        infoHash: 'AABBCCDDEEFF11223344',
        fileIndex: 0,
        resolution: '1080p',
        sizeInBytes: 1024
      }
    });

    metrics = await getDashboardMetrics();
    expect(metrics.pendingTorrents).toBe(0);

    // 5. User Heartbeat (Active User)
    const user = await prisma.user.create({
      data: { email: 'integrity@test.com', passwordHash: 'hash', role: 'USER',  }
    });
    
    await prisma.userPresence.create({
      data: {
        userId: user.id,
        state: 'ONLINE',
        lastHeartbeatAt: new Date(),
        lastSeenAt: new Date()
      }
    });

    metrics = await getDashboardMetrics();
    expect(metrics.activeUsers).toBe(1);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  });
});






