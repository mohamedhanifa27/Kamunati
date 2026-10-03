const fs = require('fs');

const htmlContent = fs.readFileSync('src/shaders/liquid-metal-button/liquid-metal-button.html', 'utf8');
const jsContent = 'export default ' + JSON.stringify(htmlContent) + ';';
fs.writeFileSync('src/shaders/liquid-metal-button/liquid-metal-button-html.js', jsContent);

let tsxContent = fs.readFileSync('src/shaders/liquid-metal-button/LiquidMetalButton.tsx', 'utf8');
tsxContent = tsxContent.replace(/import liquidMetalButtonSource from "\.\/liquid-metal-button\.html\?raw";/, 'import liquidMetalButtonSource from "./liquid-metal-button-html.js";');
fs.writeFileSync('src/shaders/liquid-metal-button/LiquidMetalButton.tsx', tsxContent);
