const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/url\(\/logo\.png\)/g, 'url(/logo_vector.svg)');
c = c.replace(/src="\/logo\.png"/g, 'src="/logo_vector.svg"');

fs.writeFileSync('src/app/login/page.tsx', c);
