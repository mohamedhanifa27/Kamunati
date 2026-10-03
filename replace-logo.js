const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

const searchTop = /<div className="z-10 w-full max-w-md px-8 pb-8 pt-16 mt-16 bg-black\/40 backdrop-blur-xl border border-white\/10 rounded-2xl shadow-2xl relative">[\s\S]*?\{\/\* Funky Floating Logo \*\/\}[\s\S]*?<div className="absolute -top-16 left-1\/2 -translate-x-1\/2 transform -rotate-\[6deg\] hover:rotate-\[4deg\] transition-all duration-500 hover:scale-110 z-50 group">[\s\S]*?<div className="absolute inset-0 bg-primary\/60 blur-\[30px\] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"><\/div>[\s\S]*?<img src="\/logo.png" alt="Kamunati" className="h-24 object-contain drop-shadow-\[0_0_20px_rgba\(138,43,226,0\.6\)\] relative z-10" \/>[\s\S]*?<\/div>[\s\S]*?<h2 className="text-3xl font-black text-white text-center mb-8 tracking-wide">/;

const replaceTop = `<div className="z-10 flex flex-col items-center w-full max-w-md relative">
          {/* Logo properly placed above the card */}
          <div className="mb-6 group cursor-pointer z-50">
            <img 
              src="/logo.png" 
              alt="Kamunati" 
              className="h-14 object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(138,43,226,1)] group-hover:scale-110" 
            />
          </div>

          <div className="w-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative">
  
          <h2 className="text-2xl font-bold text-white text-center mb-6">`;

const searchBottom = /        <\/p>\s*<\/div>\s*<\/div>\s*\);\s*}/;
const replaceBottom = `        </p>
        </div>
      </div>
    </div>
  );
}`;

c = c.replace(searchTop, replaceTop);
c = c.replace(searchBottom, replaceBottom);
fs.writeFileSync('src/app/login/page.tsx', c);
