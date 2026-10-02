export function hexToRgb(hex: string): string {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r} ${g} ${b}`;
}

// Generate the CSS variable string for the root
export function generateThemeVariables(preset: any): string {
  let css = '';
  for (const [key, hex] of Object.entries(preset.colors)) {
    if (typeof hex === 'string' && hex.startsWith('#')) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `--c-${cssKey}: ${hexToRgb(hex)};\n`;
    }
  }
  return css;
}
