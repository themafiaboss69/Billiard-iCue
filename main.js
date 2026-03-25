import * as THREE from 'three';

// --- Application State ---
let aimAngle = 0; // Radians
let english = { x: 0, y: 0 }; // Normalized -1 to 1
let power = 50;
const ballRadius = 0.5;
const tableSize = 25;

// --- Three.js Setup ---
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false; // Required for scissor testing (split screen)
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Cameras
const aspect = window.innerWidth / (window.innerHeight / 2);
const camera3D = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
const cameraTop = new THREE.OrthographicCamera(-5, 5, 5 / aspect, -5 / aspect, 0.1, 100);
cameraTop.position.set(0, 10, 0);
cameraTop.up.set(0, 0, -1);
cameraTop.lookAt(0, 0, 0);

// Set up table
const floorGeo = new THREE.PlaneGeometry(tableSize, tableSize);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a5c38, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Balls
const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
const cueMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const cueBall = new THREE.Mesh(ballGeo, cueMat);
cueBall.position.set(0, ballRadius, 3);
scene.add(cueBall);

const objMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
const objBall = new THREE.Mesh(ballGeo, objMat);
objBall.position.set(0, ballRadius, -3);
scene.add(objBall);

const ghostBall = new THREE.Mesh(
    new THREE.SphereGeometry(ballRadius, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
);
scene.add(ghostBall);

// Trajectory Lines
const lineMatWhite = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const lineMatYellow = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
const lineMatRed = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 3 });

const aimLineObj = new THREE.Line(new THREE.BufferGeometry(), lineMatWhite);
const objLineObj = new THREE.Line(new THREE.BufferGeometry(), lineMatYellow);
const cueLineObj = new THREE.Line(new THREE.BufferGeometry(), lineMatRed);
const naturalLineObj = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
scene.add(aimLineObj);
scene.add(objLineObj);
scene.add(cueLineObj);
scene.add(naturalLineObj);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const light = new THREE.PointLight(0xffffff, 0.8);
light.position.set(0, 10, 0);
scene.add(light);

let showThrowVectors = false;
document.getElementById('show-throw-vectors').onchange = (e) => {
    showThrowVectors = e.target.checked;
    updateTrajectory();
};

const pockets = [
    { x: -5, z: -10 }, { x: 5, z: -10 }, // Top
    { x: -5, z: 0 }, { x: 5, z: 0 },   // Middle
    { x: -5, z: 10 }, { x: 5, z: 10 }   // Bottom
];
pockets.forEach(p => {
    const pocketGeo = new THREE.CircleGeometry(0.35, 32);
    const pocketMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const pocket = new THREE.Mesh(pocketGeo, pocketMat);
    pocket.rotation.x = -Math.PI / 2;
    pocket.position.set(p.x, 0.001, p.z);
    pocket.userData.isPocket = true;
    scene.add(pocket);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('touchstart', (e) => { if(e.touches.length > 0) onMouseDown(e.touches[0]); });

function onMouseDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Choose camera based on click position
    const cam = event.clientY > window.innerHeight / 2 ? cameraTop : camera3D;
    raycaster.setFromCamera(mouse, cam);
    
    const intersects = raycaster.intersectObjects(scene.children);
    for (let intersect of intersects) {
        if (intersect.object.userData.isPocket) {
            autoAimToPocket(intersect.object.position);
            return;
        }
    }
}

function autoAimToPocket(pocketPos) {
    // User's Ghost Ball logic
    const dx = pocketPos.x - objBall.position.x;
    const dz = pocketPos.z - objBall.position.z;
    const dist = Math.hypot(dx, dz);
    const dirX = dx / dist;
    const dirZ = dz / dist;
    
    const ghostX = objBall.position.x - (dirX * ballRadius * 2);
    const ghostZ = objBall.position.z - (dirZ * ballRadius * 2);
    
    const aimDx = ghostX - cueBall.position.x;
    const aimDz = ghostZ - cueBall.position.z;
    aimAngle = Math.atan2(aimDx, -aimDz);
    updateTrajectory();
}

// --- Math & Trajectory Calculation ---
function updateTrajectory() {
    const aimDir = new THREE.Vector3(Math.sin(aimAngle), 0, -Math.cos(aimAngle)).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const powerFactor = power / 50.0;
    
    // --- Pre-Collision Path (Squirt & Swerve / Dr. Dave Physics) ---
    // Squirt (Deflection): Ball initially travels opposite to side spin
    // Left spin (-x) mathematically should squirt right (+x).
    const squirtAngle = english.x * 0.05; // -1 * 0.05 = -0.05 rad. Applied to -Z around Y, yields +X (Right)
    const initialCutDir = aimDir.clone().applyAxisAngle(up, squirtAngle).normalize();
    
    let currentPreVelocity = initialCutDir.clone().multiplyScalar(2.0 * powerFactor);
    
    // Swerve: Ball curves back towards the direction of side spin
    const trueRightDir = new THREE.Vector3().crossVectors(aimDir, up).normalize();
    // Swerve force acts as constant friction. Left (-x) english curves Left (-x direction).
    const swerveForcePre = trueRightDir.clone().multiplyScalar(english.x * 0.015);
    
    let aimLinePoints = [cueBall.position.clone()];
    let currentPrePos = cueBall.position.clone();
    let hit = false;
    let ghostPos = new THREE.Vector3();
    const timeStepPre = 0.5;
    
    for (let i = 0; i < 200; i++) {
        currentPreVelocity.add(swerveForcePre);
        currentPrePos.addScaledVector(currentPreVelocity, timeStepPre);
        aimLinePoints.push(currentPrePos.clone());
        
        let distSq = currentPrePos.distanceToSquared(objBall.position);
        if (distSq <= (ballRadius * 2) * (ballRadius * 2)) {
            hit = true;
            // Backtrack to exact radius boundary for perfect ghost ball position
            let dist = Math.sqrt(distSq);
            let overlap = (ballRadius * 2) - dist;
            let vNormalized = currentPreVelocity.clone().normalize();
            ghostPos = currentPrePos.clone().sub(vNormalized.multiplyScalar(overlap));
            
            aimLinePoints[aimLinePoints.length - 1] = ghostPos;
            break;
        }
        
        // Friction
        currentPreVelocity.multiplyScalar(0.98);
        swerveForcePre.multiplyScalar(0.98);
        
        if (currentPreVelocity.lengthSq() < 0.001) break;
    }
    
    aimLineObj.geometry.setFromPoints(aimLinePoints);
    
    let objPathEnd = new THREE.Vector3();
    let cuePathPoints = [];
    
    if (hit) {
        ghostBall.position.copy(ghostPos);
        ghostBall.visible = true;
        
        // --- Object Ball Physics (SIT, CIT, CIT-Deviation) ---
        const collisionNormal = new THREE.Vector3().subVectors(objBall.position, ghostPos).normalize();
        
        // 1. Collision-Induced Throw (CIT): Friction towards the cue ball's tangent
        // 2. Spin-Induced Throw (SIT): Friction opposite to cue ball's side spin
        const cutFactor = Math.abs(effectiveAimDir.dot(collisionNormal)); // 1.0 = straight, 0.0 = paper thin
        
        // SIT is maximized at slow speeds and thicker hits
        const sitStrength = (1.0 / (0.5 + currentPreVelocity.length())) * cutFactor;
        const sitAngle = english.x * sitStrength * (6 * Math.PI / 180); 
        
        // CIT: Slight deviation (1-3 degrees) in the direction of the cut
        const citDirection = new THREE.Vector3().crossVectors(collisionNormal, up).normalize();
        const citSign = effectiveAimDir.dot(citDirection) > 0 ? 1 : -1;
        const citAngle = citSign * (1.5 * Math.PI / 180); // Fixed 1.5 deg for now
        
        const finalThrowAngle = sitAngle + citAngle;
        const objDir = collisionNormal.clone().applyAxisAngle(up, finalThrowAngle).normalize();
        
        // Speed Transfer: v_object = v_cue * cos(theta)
        const vCuePre = currentPreVelocity.length();
        const cosTheta = Math.abs(effectiveAimDir.dot(collisionNormal));
        const vObjPost = vCuePre * cosTheta;
        
        objPathEnd.copy(objBall.position).addScaledVector(objDir, 10 * (vObjPost / 2.0));
        objLineObj.geometry.setFromPoints([objBall.position, objPathEnd]);
        
        // Debug Vectors
        if (showThrowVectors) {
            // Natural path (Line of Centers)
            const naturalPathEnd = objBall.position.clone().addScaledVector(collisionNormal, 10 * (vObjPost / 2.0));
            naturalLineObj.geometry.setFromPoints([objBall.position, naturalPathEnd]);
            naturalLineObj.visible = true;
        } else {
            naturalLineObj.visible = false;
        }

        // --- Cue Ball Post-Collision line (Stun + Swerve/Draw/Follow) ---
        let tangent1 = new THREE.Vector3().crossVectors(up, collisionNormal).normalize();
        let tangent2 = new THREE.Vector3().crossVectors(collisionNormal, up).normalize();
        let tangentDir = tangent1.dot(effectiveAimDir) > tangent2.dot(effectiveAimDir) ? tangent1 : tangent2;
        
        const stunSpeed = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta)) * vCuePre; 
        
        cuePathPoints.push(ghostPos.clone());
        let currentPos = ghostPos.clone();
        
        // Initial velocity is EXACTLY on the tangent line (90 degrees)
        let currentVelocity = tangentDir.clone().multiplyScalar(stunSpeed);
        
        // Spin friction force is constant cloth grip!
        let spinForceY = effectiveAimDir.clone().multiplyScalar(english.y * 0.15);
        let spinForceX = trueRightDir.clone().multiplyScalar(english.x * 0.08); 
        let spinForce = new THREE.Vector3().addVectors(spinForceY, spinForceX);
        
        for (let i = 1; i <= 150; i++) {
            currentVelocity.add(spinForce);
            currentPos.addScaledVector(currentVelocity, 0.5);
            
            currentVelocity.multiplyScalar(0.85); 
            spinForce.multiplyScalar(0.96);
            
            if (currentVelocity.lengthSq() < 0.001 && spinForce.lengthSq() < 0.001) break;
            cuePathPoints.push(currentPos.clone());
        }
        if (cuePathPoints.length === 1) cuePathPoints.push(ghostPos.clone().add(new THREE.Vector3(0,0.01,0)));
        cueLineObj.geometry.setFromPoints(cuePathPoints);
    } else {
        objLineObj.geometry.setFromPoints([]);
        cueLineObj.geometry.setFromPoints([]);
        ghostBall.visible = false;
    }
    
    updateCameras();
}

function updateCameras() {
    // 3D Camera follows behind cue ball along aim vector
    const aimDir = new THREE.Vector3(Math.sin(aimAngle), 0, -Math.cos(aimAngle)).normalize();
    const cameraOffset = new THREE.Vector3().copy(aimDir).negate().multiplyScalar(4).add(new THREE.Vector3(0, 2, 0));
    camera3D.position.copy(cueBall.position).add(cameraOffset);
    camera3D.lookAt(cueBall.position.clone().addScaledVector(aimDir, 2));

    // Top Camera centered statically or dynamically follow balls
    cameraTop.position.x = (cueBall.position.x + objBall.position.x) / 2;
    cameraTop.position.z = (cueBall.position.z + objBall.position.z) / 2;
}

// --- Input Handling ---
let isAiming = false;
let lastTouchX = 0;

document.getElementById('ui-overlay').addEventListener('pointerdown', (e) => {
    // Only drag aim if we hit the empty background
    if (e.target.id === 'ui-overlay') {
        isAiming = true;
        lastTouchX = e.clientX;
    }
});

window.addEventListener('pointermove', (e) => {
    if (isAiming) {
        let deltaX = e.clientX - lastTouchX;
        aimAngle -= deltaX * 0.005; // Pan sensitivity
        lastTouchX = e.clientX;
        updateTrajectory();
    }
});

window.addEventListener('pointerup', () => { isAiming = false; });

// Power System
document.getElementById('power-slider').addEventListener('input', (e) => { 
    power = e.target.value; 
    updateTrajectory();
});

// English (Spin) System
const eBall = document.getElementById('english-ball');
const eDot = document.getElementById('english-dot');
let isEnglishDragging = false;

eBall.addEventListener('pointerdown', (e) => {
    isEnglishDragging = true;
    updateEnglishFromEvent(e);
});

window.addEventListener('pointermove', (e) => {
    if (isEnglishDragging) updateEnglishFromEvent(e);
});

window.addEventListener('pointerup', () => { isEnglishDragging = false; });

function updateEnglishUI() {
    // Limit precision to reduce jitter
    english.x = Math.round(english.x * 100) / 100;
    english.y = Math.round(english.y * 100) / 100;
    
    // Update visual dot positioning (center is 50%, 50%)
    // The usable radius is 75% of half-width (40px) = 30px
    // Using percentages: 30px out of 40px radius is exactly 75%.
    // Therefore, half the element width is 50%. 75% of that 50% is 37.5%.
    const offsetPerc = 37.5; 
    eDot.style.left = (50 + english.x * offsetPerc) + '%';
    eDot.style.top = (50 - english.y * offsetPerc) + '%';
    
    updateTrajectory();
}

function updateEnglishFromEvent(e) {
    const rect = eBall.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let nx = (e.clientX - cx) / (rect.width / 2);
    let ny = -(e.clientY - cy) / (rect.height / 2);
    
    // Constrain to circle
    let len = Math.sqrt(nx*nx + ny*ny);
    if (len > 1) { nx /= len; ny /= len; }
    
    english.x = nx;
    english.y = ny;
    updateEnglishUI();
}

// Fine Tune Controls
const tuneStep = 0.05;
document.getElementById('english-up').onclick = () => { english.y = Math.min(1, english.y + tuneStep); updateEnglishUI(); }
document.getElementById('english-down').onclick = () => { english.y = Math.max(-1, english.y - tuneStep); updateEnglishUI(); }
document.getElementById('english-left').onclick = () => { english.x = Math.max(-1, english.x - tuneStep); updateEnglishUI(); }
document.getElementById('english-right').onclick = () => { english.x = Math.min(1, english.x + tuneStep); updateEnglishUI(); }
document.getElementById('english-center').onclick = () => { 
    english.x = 0; english.y = 0; 
    aimAngle = 0; // The user requested to "adjust it there" so we center the aim too.
    updateEnglishUI(); 
};

document.getElementById('aim-left').onclick = () => { aimAngle += 0.01; updateTrajectory(); }
document.getElementById('aim-center').onclick = () => { aimAngle = 0; updateTrajectory(); }
document.getElementById('aim-right').onclick = () => { aimAngle -= 0.01; updateTrajectory(); }

document.getElementById('reset-button').onclick = () => {
    cueBall.position.set(0, ballRadius, 3);
    objBall.position.set(0, ballRadius, -3);
    aimAngle = 0;
    english = { x: 0, y: 0 };
    document.getElementById('power-slider').value = 50;
    power = 50;
    updateEnglishUI();
    updateTrajectory();
};

document.getElementById('shoot-button').onclick = () => {
    // In V1, 'Shoot' could animate the spheres. For now, it simply randomizes the next shot 
    // or can be hooked up to an animation loop.
    alert(`Shot executed! Power: ${power}, Spin: (${english.x}, ${english.y})`);
};

// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfH = height / 2;
    
    // Top Camera View (3D Third-Person)
    renderer.setViewport(0, halfH, width, halfH);
    renderer.setScissor(0, halfH, width, halfH);
    renderer.setScissorTest(true);
    renderer.render(scene, camera3D);
    
    // Bottom Camera View (Top-Down)
    renderer.setViewport(0, 0, width, halfH);
    renderer.setScissor(0, 0, width, halfH);
    renderer.setScissorTest(true);
    renderer.render(scene, cameraTop);
}

// Window resize handling
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    
    const aspect3D = w / (h / 2);
    camera3D.aspect = aspect3D;
    camera3D.updateProjectionMatrix();
    
    const aspectTop = w / (h / 2);
    const viewSize = 7;
    cameraTop.left = -viewSize * aspectTop;
    cameraTop.right = viewSize * aspectTop;
    cameraTop.top = viewSize;
    cameraTop.bottom = -viewSize;
    cameraTop.updateProjectionMatrix();
});

// Init
updateControlsUIBasedOnScreen();
updateEnglishUI();
animate();

function updateControlsUIBasedOnScreen() {
    // Force initial correct aspect calculation
    window.dispatchEvent(new Event('resize'));
}
