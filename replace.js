const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');
const search = /<div className="z-10 w-full max-w-md p-8 bg-black\/40 backdrop-blur-xl border border-white\/10 rounded-2xl\s+shadow-2xl relative">[\s\S]*?<div className="flex justify-center mb-8">[\s\S]*?<img src="\/logo.png" alt="Kamunati" className="h-12 object-contain" \/>[\s\S]*?<\/div>[\s\S]*?<h2 className="text-2xl font-bold text-white text-center mb-6">/;
const replace = `<div className="z-10 w-full max-w-md px-8 pb-8 pt-16 mt-16 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative">
          
          {/* Funky Floating Logo */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 transform -rotate-[6deg] hover:rotate-[4deg] transition-all duration-500 hover:scale-110 z-50 group">
            <div className="absolute inset-0 bg-primary/60 blur-[30px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
            <img src="/logo.png" alt="Kamunati" className="h-24 object-contain drop-shadow-[0_0_20px_rgba(138,43,226,0.6)] relative z-10" />
          </div>

          <h2 className="text-3xl font-black text-white text-center mb-8 tracking-wide">`;

c = c.replace(search, replace);
fs.writeFileSync('src/app/login/page.tsx', c);
