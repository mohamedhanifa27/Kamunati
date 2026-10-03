const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/<div className="mb-8 group cursor-pointer z-50">/, '<div className="mb-8 group cursor-pointer z-50 w-[120px] h-[120px]">');

fs.writeFileSync('src/app/login/page.tsx', c);
