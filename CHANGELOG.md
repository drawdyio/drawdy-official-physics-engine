# Changelog

## 1.0.1

### Fixed

- Installing no longer fails when the permission prompt is dismissed. The extension now installs and simply waits for permission, instead of aborting with an unreadable error.
- The Physics menu appears on its own once permission is granted, without reloading the board.

## 1.0.0

First release.

### Added

- **Physics tags** from the canvas right-click menu, under **Extension → Physics**. A ✓ marks the tag your selection already has, and picking it again removes it.
  - **Dynamic** — rectangles, circles and diamonds fall, collide, bounce, roll and stack.
  - **Static** — any element holds things up. Freehand strokes collide along the line you drew.
- **No run button.** Tagging starts the simulation, and it starts again on its own whenever you move, add, paste or delete something tagged.
- **One undo step.** When everything comes to rest, the final positions are saved as a single entry in the undo history.
- **Sandbox** — a dashed box that the simulation happens inside. It appears around your shapes on the first run.
  - Move, resize or rotate it and the walls follow, even mid-simulation. A tilted sandbox has a tilted floor.
  - Drag something out of the sandbox and it drops out of the simulation, keeping where you put it.
  - Name each sandbox — the name shows at its top-left corner on the canvas.
  - Use as many sandboxes as you like, each its own separate world.
- **Keep working while it runs.** Drag a shape and everything else piles against it; let go and it rejoins the simulation. Move your static shapes, paste in more, or delete anything mid-run.
- **Panel** in the side rail, listing every sandbox, static collider and dynamic body. Resize and rename sandboxes, jump the camera to anything, select an element on the canvas, or remove its physics tag.
- **Smooth on big boards.** The simulation runs off the main thread, so the board keeps responding while a large pile settles, and collaborators only see the result.
