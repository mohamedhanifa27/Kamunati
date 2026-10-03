/**
 * Public exports for the ambient feature.
 */
export { AmbientProvider, useAmbient } from './AmbientProvider';
export { useAmbientFocus } from './hooks/useAmbientFocus';
export { useAmbientPause } from './hooks/useAmbientPause';
export { AmbientPauser } from './AmbientPauser';
export type { AmbientMode } from './engine/AmbientEngine';
export { BASE_PALETTE, makePaletteColour } from './engine/palette';
