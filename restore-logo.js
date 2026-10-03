const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Replace the complex liquid metal mask structure with a simple img tag for the logo
const logoRegex = /<div className="mb-8 group cursor-pointer z-50 w-\[120px\] h-\[120px\] relative">[\s\S]*?<\/div>\s*<\/div>/;
const simpleLogo = `<div className="mb-8 group cursor-pointer z-50 flex items-center justify-center">
              <img 
                src="/logo_vector.svg" 
                alt="Kamunati" 
                className="w-[120px] h-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:scale-105" 
              />
            </div>`;

c = c.replace(/<div className="mb-8 group cursor-pointer z-50 w-\[120px\] h-\[120px\] relative">[\s\S]*?<\/div>/, simpleLogo);

// Also remove the import of LiquidMetalButton
c = c.replace(/import { LiquidMetalButton } from '\.\.\/\.\.\/shaders\/liquid-metal-button\/LiquidMetalButton';\n?/, '');

fs.writeFileSync('src/app/login/page.tsx', c);
