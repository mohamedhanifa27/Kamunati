import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function getDiskUsagePercent(path: string): Promise<number> {
  try {
    if (os.platform() === 'win32') {
      // Basic fallback for Windows dev environments
      return 0; 
    }

    const { stdout } = await execAsync(`df -k ${path}`);
    const lines = stdout.trim().split('\n');
    
    if (lines.length > 1) {
      // df output looks like:
      // Filesystem     1K-blocks    Used Available Use% Mounted on
      // overlay         51200000 1234567  49965433  25% /
      const columns = lines[1].trim().split(/\s+/);
      const usePercentStr = columns[4]; // e.g., "25%"
      
      if (usePercentStr && usePercentStr.includes('%')) {
        return parseInt(usePercentStr.replace('%', ''), 10);
      }
    }
    
    return 0;
  } catch (err) {
    console.error(`Failed to get disk usage for ${path}`, err);
    return 0;
  }
}
