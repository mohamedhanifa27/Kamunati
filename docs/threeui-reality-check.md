# ThreeUI Reality Check

## RectangleButtons
1. **HTML/React:** Uses `NeuformIsolatedEffects` to render isolated HTML sources (e.g. `launch-button.html`) inside a Shadow DOM to isolate styles.
2. **Props:** Uses internal HTML parsing to inject text.
3. **State:** Communication happens via `postMessage` or specific DOM event listeners depending on the Neuform version.
4. **Sizing:** Sized by internal CSS inside the isolated HTML.
5. **Cost:** Uses CSS animations mostly.
6. **Reduced motion:** Handled by CSS inside the HTML strings.

## SkeuomorphicToggleCollection
1. **HTML/React:** Mix of native React toggles and WebGL depending on variant (`ShaderToggle`, `GlassToggle`). `modern` is pure CSS/React.
2. **Props:** Takes standard toggle props.
3. **State:** React callbacks (`onClick`).
4. **Sizing:** Fixed dimensions inside standard wrappers.
5. **Cost:** `modern` variant is very lightweight (CSS only).
6. **Reduced motion:** Minimal transitions via standard CSS.

## LiquidMetalButton
1. **HTML/React:** Native React wrapper loading `liquid-metal-button.html` string.
2. **Props:** Standard button props, injected into HTML.
3. **State:** Standard `onClick`.
4. **Sizing:** Configurable via style injection.
5. **Cost:** Heavy CSS and SVG filters for the liquid effect.
6. **Reduced motion:** Strips filters if `prefers-reduced-motion` is active.

## AnimatedTopDock
1. **HTML/React:** WebGL heavy via `Three.js` (r128) managed by `topDockController.ts`.
2. **Props:** `items`, `activeId`, `proximity`, `spring`, `damping`.
3. **State:** Uses `onNavigate`.
4. **Sizing:** Full width container normally.
5. **Cost:** High (WebGL loop). Pauses when hidden.
6. **Reduced motion:** Disables 3D scene and falls back to simple HTML list.
7. **Axis mapping:** Horizontal proximity mapping relies on pointer X distance. Will require forking `topDockController.ts` to swap X to Y for vertical orientation.
