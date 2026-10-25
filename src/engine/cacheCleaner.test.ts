import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { cleanCache, startCacheCleaner } from './cacheCleaner';
import * as torrentEngine from './torrentEngine';

describe('Cache Cleaner', () => {
  let testTmpDir: string;

  beforeEach(() => {
    testTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kamunati-cleaner-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    } catch {}
    vi.restoreAllMocks();
  });

  it('should delete directories older than maxAgeMs and keep newer ones', () => {
    const torrentDir = path.join(testTmpDir, 'torrent-stream');
    fs.mkdirSync(torrentDir, { recursive: true });

    // Old folder (> 24 hours ago)
    const oldDir = path.join(torrentDir, 'oldhash123');
    fs.mkdirSync(oldDir);
    const oldFile = path.join(oldDir, 'video.mp4');
    fs.writeFileSync(oldFile, Buffer.alloc(1024 * 50)); // 50 KB
    const pastTime = (Date.now() - (25 * 60 * 60 * 1000)) / 1000;
    fs.utimesSync(oldFile, pastTime, pastTime);
    fs.utimesSync(oldDir, pastTime, pastTime);

    // New folder (1 hour ago)
    const newDir = path.join(torrentDir, 'newhash456');
    fs.mkdirSync(newDir);
    const newFile = path.join(newDir, 'sample.mkv');
    fs.writeFileSync(newFile, Buffer.alloc(1024 * 20)); // 20 KB
    const recentTime = (Date.now() - (1 * 60 * 60 * 1000)) / 1000;
    fs.utimesSync(newFile, recentTime, recentTime);
    fs.utimesSync(newDir, recentTime, recentTime);

    const result = cleanCache({
      baseDir: testTmpDir,
      maxAgeMs: 24 * 60 * 60 * 1000
    });

    expect(result.deletedDirectories).toBe(1);
    expect(result.freedBytes).toBe(1024 * 50);
    expect(fs.existsSync(oldDir)).toBe(false);
    expect(fs.existsSync(newDir)).toBe(true);
  });

  it('should skip active engine hashes even if they are older than maxAgeMs', () => {
    const torrentDir = path.join(testTmpDir, 'torrent-stream');
    fs.mkdirSync(torrentDir, { recursive: true });

    const activeHash = 'activehash789';
    const activeDir = path.join(torrentDir, activeHash);
    fs.mkdirSync(activeDir);
    const activeFile = path.join(activeDir, 'streaming.mp4');
    fs.writeFileSync(activeFile, Buffer.alloc(1024 * 100));

    // Make it look older than 24 hours
    const pastTime = (Date.now() - (30 * 60 * 60 * 1000)) / 1000;
    fs.utimesSync(activeFile, pastTime, pastTime);
    fs.utimesSync(activeDir, pastTime, pastTime);

    // Mock active engines returning this hash
    vi.spyOn(torrentEngine, 'getActiveEngineHashes').mockReturnValue([activeHash]);

    const result = cleanCache({
      baseDir: testTmpDir,
      maxAgeMs: 24 * 60 * 60 * 1000
    });

    expect(result.skippedActive).toBe(1);
    expect(result.deletedDirectories).toBe(0);
    expect(fs.existsSync(activeDir)).toBe(true);
  });

  it('should delete stale .torrent files and temporary subtitles', () => {
    const torrentDir = path.join(testTmpDir, 'torrent-stream');
    const subsDir = path.join(testTmpDir, 'subs');
    fs.mkdirSync(torrentDir, { recursive: true });
    fs.mkdirSync(subsDir, { recursive: true });

    const staleTorrent = path.join(torrentDir, 'oldmovie.torrent');
    fs.writeFileSync(staleTorrent, 'torrent data');
    const staleSub = path.join(subsDir, 'subtitles.vtt');
    fs.writeFileSync(staleSub, 'WEBVTT');

    const pastTime = (Date.now() - (26 * 60 * 60 * 1000)) / 1000;
    fs.utimesSync(staleTorrent, pastTime, pastTime);
    fs.utimesSync(staleSub, pastTime, pastTime);

    const result = cleanCache({
      baseDir: testTmpDir,
      maxAgeMs: 24 * 60 * 60 * 1000
    });

    expect(result.deletedFiles).toBe(2);
    expect(fs.existsSync(staleTorrent)).toBe(false);
    expect(fs.existsSync(staleSub)).toBe(false);
  });

  it('should start recurring cleaner and allow stopping it', () => {
    const cleaner = startCacheCleaner({
      baseDir: testTmpDir,
      intervalMs: 50000,
      runImmediately: false
    });

    expect(cleaner).toBeDefined();
    expect(typeof cleaner.stop).toBe('function');
    expect(typeof cleaner.cleanNow).toBe('function');

    cleaner.stop();
  });
});
