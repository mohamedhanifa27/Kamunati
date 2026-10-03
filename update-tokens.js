const fs = require('fs');

let c = fs.readFileSync('src/styles/tokens.css', 'utf8');

c = c.replace(/--c-bg:\s*[\d\s]+;/, '--c-bg: 2 6 52;'); /* #020634 */
c = c.replace(/--c-bg-elevated:\s*[\d\s]+;/, '--c-bg-elevated: 5 10 74;'); /* #050A4A */
c = c.replace(/--c-surface:\s*[\d\s]+;/, '--c-surface: 5 10 74;'); /* #050A4A */
c = c.replace(/--c-surface-raised:\s*[\d\s]+;/, '--c-surface-raised: 4 2 195;'); /* #0402C3 */
c = c.replace(/--c-border:\s*[\d\s]+;/, '--c-border: 73 117 254;'); /* #4975FE */
c = c.replace(/--c-primary:\s*[\d\s]+;/, '--c-primary: 94 85 240;'); /* #5E55F0 */
c = c.replace(/--c-primary-hover:\s*[\d\s]+;/, '--c-primary-hover: 143 167 255;'); /* #8FA7FF */
c = c.replace(/--c-accent:\s*[\d\s]+;/, '--c-accent: 235 158 255;'); /* #EB9EFF */
c = c.replace(/--c-text:\s*[\d\s]+;/, '--c-text: 255 255 255;'); 
c = c.replace(/--c-text-muted:\s*[\d\s]+;/, '--c-text-muted: 143 167 255;'); /* #8FA7FF */
c = c.replace(/--c-text-on-primary:\s*[\d\s]+;/, '--c-text-on-primary: 255 255 255;'); 

fs.writeFileSync('src/styles/tokens.css', c);
