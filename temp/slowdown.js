const fs = require('fs');

const path = 'src/components/layout/IntroGate.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['const progress = t / 2000;', 'const progress = t / 3000;'],
  ['if (t > 400) {', 'if (t > 600) {'],
  ['const fade = clamp((t - 400) / 400, 0, 1);', 'const fade = clamp((t - 600) / 600, 0, 1);'],
  ['if (t > 800) {', 'if (t > 1200) {'],
  ['const gridFade = clamp(t / 150, 0, 1);', 'const gridFade = clamp(t / 225, 0, 1);'],
  ['const kStemProg = getProgress(t, 0, 150);', 'const kStemProg = getProgress(t, 0, 225);'],
  ['const kArmProg = getProgress(t, 150, 350);', 'const kArmProg = getProgress(t, 225, 525);'],
  ['if (t <= 350) {', 'if (t <= 525) {'],
  ['const pushIn = getProgress(t, 0, 350);', 'const pushIn = getProgress(t, 0, 525);'],
  ['const pullBack = getProgress(t, 350, 1500, easeOutCubic);', 'const pullBack = getProgress(t, 525, 2250, easeOutCubic);'],
  ['if (t > 1300 && t < 1700) {', 'if (t > 1950 && t < 2550) {'],
  ['const aTopLegsProg = getProgress(t, 350, 450);', 'const aTopLegsProg = getProgress(t, 525, 675);'],
  ['const aTopBarProg = getProgress(t, 450, 500);', 'const aTopBarProg = getProgress(t, 675, 750);'],
  ['const mProg = getProgress(t, 500, 800);', 'const mProg = getProgress(t, 750, 1200);'],
  ['const uProg = getProgress(t, 650, 800);', 'const uProg = getProgress(t, 975, 1200);'],
  ['const nProg = getProgress(t, 800, 1150);', 'const nProg = getProgress(t, 1200, 1725);'],
  ['const aBotLegsProg = getProgress(t, 1000, 1100);', 'const aBotLegsProg = getProgress(t, 1500, 1650);'],
  ['const aBotBarProg = getProgress(t, 1050, 1150);', 'const aBotBarProg = getProgress(t, 1575, 1725);'],
  ['const tProg = getProgress(t, 1150, 1500);', 'const tProg = getProgress(t, 1725, 2250);'],
  ['const iProg = getProgress(t, 1350, 1500);', 'const iProg = getProgress(t, 2025, 2250);'],
  ['const exitProg = getProgress(t, 1750, 2000, easeOutCubic);', 'const exitProg = getProgress(t, 2625, 3000, easeOutCubic);'],
  ['if (t >= 2000) {', 'if (t >= 3000) {'],
  ['} else if (t > 3000) {', '} else if (t > 4500) {']
];

let replaced = 0;
for (const [find, replace] of replacements) {
  if (content.includes(find)) {
    content = content.replace(find, replace);
    replaced++;
  } else {
    console.error("NOT FOUND:", find);
  }
}

console.log("Replaced " + replaced + " out of " + replacements.length + " matches.");

fs.writeFileSync(path, content);
