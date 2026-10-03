const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://threeui.com/source-code/liquid-metal-button.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    for (const [filepath, content] of Object.entries(json.files)) {
      const fullPath = path.join(__dirname, filepath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, content);
      console.log('Wrote', filepath);
    }
  });
});
