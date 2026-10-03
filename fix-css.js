const fs = require('fs');
let c = fs.readFileSync('src/shaders/threeui.css', 'utf8');
c = c.replace(/@font-face\s*{[^}]*}/g, '/* font removed */');
fs.writeFileSync('src/shaders/threeui.css', c);
