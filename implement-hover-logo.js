const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Insert the LiquidMetalButton import if it's missing
if (!c.includes("import { LiquidMetalButton }")) {
  c = c.replace(/import '\.\.\/\.\.\/shaders\/threeui\.css';/, "import '../../shaders/threeui.css';\nimport { LiquidMetalButton } from '../../shaders/liquid-metal-button/LiquidMetalButton';");
}

const regex = /<div className="mb-8 group cursor-pointer z-50 flex items-center justify-center">\s*<img\s*src="\/logo_vector\.svg"[\s\S]*?\/>\s*<\/div>/;

const interactiveLogo = `<div className="mb-8 group cursor-pointer z-50 w-[120px] h-[120px] relative">
              {/* Interactive liquid metal effect masked to the SVG shape. Only visible on hover! */}
              <div 
                className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500" 
                style={{
                  maskImage: "url(/logo_vector.svg)",
                  WebkitMaskImage: "url(/logo_vector.svg)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center"
                }}
              >
                {/* 160px diameter ensures the liquid metal pool fully covers the 120px box */}
                <LiquidMetalButton variant="circle" rendering="colored" diameter={160} strokeWidth={3.0} />
              </div>
              
              {/* Original static logo. Fades out slightly on hover to let the liquid metal shine through completely */}
              <img 
                src="/logo_vector.svg" 
                alt="Kamunati" 
                className="w-full h-full object-contain relative z-10 transition-all duration-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:opacity-20" 
              />
            </div>`;

c = c.replace(regex, interactiveLogo);

fs.writeFileSync('src/app/login/page.tsx', c);
