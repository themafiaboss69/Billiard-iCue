# Billiard Cue Ball Guide Implementation Plan

## Goal Description
Build a web-based mobile-friendly application that serves as a Billiard cue ball guide. The app will feature dual-screen viewing (top-down 2D-style view and 3D third-person view), touch controls to aim the shot, a power slider (1-100), and an English (spin) adjuster. It will calculate and display simple predictive geometry lines for both the cue ball and the target ball, demonstrating how English changes the trajectory (e.g., top spin/follow, bottom spin/draw).

## Proposed Tech Stack
- **Framework**: Vite + Vanilla JS + HTML structure
- **3D Graphics**: **Three.js**. This is highly recommended because it easily allows us to render the exact same 3D scene from two different cameras (a top-down OrthographicCamera for the 2D view, and a PerspectiveCamera behind the cue ball for the 3D third-person view) in a split-screen layout.
- **Styling**: Vanilla CSS for simple, responsive UI overlays.

## User Review Required
> [!IMPORTANT]
> Please review the approach to physics and graphics:
> 1. Is Three.js split-screen acceptable? (Top half: 3D third-person view, Bottom half: Top-down view).
> 2. For the initial setup ("simple graphics, see how it goes"), we will use simple spheres for balls, a green plane for the table, and basic lines for trajectories.
> 3. Physics calculation: We will implement a custom math solution for the trajectory prediction lines (Object ball goes along the line-of-centers; Cue ball travels the 90-degree tangent line, which curves based on top/bottom english). Does this sound good for V1?

## Proposed Changes

### Setup and Configuration
- Initialize Vite project.
- Install `three` via npm.
- Set up responsive mobile viewport meta tags.

### UI and Layout
#### [MODIFY] index.html
- Split-screen layout (Two containers or one full-screen canvas with Three.js scissor testing).
- Overlay controls:
  - Power slider (1-100 input range).
  - English control (a circular div with a draggable dot to select tip strike location: top, bottom, left, right).
  - Fine-tune buttons (+/- or arrows) located near the aim and English controls to allow precise micro-adjustments.
  - Aim controls (touch dragging on the 3D view rotates the cue ball's aim angle).
  - A "Shoot" button to execute the shot based on current parameters.

#### [NEW] src/style.css
- Mobile-first, absolute positioning for UI controls to float over the canvas.

## Logic and Physics
#### [NEW] main.js
- **Three.js Initialization**: Scene, Lighting, Floor (table color), and two Spheres (Cue Ball, Object Ball).
- **Dual Camera Setup**: 
  - `camera3D`: PerspectiveCamera behind the cue ball.
  - `cameraTop`: Orthographic camera looking straight down with corrected `up` vector.
- **Physics Engine (V2 - Dr. Dave Squirve)**:
  - **Pre-Collision**: Frame-by-frame integrator for **Squirt** (deflection) and **Swerve** (curve).
  - **Impact**: Collision detection based on the integrated path to find the curved impact point.
  - **Object Ball**: Trajectory including **Spin-Induced Throw** (Gear Effect).
  - **Cue Ball Post-Collision**: Physics-based velocity integration for backspin (draw) and forward spin (follow), with delayed swerve at high power.

## Deployment & Sync
- **PWA**: Added `manifest.json` and `sw.js` for mobile installation.
- **GitHub**: Initialized Git repository and synced to private repo `Billiard-iCue`.
- **Artifacts**: All project brain files included in the `.brain/` folder in the repository.

## GPU Optimization (Mobile Fidelity)
To ensure high performance and low thermal load on mobile, we will transition to an "Unlit Baked" rendering pipeline:

### 1. Light-Free Environment
- **Action**: Delete all `THREE.Light` objects.
- **Table**: Replace `MeshStandardMaterial` with `MeshBasicMaterial`. The green gradient for light falloff will be procedural or baked into a `CanvasTexture`.
- **Cushions**: Use a wood-color gradient in `MeshBasicMaterial`.

### 2. Blob Shadows & Fake Reflections
- **Blob Shadows**: A circular `MeshBasicMaterial` plane with a radial alpha alpha-gradient (black center to 0.0 outer) will follow the balls.
- **Matcap Material**: A 2D "Matcap" texture (simulating a lit sphere) will be applied to the balls via `MeshMatcapMaterial`. This provides high-quality highlights without any real lights.

### 3. Resolution & Throughput
- **Resolution Scaling**: `renderer.setPixelRatio` will be clamped: `Math.min(window.devicePixelRatio, 1080 / Math.max(window.innerWidth, window.innerHeight))`.
- **Batching**: Use shared `MeshBasicMaterial` instances to minimize state changes.

## Shot Animation (Execution)
To bring the simulation to life, we will animate the balls along the pre-calculated paths:

### 1. Pre-Collision Animation
- **Trigger**: Click "SHOOT".
- **Movement**: Move the `cueBall` group index-by-index through the `aimLinePoints` array.
- **Speed**: Controlled by `power`.

### 2. Collision Event
- **Detection**: When the `cueBall` reachers `ghostPos`.
- **Action**:
  - Start the `objBall` movement along its predicted path.
  - Continue `cueBall` movement through the `cuePathPoints` (curved path).

### 3. State Management
- **Aiming State**: Normal interaction mode (default).
- **Shooting State**: Balls are moving. Disable aim/spin adjustments.
- **Finished State**: Balls have stopped. Show final positions. `RESET` clears the state.

## Verification Plan
1. Click "SHOOT" and verify the cue ball hits the object ball as intended.
2. Confirm the object ball follows the yellow line and the cue ball follows the red curve.
3. Verify that English effects (Draw/Follow) are visible in the movement.
4. Test that the "RESET" button correctly restores the table for the next shot.
