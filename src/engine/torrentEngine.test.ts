import { describe, it, expect, vi } from 'vitest';
import { getEngine } from './torrentEngine';

// Mock torrent-stream
vi.mock('torrent-stream', () => {
  return {
    default: vi.fn((magnetUri) => {
      const engineMock = {
        on: vi.fn((event, cb) => {
          if (event === 'ready') {
            setTimeout(() => cb(), 10);
          }
        }),
        files: [{ name: 'movie.mp4', length: 5000 }],
        destroy: vi.fn(),
        infoHash: 'dummyhash123',
        torrent: { pieceLength: 1024, length: 5000 },
        select: vi.fn(),
        swarm: { downloaded: 1024, downloadSpeed: () => 10, wires: [] }
      };
      return engineMock;
    })
  };
});

describe('Torrent Engine (torrent-stream)', () => {
  it('should initialize and resolve a torrent-stream engine', async () => {
    const engine = await getEngine('magnet:?xt=urn:btih:dummyhash123');
    expect(engine).toBeDefined();
    expect(engine.files).toHaveLength(1);
    expect(engine.files[0].name).toBe('movie.mp4');
  });

  it('should reuse the same engine instance for the same infoHash', async () => {
    const engine1 = await getEngine('magnet:?xt=urn:btih:singletonhash');
    const engine2 = await getEngine('magnet:?xt=urn:btih:singletonhash');
    expect(engine1).toBe(engine2);
  });
});
