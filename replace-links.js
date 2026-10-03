const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      if (content.includes("import Link from 'next/link'")) {
        content = content.replace(/import Link from 'next\/link'/g, "import { Link } from 'next-view-transitions'");
        modified = true;
      }
      
      if (content.includes("import Link from \"next/link\"")) {
        content = content.replace(/import Link from "next\/link"/g, "import { Link } from 'next-view-transitions'");
        modified = true;
      }
      
      if (content.includes("const router = useRouter()")) {
         if (!content.includes('next-view-transitions')) {
           content = content.replace(/import { useRouter } from 'next\/navigation'/g, "import { useTransitionRouter as useRouter } from 'next-view-transitions'");
           modified = true;
         }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir('src');
