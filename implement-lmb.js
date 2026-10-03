const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/import '\.\.\/\.\.\/shaders\/threeui\.css';/, "import '../../shaders/threeui.css';\nimport { LiquidMetalButton } from '../../shaders/liquid-metal-button/LiquidMetalButton';");

c = c.replace(/<img[\s\S]*?src="\/logo\.png"[\s\S]*?\/>/, '<LiquidMetalButton variant="play" rendering="colored" diameter={120} strokeWidth={3.0} text="Play" />');

fs.writeFileSync('src/app/login/page.tsx', c);
