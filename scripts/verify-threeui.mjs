import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const manifestPath = path.resolve('docs/threeui-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let hasErrors = false;

function verifyFile(fileObj, basePath = '') {
  const fullPath = path.resolve(basePath, fileObj.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`[MISSING] ${fileObj.path}`);
    hasErrors = true;
    return;
  }
  
  const content = fs.readFileSync(fullPath);
  
  if (fileObj.bytes && content.length !== fileObj.bytes) {
    console.error(`[SIZE MISMATCH] ${fileObj.path} - Expected ${fileObj.bytes}, got ${content.length}`);
    hasErrors = true;
  }
  
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  if (hash !== fileObj.sha256) {
    console.error(`[HASH MISMATCH] ${fileObj.path} - Expected ${fileObj.sha256}, got ${hash}`);
    hasErrors = true;
  } else {
    console.log(`[OK] ${fileObj.path}`);
  }
}

console.log('Verifying ThreeUI shared files...');
manifest.shared.forEach(f => verifyFile(f, 'src/vendor/threeui'));

Object.keys(manifest.components).forEach(comp => {
  console.log(`\nVerifying ${comp}...`);
  const data = manifest.components[comp];
  data.files.forEach(f => verifyFile(f, 'src/vendor/threeui'));
  // Removed binary assets verification per user override
});

if (hasErrors) {
  console.error('\nVerification failed! Do not edit vendored files directly.');
  process.exit(1);
} else {
  console.log('\nAll ThreeUI files verified successfully.');
}
