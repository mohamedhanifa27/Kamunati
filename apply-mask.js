const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

const replaceStr = `<div className="mb-8 group cursor-pointer z-50 w-[120px] h-[120px] relative">
              {/* Liquid Metal applied ONTO the logo using a CSS mask */}
              <div 
                className="absolute inset-0 z-0 scale-[1.3] group-hover:scale-[1.4] transition-transform duration-500" 
                style={{
                  maskImage: "url(/logo.png)",
                  WebkitMaskImage: "url(/logo.png)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center"
                }}
              >
                {/* Embedded LiquidMetalButton filling the mask */}
                <LiquidMetalButton variant="circle" rendering="colored" diameter={160} strokeWidth={3.0} />
              </div>
              
              {/* Original logo structure preserved but blended into the liquid metal */}
              <img 
                src="/logo.png" 
                alt="Kamunati" 
                className="w-full h-full object-contain relative z-10 opacity-60 mix-blend-plus-lighter transition-all duration-300 group-hover:scale-105" 
              />
            </div>`;

c = c.replace(/<div className="mb-8 group cursor-pointer z-50 w-\[120px\] h-\[120px\]">[\s\S]*?<\/div>/, replaceStr);

fs.writeFileSync('src/app/login/page.tsx', c);
