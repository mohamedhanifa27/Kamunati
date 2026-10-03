const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

const regex = /<div className="mb-8 group cursor-pointer z-50 flex items-center justify-center">[\s\S]*?mix-blend-plus-lighter[\s\S]*?<\/div>/;

const simpleLogo = `<div className="mb-8 group cursor-pointer z-50 flex items-center justify-center">
              <img 
                src="/logo_vector.svg" 
                alt="Kamunati" 
                className="w-[120px] h-[120px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:scale-105" 
              />
            </div>`;

c = c.replace(regex, simpleLogo);

fs.writeFileSync('src/app/login/page.tsx', c);
