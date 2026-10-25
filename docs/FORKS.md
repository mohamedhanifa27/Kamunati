# ThreeUI Forks

All vendored files in `src/vendor/threeui` remain untouched.
Forks and adapters are implemented in `src/features/admin/ui/threeui/`.

## Vertical Dock (AnimatedTopDock)
- **What:** Forked `topDockController.ts` and the main component layout.
- **Why:** The original `sable` dock uses mouse X proximity for item expansion. We need a vertical sidebar where mouse Y proximity triggers expansion and items spring horizontally.
- **Diff summary:** Swapped `clientX` for `clientY` in proximity calculations. Swapped `width` and `height` growth axes.
