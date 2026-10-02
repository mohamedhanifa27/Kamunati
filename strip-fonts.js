const fs = require('fs');

let css = fs.readFileSync('src/shaders/threeui.css', 'utf8');
css = css.replace(/@font-face\s*{[\s\S]*?}/g, '');
fs.writeFileSync('src/shaders/threeui.css', css);
console.log('Removed @font-face blocks');
