const fs = require('fs');

let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace(/text-text live-gradient`}>/, 'text-text`}>');

fs.writeFileSync('src/app/layout.tsx', c);
