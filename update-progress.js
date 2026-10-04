const fs = require('fs');
let content = fs.readFileSync('PROGRESS.md', 'utf8');

content = content.replace(/\| G Reviews \| .*?Pending .*?\|/, '| G Reviews | feat/g-reviews | Complete | UI and API routes |');
content = content.replace(/\| H Admin Upgrades \| .*?Pending .*?\|/, '| H Admin Upgrades | feat/h-admin | Complete | UI and API routes |');

fs.writeFileSync('PROGRESS.md', content);
