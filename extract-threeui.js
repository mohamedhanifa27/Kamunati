const fs = require('fs');
const path = require('path');

const data = require('./liquid-metal.json');

for (const file of data.files) {
  const filepath = file.path;
  if (!filepath) continue;
  const content = file.code;
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('Wrote', filepath);
}
