# Billiard Cue Ball Guide - Walkthrough

## What was built
I've implemented the V1 Billiard physics guide using Vanilla JavaScript and **Three.js**. Because `npm` was unavailable in the current terminal state, I bypassed the Vite setup and built it purely using HTML/JS/CSS with Three.js imported via CDNs. This makes the app incredibly portable and easy to run anywhere.

### Visuals & UI
1. **Realistic Table Design**: 
   - The table now features a proper **2:1 aspect ratio** (standard for pool).
   - Added **3D Wood Rails** (cushions) that create a physical boundary for the scene.
   - Includes **Pockets** and the **Head Spot** marking for authentic alignment.
2. **Optimized UI Layout (v16)**:
   - **Enlarged UI**: The **NEAR**, **MED**, and **FAR** buttons are now 30% larger, and the **English Spin Ball** has been upscaled to 110px for easier thumb interaction.
   - **Bigger 3D Balls**: The pool balls have been enlarged (0.6 radius) to improve visibility on the long table.
   - **Seamless Cue Stick**: The wood shaft taper is perfectly flush with the ferrule and tip.
   - **Cache Fix**: Bumped the version to `v=16` to force-load the new larger UI and ball physics.
   - **Action Buttons**: `RESET` (top-left) and `SHOOT` (bottom-right) are ergonomically placed.
### Mobile GPU Optimization (v5)
3. **High-Fidelity Rendering (Light-Free)**:
   - **No Real Lights**: Removed all real-time lights, which previously caused GPU drain on mobile.
   - **Matcap Reflections**: The balls now use **Matcap Shaders** to simulate beautiful specular highlights and reflections without needing any light calculations.
   - **Blob Shadows**: Instead of expensive shadow mapping, I implemented **Blob Drop Shadows** using radial gradient sprites that follow the balls perfectly.
   - **Resolution Scaling**: The app now automatically clamps the render resolution to **1080p max**. This prevents your phone from overheating or throttling on high-DPI screens like the iPhone 14 Pro.
   - **Baked Environment**: The table felt and wood rails use unlit materials with "baked-in" gradients to simulate top-down lighting at zero cost.
5. **Physics & Prediction Lines**:
   - **White Line**: The line from the cue ball to the predicted "Ghost Ball" impact location.
   - **Yellow Line**: The object ball's trajectory. This line now includes **Spin-Induced Throw**. If you apply Left English, the object ball will be slightly thrown to the right of the collision normal, and vice-versa.
   - **Red Line**: The post-impact tangent line for the cue ball. When you apply Top English (Follow), this red line curves gracefully forward. When you apply Bottom English (Draw), it curves backward. Left and right english also slightly affect throw angles.
2. **Aim Controls**: You can drag anywhere on the screen to rotate your aim angle. There are also fine-tune `Left` and `Right` buttons at the bottom.
3. **English (Spin) Controls**: The bottom-left features a mini cue ball mapping. Drag the red dot to apply spin (Top/Follow, Bottom/Draw, Left/Right). Fine-tune buttons (arrows and center) are included for precise adjustments.
4. **Power System**: A vertical slider on the right to adjust shot power (1-100).
5. **Physics & Prediction Lines**:
   - **White Line**: The line from the cue ball to the predicted "Ghost Ball" impact location.
   - **Yellow Line**: The object ball's trajectory. This line now includes **Spin-Induced Throw**. If you apply Left English, the object ball will be slightly thrown to the right of the collision normal, and vice-versa.
   - **Red Line**: The post-impact tangent line for the cue ball. When you apply Top English (Follow), this red line curves gracefully forward. When you apply Bottom English (Draw), it curves backward. Left and right english also slightly affect throw angles.

### Expert Physics & Targeting
4. **Pocket Targeting**: Tap any of the 6 pocket markers on the table. The app will automatically calculate the **Ghost Ball** position required to pot the ball and align your cue exactly!
5. **Advanced Physics (SIT & CIT)**:
   - **CIT (Collision-Induced Throw)**: Includes the physics of friction between balls, deviating the object ball slightly in the direction of the hit.
   - **SIT (Spin-Induced Throw)**: English side-spin now physically "throws" the object ball in the opposite direction.
   - **Throw Vectors**: Enable the "Show Throw Vectors" toggle to see the difference between the "Natural Path" (line of centers) and the "Actual Path" (including throw).
6. **Speed Transfer**: The lines now dynamically scale their length based on the cut angle—thin cuts result in much slower object ball speeds, exactly matching the $\cos(\theta)$ energy transfer rule.

## Mobile Installation Guide

### 1. Publishing to the Web (GitHub Pages)
To host your app for free and make it installable:
1. Go to your repository: `https://github.com/themafiaboss69/Billiard-iCue`
2. Click **Settings** -> **Pages**.
3. Under **Branch**, select `main` and `/ (root)`. Click **Save**.
4. Your app will be live at: `https://themafiaboss69.github.io/Billiard-iCue/` (wait 1 minute).

### 2. Installing on iOS (iPhone/iPad)
1. Open the URL above in **Safari**.
2. Tap the **Share** button (Square with Up arrow).
3. Select **Add to Home Screen**.
4. Launch "iCue" from your home screen for a full-screen app experience!

### 3. Installing on Android
1. Open the URL above in **Google Chrome**.
2. Tap the **Three Dots** menu -> **Install App**.
3. Open from your home screen/app drawer.

---

## Final Verification Checklist
1. **Cue Stick**: Verify the seamless shaft, white ferrule, and blue tip.
2. **Animation**: Click **SHOOT** to see the 60fps Ease-In strike and True-Roll physics.
3. **English**: Confirm the **SPIN** D-Pad layout is a perfect cross.
4. **Throw**: Check "Show Throw Vectors" to see the natural 90° path vs the physics-corrected trajectory.
5. **Offline**: Once installed, the app works without internet thanks to the v11 Service Worker.
