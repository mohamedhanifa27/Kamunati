const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/className="h-\[120px\] object-contain drop-shadow-\[0_4px_12px_rgba\(0,0,0,0.8\)\] transition-all duration-300 group-hover:drop-shadow-\[0_0_35px_rgba\(138,43,226,1\)\] group-hover:scale-105"/, 
  'className="h-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:scale-105"');

fs.writeFileSync('src/app/login/page.tsx', c);
