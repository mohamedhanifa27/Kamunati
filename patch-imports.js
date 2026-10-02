const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace import X from "./sources/Y.html?raw" with const X = "";
  code = code.replace(/import\s+(\w+)\s+from\s+["']\.\/sources\/([\w-]+)\.html\?raw["'];/g, (match, p1) => {
    return `const ${p1} = "";`;
  });
  
  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Processed ${filePath}`);
}

processFile('src/shaders/neuform-isolated/NeuformBatchEffects.tsx');
processFile('src/shaders/neuform-isolated/NeuformIsolatedEffects.tsx');
processFile('src/shaders/neuform-isolated/NeuformCraftEffects.tsx');
