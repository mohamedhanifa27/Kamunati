const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/className="z-10 flex flex-col items-center w-full max-w-md relative"/, 
  'className="z-10 flex flex-col items-center w-full max-w-md relative -translate-y-12"');

fs.writeFileSync('src/app/login/page.tsx', c);
