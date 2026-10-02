const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('predictive-arc.json', 'utf8'));

for (const file of data.files) {
  const fullPath = path.join(process.cwd(), file.path);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (file.code) {
    fs.writeFileSync(fullPath, file.code, 'utf8');
    console.log(`Wrote text ${file.path}`);
  }
}
console.log('JSON Extraction complete.');
