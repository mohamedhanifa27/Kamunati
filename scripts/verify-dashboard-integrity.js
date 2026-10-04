const fs = require('fs');
const path = require('path');

const DASHBOARD_COMPONENTS = [
  'src/components/admin/LiveDashboardCards.tsx',
  'src/app/admin/page.tsx'
];

let failed = false;

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');

  // Math.random
  if (content.includes('Math.random(')) {
    console.error(`[FAIL] ${filePath} contains Math.random()`);
    failed = true;
  }

  // setInterval loops that mutate state directly (we allow it for polling API, but not mutating visual states blindly)
  // Our SSE component uses eventSource, not setInterval to mutate data, though API uses setInterval. 
  // We'll just check for fake intervals mutating component state.
  if (/setInterval\(\s*\(\)\s*=>\s*\{\s*set[A-Z]\w*\(.*?Math\.random/i.test(content)) {
    console.error(`[FAIL] ${filePath} contains a fake setInterval mutator`);
    failed = true;
  }

  // Hardcoded numeric literals in KPI definitions
  // e.g., { label: 'Active Users', value: 24 }
  if (/value:\s*\d+,/.test(content)) {
    console.error(`[FAIL] ${filePath} contains numeric literals used as KPI data`);
    failed = true;
  }
}

console.log('Running Dashboard Integrity CI Checks...');
DASHBOARD_COMPONENTS.forEach(checkFile);

if (failed) {
  console.error('Integrity checks failed.');
  process.exit(1);
} else {
  console.log('Integrity checks passed.');
  process.exit(0);
}
