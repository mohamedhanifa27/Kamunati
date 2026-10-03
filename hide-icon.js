const fs = require('fs');
let c = fs.readFileSync('src/shaders/liquid-metal-button/LiquidMetalButton.tsx', 'utf8');

c = c.replace(/body\[data-shape="circle"\] \.btn \.lbl \{\s*display: none;\s*\}/, `body[data-shape="circle"] .btn .lbl {
      display: none;
    }
    /* Hide the icon so it acts purely as a shader pool */
    body[data-shape="circle"] .btn .ico {
      display: none !important;
    }`);

fs.writeFileSync('src/shaders/liquid-metal-button/LiquidMetalButton.tsx', c);
