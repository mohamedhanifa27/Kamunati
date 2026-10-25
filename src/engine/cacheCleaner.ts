import * as fs from 'fs';
import * as path from 'path';
import { getActiveEngineHashes } from './torrentEngine';

export interface CacheCleanupOptions {
  baseDir?: string;
  maxAgeMs?: number; // Retention period (default: 24 hours)
  intervalMs?: number; // Check frequency (default: 1 hour)
  runImmediately?: boolean;
  logger?: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface CleanupResult {
  freedBytes: number;
  freedHuman: string;
  deletedDirectories: number;
  deletedFiles: number;
  skippedActive: number;
  errors: string[];
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

function getDirectoryLatestMtime(dirPath: string): number {
  let latest = 0;
  try {
    const stat = fs.statSync(dirPath);
    latest = stat.mtimeMs;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          const subLatest = getDirectoryLatestMtime(fullPath);
          if (subLatest > latest) latest = subLatest;
        } else {
          const fileStat = fs.statSync(fullPath);
          if (fileStat.mtimeMs > latest) latest = fileStat.mtimeMs;
        }
      } catch {
        // Skip unreadable subentries
      }
    }
  } catch {
    // Ignore errors for locked/missing directories
  }
  return latest;
}

function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          size += getDirectorySize(fullPath);
        } else {
          const fileStat = fs.statSync(fullPath);
          size += fileStat.size;
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Ignore errors
  }
  return size;
}

/**
 * Runs a single sweep to remove torrent cache files and directories older than maxAgeMs.
 * Active streams currently playing or fetching are guaranteed to be skipped.
 */
export function cleanCache(options?: CacheCleanupOptions): CleanupResult {
  const defaultMaxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
  const envMaxAgeHours = process.env.CACHE_MAX_AGE_HOURS ? parseFloat(process.env.CACHE_MAX_AGE_HOURS) : undefined;
  const maxAgeMs = options?.maxAgeMs ?? (envMaxAgeHours ? envMaxAgeHours * 60 * 60 * 1000 : defaultMaxAgeMs);

  const baseDir = options?.baseDir || path.join(process.cwd(), 'tmp');
  const now = Date.now();
  const activeHashes = new Set(getActiveEngineHashes().map(h => h.toLowerCase()));

  const result: CleanupResult = {
    freedBytes: 0,
    freedHuman: '0 B',
    deletedDirectories: 0,
    deletedFiles: 0,
    skippedActive: 0,
    errors: []
  };

  if (!fs.existsSync(baseDir)) {
    return result;
  }

  // 1. Clean torrent-stream directory
  const torrentDir = path.join(baseDir, 'torrent-stream');
  if (fs.existsSync(torrentDir)) {
    try {
      const entries = fs.readdirSync(torrentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(torrentDir, entry.name);

        if (entry.isDirectory()) {
          const hashCandidate = entry.name.toLowerCase();
          if (activeHashes.has(hashCandidate)) {
            result.skippedActive++;
            continue;
          }

          const latestMtime = getDirectoryLatestMtime(fullPath);
          const ageMs = now - latestMtime;

          if (ageMs >= maxAgeMs) {
            try {
              const dirSize = getDirectorySize(fullPath);
              fs.rmSync(fullPath, { recursive: true, force: true });
              result.freedBytes += dirSize;
              result.deletedDirectories++;
            } catch (err: any) {
              result.errors.push(`Failed to delete dir ${entry.name}: ${err.message}`);
            }
          }
        } else if (entry.isFile()) {
          const isTorrentFile = entry.name.toLowerCase().endsWith('.torrent');
          const hashCandidate = entry.name.replace(/\.torrent$/i, '').toLowerCase();

          if (activeHashes.has(hashCandidate)) {
            result.skippedActive++;
            continue;
          }

          try {
            const stat = fs.statSync(fullPath);
            const ageMs = now - stat.mtimeMs;
            if (ageMs >= maxAgeMs || isTorrentFile) {
              if (ageMs >= maxAgeMs) {
                const fileSize = stat.size;
                fs.unlinkSync(fullPath);
                result.freedBytes += fileSize;
                result.deletedFiles++;
              }
            }
          } catch (err: any) {
            result.errors.push(`Failed to delete file ${entry.name}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      result.errors.push(`Error scanning torrentDir: ${err.message}`);
    }
  }

  // 2. Clean temporary subtitles directory
  const subsDir = path.join(baseDir, 'subs');
  if (fs.existsSync(subsDir)) {
    try {
      const entries = fs.readdirSync(subsDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(subsDir, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          const ageMs = now - stat.mtimeMs;
          if (ageMs >= maxAgeMs) {
            if (entry.isDirectory()) {
              const dirSize = getDirectorySize(fullPath);
              fs.rmSync(fullPath, { recursive: true, force: true });
              result.freedBytes += dirSize;
              result.deletedDirectories++;
            } else {
              const fileSize = stat.size;
              fs.unlinkSync(fullPath);
              result.freedBytes += fileSize;
              result.deletedFiles++;
            }
          }
        } catch (err: any) {
          result.errors.push(`Failed to delete subs entry ${entry.name}: ${err.message}`);
        }
      }
    } catch (err: any) {
      result.errors.push(`Error scanning subsDir: ${err.message}`);
    }
  }

  result.freedHuman = formatBytes(result.freedBytes);

  const logMessage = `[CacheCleaner] Sweep complete: freed ${result.freedHuman} (${result.deletedDirectories} dirs, ${result.deletedFiles} files, ${result.skippedActive} active skipped).`;
  if (options?.logger) {
    options.logger.info(logMessage);
    if (result.errors.length > 0) {
      options.logger.warn(`[CacheCleaner] Encountered ${result.errors.length} non-fatal warning(s):\n${result.errors.join('\n')}`);
    }
  } else if (result.deletedDirectories > 0 || result.deletedFiles > 0) {
    console.log(logMessage);
  }

  return result;
}

export interface ActiveCacheCleaner {
  stop: () => void;
  cleanNow: () => CleanupResult;
}

/**
 * Starts a background recurring timer to clean cache every intervalMs (checks for files > maxAgeMs old).
 * Defaults to 24-hour retention with sweeps running every 1 hour (or custom interval).
 */
export function startCacheCleaner(options?: CacheCleanupOptions): ActiveCacheCleaner {
  const defaultIntervalMs = 60 * 60 * 1000; // Check every 1 hour
  const envIntervalHours = process.env.CACHE_CLEANUP_INTERVAL_HOURS
    ? parseFloat(process.env.CACHE_CLEANUP_INTERVAL_HOURS)
    : undefined;
  const intervalMs = options?.intervalMs ?? (envIntervalHours ? envIntervalHours * 60 * 60 * 1000 : defaultIntervalMs);

  const maxAgeHours = (options?.maxAgeMs ? options.maxAgeMs : 24 * 60 * 60 * 1000) / (60 * 60 * 1000);
  const intervalHours = intervalMs / (60 * 60 * 1000);

  const initMsg = `[CacheCleaner] Started automatic cleaner (Retention: ${maxAgeHours}h, Sweep Interval: ${intervalHours}h).`;
  if (options?.logger) {
    options.logger.info(initMsg);
  } else {
    console.log(initMsg);
  }

  // Run immediate sweep on startup unless explicitly disabled
  if (options?.runImmediately !== false) {
    try {
      cleanCache(options);
    } catch (err: any) {
      if (options?.logger) {
        options.logger.error(`[CacheCleaner] Initial startup sweep failed: ${err.message}`);
      } else {
        console.error(`[CacheCleaner] Initial startup sweep failed:`, err);
      }
    }
  }

  const timer = setInterval(() => {
    try {
      cleanCache(options);
    } catch (err: any) {
      if (options?.logger) {
        options.logger.error(`[CacheCleaner] Recurring sweep failed: ${err.message}`);
      } else {
        console.error(`[CacheCleaner] Recurring sweep failed:`, err);
      }
    }
  }, intervalMs);

  // Unref timer so it doesn't block Node process exit in tests or tools
  if (timer.unref) {
    timer.unref();
  }

  return {
    stop: () => clearInterval(timer),
    cleanNow: () => cleanCache(options)
  };
}
