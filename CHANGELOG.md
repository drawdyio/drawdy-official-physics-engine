# Changelog

## 1.0.0

### Added

- **Physics tagging** from the canvas context menu (**Extension → Physics → Static / Dynamic**), with a ✓ on the tag the whole selection carries and toggle-off by picking it again.
  - **Dynamic** bodies (rectangle, circle, diamond) fall, collide, bounce, roll and stack.
  - **Static** colliders accept any element type: shapes use their rotated outline, freehand strokes collide along their drawn path, everything else uses its bounding box.
- **Sandbox** — a dashed rectangle element with thick walls on all four sides that bounds the simulation. Board-owned rather than camera-anchored, so every collaborator simulates against the same arena.
  - Created automatically around the tagged content on the first run.
  - Moving, resizing or rotating it rebuilds its walls live, including mid-run; a rotated sandbox tilts its floor.
  - Elements leaving a sandbox lose their physics tag and keep the position they landed in.
  - Multiple sandboxes per board, each its own arena.
  - Rendered behind the board's content so clicks reach the bodies inside.
- **Extension panel** in the side rail listing every sandbox, static collider and dynamic body.
  - Sandboxes: rename in place by double-clicking the name (shown at the box's top-left on canvas), set width and height, fly to, delete, or add another.
  - Element rows: click to select on canvas, fly to, or remove the physics tag.
- **Settle and commit**: a run ends once every body is calm, writing final positions to the document as a single undo step and a single collaboration update.
- **Live editing during a run**: drag a body and it is held under the cursor while others collide with it; move or resize a static collider and its shape is rebuilt in place; paste tagged elements and they join the running world; delete anything and its body leaves.
- **Automatic start** across entry routes — board load, in-app navigation, paste and undo — with geometry-change detection that distinguishes user edits from the extension's own writes.
- **Simulation core** (`src/engine`, dependency-free and unit tested): semi-implicit Euler at a fixed timestep, wall-clock accumulator with debt repayment so frame jitter never changes the gravity scale, sequential-impulse contact solving with restitution and Coulomb friction, contact-gated rolling resistance, positional correction, and sleep thresholds tuned to resting-contact noise.
- **Collider fidelity and performance**: true circles, 16-gon ellipses, rotated polygons, and freehand strokes simplified with Ramer–Douglas–Peucker then indexed by segment and group bounding boxes; world-vertex caching across solver iterations.
- **Off-thread simulation**: stepping runs in the extension worker and motion is drawn as a preview, so the document is untouched until the run settles.
