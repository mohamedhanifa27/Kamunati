const fs = require('fs');

let c = fs.readFileSync('src/app/globals.css', 'utf8');

c = c.replace(
  /\.live-gradient\s*\{\s*background:\s*linear-gradient\([^;]+\);\s*background-size:\s*400%\s*400%;\s*animation:\s*gradientAnimation\s*15s\s*ease\s*infinite;\s*\}/,
  `.live-gradient {
  /* Updated Space Gradients based on user-provided palette (Black matter, Planets palette) */
  background: linear-gradient(-45deg, #050A4A, #0402C3, #5E55F0, #EB9EFF, #8FA7FF, #020634);
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;
}`
);

fs.writeFileSync('src/app/globals.css', c);
