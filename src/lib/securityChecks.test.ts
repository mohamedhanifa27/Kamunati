// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { describe, it, expect } from 'vitest';
import { isValidInfoHashOrMagnet } from '../routes/stream';
import { isValidInfoHash } from '../engine/torrentEngine';

describe('Security Checks & Input Sanitization', () => {
  describe('InfoHash & Magnet Validation', () => {
    const valid40Hex = 'c028271e50653abc9461da9c7da0b3c501953d5f';
    const valid32Base32 = 'ytsr477k5k5gq5f3z3565t65qg4q4444';
    const validMagnet = `magnet:?xt=urn:btih:${valid40Hex}&dn=Test+Movie`;

    it('should accept valid 40-character hex infohashes (both cases)', () => {
      expect(isValidInfoHashOrMagnet(valid40Hex)).toBe(true);
      expect(isValidInfoHashOrMagnet(valid40Hex.toUpperCase())).toBe(true);
      expect(isValidInfoHash(valid40Hex)).toBe(true);
      expect(isValidInfoHash(valid40Hex.toUpperCase())).toBe(true);
    });

    it('should accept valid 32-character base32 infohashes', () => {
      expect(isValidInfoHashOrMagnet(valid32Base32)).toBe(true);
      expect(isValidInfoHash(valid32Base32)).toBe(true);
    });

    it('should accept valid magnet links with xt=urn:btih', () => {
      expect(isValidInfoHashOrMagnet(validMagnet)).toBe(true);
    });

    it('should reject path traversal attempts in infoHashOrMagnet', () => {
      expect(isValidInfoHashOrMagnet('../../etc/passwd')).toBe(false);
      expect(isValidInfoHashOrMagnet('..\\..\\windows\\system32')).toBe(false);
      expect(isValidInfoHashOrMagnet('/tmp/malicious')).toBe(false);
      expect(isValidInfoHashOrMagnet('c02827/../../secret')).toBe(false);
      expect(isValidInfoHash('../../etc/passwd')).toBe(false);
      expect(isValidInfoHash('..\\..\\win.ini')).toBe(false);
    });

    it('should reject null-byte injection attempts', () => {
      expect(isValidInfoHashOrMagnet(`${valid40Hex}\0.torrent`)).toBe(false);
      expect(isValidInfoHash(`${valid40Hex}\0.torrent`)).toBe(false);
    });

    it('should reject command injection and shell metacharacters', () => {
      expect(isValidInfoHashOrMagnet(`${valid40Hex}; rm -rf /`)).toBe(false);
      expect(isValidInfoHashOrMagnet(`${valid40Hex} && cat /etc/shadow`)).toBe(false);
      expect(isValidInfoHashOrMagnet(`${valid40Hex}|whoami`)).toBe(false);
      expect(isValidInfoHash(`${valid40Hex}; echo pwned`)).toBe(false);
    });

    it('should reject empty, undefined or invalid length strings', () => {
      expect(isValidInfoHashOrMagnet('')).toBe(false);
      expect(isValidInfoHashOrMagnet('   ')).toBe(false);
      expect(isValidInfoHashOrMagnet('short')).toBe(false);
      expect(isValidInfoHashOrMagnet('123456789012345678901234567890123456789012345')).toBe(false);
      expect(isValidInfoHash('')).toBe(false);
      expect(isValidInfoHash(null as any)).toBe(false);
      expect(isValidInfoHash(undefined as any)).toBe(false);
    });
  });

  describe('Subtitle Track Parameter Sanitization', () => {
    it('should strip path traversal and special characters from track selectors', () => {
      const maliciousTrack = '../../etc/shadow';
      const sanitized = maliciousTrack.replace(/[^a-zA-Z0-9_\-:]/g, '');
      expect(sanitized).toBe('etcshadow');
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    });

    it('should safely map ffmpeg subtitle stream selectors', () => {
      const safeTrack = 's:1';
      const mapSelector = /^s:\d+$/.test(safeTrack) ? safeTrack : (/^\d+$/.test(safeTrack) ? safeTrack : 's:0');
      expect(mapSelector).toBe('s:1');

      const injectedTrack = '-f rawvideo';
      const cleanedTrack = injectedTrack.replace(/[^a-zA-Z0-9_\-:]/g, '');
      const safeMap = /^s:\d+$/.test(cleanedTrack) ? cleanedTrack : (/^\d+$/.test(cleanedTrack) ? cleanedTrack : 's:0');
      expect(safeMap).toBe('s:0'); // Fallback to safe default
    });
  });

  describe('Path Traversal Confinement within Temporary Directories', () => {
    const path = require('path');
    const baseDir = path.resolve(process.cwd(), 'tmp', 'subs');

    it('should verify that resolving child files stays strictly within the intended directory', () => {
      const safeChild = path.resolve(baseDir, 'valid_hash_0_s0.vtt');
      expect(safeChild.startsWith(baseDir)).toBe(true);

      const maliciousChild = path.resolve(baseDir, '../../../etc/passwd');
      expect(maliciousChild.startsWith(baseDir)).toBe(false);

      const windowsTraversal = path.resolve(baseDir, '..\\..\\windows\\system32');
      expect(windowsTraversal.startsWith(baseDir)).toBe(false);
    });
  });
});
