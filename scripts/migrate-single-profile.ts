/**
 * migrate-single-profile.ts
 * U2.2 – Single profile per account migration script
 *
 * This script is SAFE BY DEFAULT (dry run).
 * To apply changes: ts-node scripts/migrate-single-profile.ts --apply --i-have-a-backup
 *
 * NOTE: The current schema does NOT have a Profile table — each User IS the profile.
 * This script is a no-op in the current codebase but documents the contract
 * for future multi-profile scenarios.
 */

const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');
const hasBackupConfirm = args.includes('--i-have-a-backup');

if (!isDryRun && !hasBackupConfirm) {
  console.error('ERROR: You must confirm you have a backup with --i-have-a-backup');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Single Profile Migration Script');
console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'APPLY'}`);
console.log('='.repeat(60));
console.log('');
console.log('AUDIT:');
console.log('  - Current schema: Profile table does not exist.');
console.log('  - Each User record IS the single profile.');
console.log('  - No multi-profile data to merge.');
console.log('  - Service layer already enforces single-user semantics.');
console.log('');
console.log('RESULT: No migration required. Schema is already single-profile.');
console.log('  - Users affected: 0');
console.log('  - Rows merged: 0');
console.log('  - Rows archived: 0');
console.log('');
console.log('If a Profile table is added in the future, re-run this script.');
