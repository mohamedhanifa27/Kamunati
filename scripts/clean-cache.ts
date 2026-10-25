import { cleanCache } from '../src/engine/cacheCleaner';

const args = process.argv.slice(2);
const cleanAll = args.includes('--all');
const maxAgeHours = cleanAll ? 0 : 24;

console.log(`[CleanCache] Starting cache cleanup (retention: ${cleanAll ? 'all inactive files' : `${maxAgeHours} hours`})...`);

const result = cleanCache({
  maxAgeMs: maxAgeHours * 60 * 60 * 1000
});

console.log(`[CleanCache] Done! Freed: ${result.freedHuman}`);
console.log(`  - Deleted directories: ${result.deletedDirectories}`);
console.log(`  - Deleted files: ${result.deletedFiles}`);
console.log(`  - Active streams protected: ${result.skippedActive}`);
if (result.errors.length > 0) {
  console.warn(`  - Warnings/Errors:\n${result.errors.join('\n')}`);
}
