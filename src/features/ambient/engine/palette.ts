/**
 * palette.ts — Base space-gradients palette and OKLab blending
 * Colours drawn from the "Space Gradients" reference image palette.
 */

export interface PaletteColour {
  hex: string;
  weight: number;
  /** Cached linear-sRGB values for GPU upload */
  r: number;
  g: number;
  b: number;
}

/** Parse #RRGGBB to linear sRGB [0..1] */
function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const sR = ((n >> 16) & 0xff) / 255;
  const sG = ((n >> 8) & 0xff) / 255;
  const sB = (n & 0xff) / 255;
  // sRGB → linear
  const toL = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [toL(sR), toL(sG), toL(sB)];
}

export function makePaletteColour(hex: string, weight: number): PaletteColour {
  const [r, g, b] = hexToLinear(hex);
  return { hex, weight, r, g, b };
}

/** Base palette from "Space Gradients" image */
export const BASE_PALETTE: PaletteColour[] = [
  makePaletteColour('#0402C3', 1.0),   // deep indigo (UI Accent)
  makePaletteColour('#5E55F0', 0.85),  // periwinkle (UI Accent)
  makePaletteColour('#4975FE', 0.7),   // cerulean blue (Black matter)
  makePaletteColour('#EB9EFF', 0.6),   // soft orchid (Planets)
  makePaletteColour('#BFA7FF', 0.5),   // lavender (UI Accent)
  makePaletteColour('#050A4A', 0.4),   // near-black indigo (background)
  makePaletteColour('#050A4A', 0.35),  // darkest base
  makePaletteColour('#8FA7FF', 0.3),   // light periwinkle
];

/** Blend two colours in linear space by t ∈ [0,1] */
export function blendColour(
  a: PaletteColour,
  b: PaletteColour,
  t: number,
): PaletteColour {
  const it = 1 - t;
  return {
    hex: '#000000', // not used during animation
    weight: a.weight * it + b.weight * t,
    r: a.r * it + b.r * t,
    g: a.g * it + b.g * t,
    b: a.b * it + b.b * t,
  };
}

/** Sanitise a user-supplied hex palette so colours work on pure black.
 *  Lightness 0.62–0.85 in OKLab approximation, chroma >= 0.10.
 *  Falls back to base palette colour on failure. */
export function sanitiseColour(hex: string, fallback: PaletteColour): PaletteColour {
  try {
    const [r, g, b] = hexToLinear(hex);
    // Approximate OKLab L
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Approximate chroma (distance from grey)
    const a = r - g;
    const bComp = 0.5 * r + 0.5 * g - b;
    const chroma = Math.sqrt(a * a + bComp * bComp);
    if (L < 0.05 || L > 0.95 || chroma < 0.02) return fallback;
    return makePaletteColour(hex, 1.0);
  } catch {
    return fallback;
  }
}
