const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/fontFamily: "'Montserrat Alternates', sans-serif"/, 'fontFamily: "\'Glonto Sans\', \'Montserrat Alternates\', sans-serif"');

fs.writeFileSync('src/app/login/page.tsx', c);
