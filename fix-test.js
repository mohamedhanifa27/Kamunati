const fs = require('fs');
let content = fs.readFileSync('src/features/admin/metrics.test.ts', 'utf8');

content = content.replace(/info\s+fileIndex: 0,/g, "infoHash: 'AABBCCDDEEFF11223344',\n        fileIndex: 0,");

fs.writeFileSync('src/features/admin/metrics.test.ts', content);
