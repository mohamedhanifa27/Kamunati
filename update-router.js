const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(/import { useRouter, useSearchParams } from 'next\/navigation';/, 
  "import { useSearchParams } from 'next/navigation';\nimport { useTransitionRouter } from 'next-view-transitions';");

c = c.replace(/const router = useRouter\(\);/, 'const router = useTransitionRouter();');

fs.writeFileSync('src/app/login/page.tsx', c);
