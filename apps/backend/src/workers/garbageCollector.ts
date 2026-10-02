import fs from 'fs';
import path from 'path';
import { getDiskUsagePercent } from '../utils/diskUsage';

const CACHE_DIR = process.env.TORRENT_CACHE_DIR || '/tmp/torrents';
const MAX_DISK_PERCENT = 85;
const TARGET_DISK_PERCENT = 70;
const TTL_HOURS = 4;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

export async function runGarbageCollection() {
  console.log(`[GarbageCollector] Starting cleanup routine on ${CACHE_DIR}`);

  if (!fs.existsSync(CACHE_DIR)) {
    console.log(`[GarbageCollector] Cache directory does not exist. Skipping.`);
    return;
  }

  try {
    const files = await fs.promises.readdir(CACHE_DIR);
    const now = Date.now();
    let deletedCount = 0;

    // 1. TTL Logic: Delete anything unmodified in the last 4 hours
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(CACHE_DIR, file);
        const stat = await fs.promises.stat(filePath);
        return { filePath, stat };
      })
    );

    // Sort oldest first
    fileStats.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

    for (const { filePath, stat } of fileStats) {
      if (now - stat.mtimeMs > TTL_MS) {
        await fs.promises.rm(filePath, { recursive: true, force: true });
        console.log(`[GarbageCollector] TTL Eviction: Removed orphaned cache ${filePath}`);
        deletedCount++;
      }
    }

    // 2. Disk Pressure Logic
    let currentUsage = await getDiskUsagePercent(CACHE_DIR);
    console.log(`[GarbageCollector] Current disk usage: ${currentUsage}%`);

    if (currentUsage > MAX_DISK_PERCENT) {
      console.log(`[GarbageCollector] CRITICAL: Disk pressure exceeds ${MAX_DISK_PERCENT}%. Aggressive cleanup initiated.`);
      
      // We already removed TTL items. Re-read and aggressively delete oldest until below target
      const remainingFiles = await fs.promises.readdir(CACHE_DIR);
      const remainingStats = await Promise.all(
        remainingFiles.map(async (file) => {
          const filePath = path.join(CACHE_DIR, file);
          const stat = await fs.promises.stat(filePath);
          return { filePath, stat };
        })
      );

      remainingStats.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

      for (const { filePath } of remainingStats) {
        if (currentUsage <= TARGET_DISK_PERCENT) {
          console.log(`[GarbageCollector] Disk usage stabilized at ${currentUsage}%. Stopping aggressive cleanup.`);
          break;
        }

        await fs.promises.rm(filePath, { recursive: true, force: true });
        console.log(`[GarbageCollector] Pressure Eviction: Removed ${filePath}`);
        deletedCount++;
        
        // Re-check disk usage
        currentUsage = await getDiskUsagePercent(CACHE_DIR);
      }
    }

    console.log(`[GarbageCollector] Routine complete. Total items deleted: ${deletedCount}.`);
  } catch (error) {
    console.error(`[GarbageCollector] Error during execution:`, error);
  }
}

// Start the continuous worker
export function startGarbageCollectorWorker() {
  // Run immediately on boot
  runGarbageCollection();
  
  // Run every 15 minutes
  setInterval(runGarbageCollection, 15 * 60 * 1000);
}
