const fs = require('fs');
let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace(/import Navbar from '\.\.\/components\/layout\/Navbar';/, 
  "import Navbar from '../components/layout/Navbar';\nimport MainLayout from '../components/layout/MainLayout';");

c = c.replace(/<main className="min-h-screen relative z-10 pb-24">[\s\S]*?<\/main>/, 
  '<MainLayout>{children}</MainLayout>');

fs.writeFileSync('src/app/layout.tsx', c);
