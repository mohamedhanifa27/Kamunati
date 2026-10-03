const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(
  /<div className="min-h-screen bg-bg overflow-x-hidden pt-0">/,
  `<div className="min-h-screen overflow-x-hidden pt-0 relative">
      {/* Fixed animated space gradient background */}
      <div className="fixed inset-0 -z-20 live-gradient" />`
);

fs.writeFileSync('src/app/page.tsx', c);
