const fs = require('fs');
let text = fs.readFileSync('src/components/user/ProfileDashboard.tsx', 'utf8');
text = text.replace(/s\.href \? \(<Link.*?\n.*?\n.*?<\/div>\n\s*\)\)\}/s, s.href ? (
              <Link key={s.label} href={s.href} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <span className="text-3xl font-bold font-heading mb-1">{s.value}</span>
                <span className="text-sm text-neutral-400">{s.label}</span>
              </Link>
            ) : (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col items-center text-center">
                <span className="text-3xl font-bold font-heading mb-1">{s.value}</span>
                <span className="text-sm text-neutral-400">{s.label}</span>
              </div>
            )
          ))});
fs.writeFileSync('src/components/user/ProfileDashboard.tsx', text);
