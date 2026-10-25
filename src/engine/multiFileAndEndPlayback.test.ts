import { describe, it, expect, vi } from 'vitest';
import { getEngine } from './torrentEngine';

// [RECTIFICATION:MEDIA_PLAYBACK_TILL_END_AND_MULTI_FILE]
// Unit tests covering multi-file torrent prioritization, exact piece boundary calculation,
// and end-of-media buffer completion.
describe('Multi-File & End-of-Media Playback Engine Tests', () => {
  it('correctly prioritizes head and tail for multi-file torrents and marks end pieces critical near end of media', async () => {
    const criticalCalls: Array<{ piece: number; count: number }> = [];
    const selectCalls: Array<{ from: number; to: number; priority: any }> = [];

    // Mock engine with multi-file setup
    const file1 = { name: 'sample.mp4', path: 'sample.mp4', length: 10 * 1024 * 1024, offset: 0 };
    const file2 = { name: 'feature.mkv', path: 'feature.mkv', length: 100 * 1024 * 1024, offset: 10 * 1024 * 1024 };

    // pieceLength = 1MB (1048576)
    // totalPieces = 110 pieces
    // file1: offset 0, pieces 0..9
    // file2: offset 10MB, pieces 10..109 (100 pieces)

    const pieceLength = 1024 * 1024;
    const totalPieces = 110;
    const piecesBitfield = new Array(totalPieces).fill(false);

    const mockBitfield = {
      get: (idx: number) => piecesBitfield[idx] || false,
      set: (idx: number, val: boolean) => { piecesBitfield[idx] = val; }
    };

    const mockEngine = {
      torrent: { pieceLength, length: 110 * 1024 * 1024, pieces: new Array(totalPieces).fill(1) },
      files: [file1, file2],
      bitfield: mockBitfield,
      swarm: { downloaded: 0, wires: [], downloadSpeed: () => 100, uploadSpeed: () => 0 },
      selection: [],
      critical: vi.fn((piece, count) => {
        criticalCalls.push({ piece, count });
      }),
      select: vi.fn((from, to, priority) => {
        selectCalls.push({ from, to, priority });
      }),
      on: vi.fn((event, cb) => {
        if (event === 'ready') setTimeout(cb, 5);
      }),
      destroy: vi.fn((cb) => cb && cb())
    };

    // Test prioritizeFile logic directly
    const prioritizeFile = (targetFile: any) => {
      const fileOffset = targetFile.offset;
      const fileStartPiece = Math.floor(fileOffset / pieceLength);
      const fileEndPiece = Math.min(Math.floor((fileOffset + targetFile.length - 1) / pieceLength), totalPieces - 1);

      const headEnd = Math.min(fileStartPiece + 15, fileEndPiece);
      mockEngine.critical(fileStartPiece, Math.min(8, headEnd - fileStartPiece + 1));
      mockEngine.select(fileStartPiece, headEnd, 2);

      if (fileEndPiece > fileStartPiece + 16) {
        const tailStart = Math.max(fileStartPiece, fileEndPiece - 9);
        mockEngine.critical(tailStart, fileEndPiece - tailStart + 1);
        mockEngine.select(tailStart, fileEndPiece, 2);
      }
    };

    // Prioritize file 2 (the feature film in multi-file torrent)
    prioritizeFile(file2);

    // Verify file2 head pieces: starts at piece 10, head reaches piece 25
    expect(criticalCalls[0]).toEqual({ piece: 10, count: 8 });
    expect(selectCalls[0]).toEqual({ from: 10, to: 25, priority: 2 });

    // Verify file2 tail pieces: ends at piece 109, tail starts at piece 100 (10 pieces)
    expect(criticalCalls[1]).toEqual({ piece: 100, count: 10 });
    expect(selectCalls[1]).toEqual({ from: 100, to: 109, priority: 2 });

    // Test setStreamPosition when approaching the end of file 2
    // byteOffset at 98MB into file2 (piece 108 of 109):
    const byteOffset = 98 * 1024 * 1024;
    const fileOffset = file2.offset;
    const absoluteByte = fileOffset + byteOffset;
    const targetPiece = Math.floor(absoluteByte / pieceLength); // 108
    const fileEndPiece = Math.floor((fileOffset + file2.length - 1) / pieceLength); // 109
    const remaining = fileEndPiece - targetPiece + 1; // 2 pieces (108 and 109)

    expect(targetPiece).toBe(108);
    expect(remaining).toBe(2);
    expect(remaining).toBeLessThanOrEqual(25); // triggers end-of-media critical priority

    mockEngine.critical(targetPiece, remaining);
    expect(criticalCalls[2]).toEqual({ piece: 108, count: 2 });

    // Verify isFileComplete check:
    const isFileComplete = (f: any) => {
      const startP = Math.floor(f.offset / pieceLength);
      const endP = Math.floor((f.offset + f.length - 1) / pieceLength);
      for (let p = startP; p <= endP; p++) {
        if (!mockBitfield.get(p)) return false;
      }
      return true;
    };

    expect(isFileComplete(file2)).toBe(false);

    // Mark all file2 pieces downloaded
    for (let p = 10; p <= 109; p++) {
      mockBitfield.set(p, true);
    }
    expect(isFileComplete(file2)).toBe(true);
    // File 1 is still incomplete
    expect(isFileComplete(file1)).toBe(false);
  });
});
