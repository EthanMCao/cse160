import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader }     from 'three/addons/loaders/RGBELoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x8fa8c8, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 10, 28);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance   = 3;
controls.maxDistance   = 90;
controls.maxPolarAngle = Math.PI / 2 + 0.05; // prevent going underground

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// HDR skybox from Polyhaven – used as both background and environment lighting
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/autumn_field_1k.hdr',
    (hdr) => {
        hdr.mapping       = THREE.EquirectangularReflectionMapping;
        scene.background  = hdr;
        scene.environment = hdr;
        document.getElementById('loading').style.display = 'none';
    },
    undefined,
    () => {
        scene.background = new THREE.Color(0x7ab8d8); // fallback if network fails
        document.getElementById('loading').style.display = 'none';
    }
);

// Procedural canvas textures
function canvasTex(drawFn, size = 256) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    drawFn(cv.getContext('2d'), size);
    return new THREE.CanvasTexture(cv);
}

const grassTex = canvasTex((ctx, s) => {
    ctx.fillStyle = '#4a7c4e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2500; i++) {
        const g = 80 + Math.random() * 70 | 0;
        ctx.fillStyle = `rgb(20,${g},30)`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, Math.random() * 7 + 2);
    }
});
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(12, 12);

const stoneTex = canvasTex((ctx, s) => {
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
        const v = (Math.random() * 80 + 60) | 0;
        ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
        ctx.fillRect(Math.random() * s, Math.random() * s, Math.random() * 14 + 3, Math.random() * 14 + 3);
    }
    ctx.strokeStyle = 'rgba(30,30,30,0.15)';
    for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * s, Math.random() * s);
        ctx.lineTo(Math.random() * s, Math.random() * s);
        ctx.lineWidth = Math.random() * 1.5;
        ctx.stroke();
    }
});

const crystalTex = canvasTex((ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0,   '#a0d8ef');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1,   '#5b9bd5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++)
        ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
});

const waterTex = canvasTex((ctx, s) => {
    ctx.fillStyle = '#0e3a5c';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(80,160,220,0.4)';
    for (let i = 0; i < 25; i++) {
        ctx.lineWidth = Math.random() * 1.5 + 0.5;
        ctx.beginPath();
        ctx.ellipse(Math.random() * s, Math.random() * s,
                    Math.random() * 35 + 8, Math.random() * 15 + 4,
                    Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
    }
});
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(4, 4);

const mGround  = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85 });
const mStone   = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 });
const mCrystal = new THREE.MeshStandardMaterial({
    map: crystalTex, transparent: true, opacity: 0.82,
    roughness: 0.05, metalness: 0.2,
    emissive: new THREE.Color(0x2255cc), emissiveIntensity: 0.3
});
const mWater = new THREE.MeshStandardMaterial({
    map: waterTex, transparent: true, opacity: 0.72,
    roughness: 0.08, metalness: 0.1
});
const mOrb = new THREE.MeshStandardMaterial({
    roughness: 0, metalness: 0.1, transparent: true, opacity: 0.88
});

function shadowed(mesh) {
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    return mesh;
}
function mesh(geo, mat) { return shadowed(new THREE.Mesh(geo, mat)); }

// Ground
const ground = mesh(new THREE.PlaneGeometry(120, 120), mGround);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Pond
const pond = mesh(new THREE.CircleGeometry(5.5, 40), mWater);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-6, 0.06, -5);
scene.add(pond);

// Boulders
[
    [ 4.5, -8.5, 0.2, 0.5, 0.1, 1.3, 0.85, 1.1],
    [-7.5,  5.5, 0.1, 1.0, 0.3, 0.9, 0.65, 0.9],
    [11.5, 11.5, 0.3, 0.2, 0.5, 1.6, 1.05, 1.3],
    [-4.0,-12.5, 0.5, 0.4, 0.2, 0.7, 0.55, 0.8],
    [ 7.5, -2.5, 0.2, 0.8, 0.1, 0.65, 0.4, 0.7],
].forEach(([x, z, rx, ry, rz, sx, sy, sz]) => {
    const r = mesh(new THREE.SphereGeometry(1, 6, 5), mStone.clone());
    r.position.set(x, sy * 0.5, z);
    r.rotation.set(rx, ry, rz);
    r.scale.set(sx, sy, sz);
    scene.add(r);
});

// Ancient stone columns
[[-3, 6], [3, 6], [-3, -14], [3, -14]].forEach(([x, z]) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.42, 0.52, 5.5, 12), mStone)
        .translateX(x).translateY(2.75).translateZ(z));
    scene.add(mesh(new THREE.BoxGeometry(1.25, 0.45, 1.25), mStone)
        .translateX(x).translateY(5.72).translateZ(z));
});

// Stone gate
scene.add(mesh(new THREE.CylinderGeometry(0.37, 0.42, 7.5, 12), mStone)
    .translateX(-2.8).translateY(3.75).translateZ(11));
scene.add(mesh(new THREE.CylinderGeometry(0.37, 0.42, 7.5, 12), mStone)
    .translateX( 2.8).translateY(3.75).translateZ(11));
scene.add(mesh(new THREE.BoxGeometry(6.8, 0.55, 0.75), mStone)
    .translateY(7.52).translateZ(11));

// Crystal spires
const crystals = [];
[[-6.2, -4.0, 2.6, 0.0], [-6.9, -4.4, 1.9, 0.5],
 [-5.6, -4.7, 2.1, 1.2], [ 9.2,-10.3, 3.1, 0.3],
 [ 9.8,-10.7, 2.3, 0.8]].forEach(([x, z, h, ry]) => {
    const m = mesh(new THREE.ConeGeometry(0.32, h, 6), mCrystal.clone());
    m.position.set(x, h / 2, z);
    m.rotation.y = ry;
    scene.add(m);
    crystals.push(m);
});

// Stepping stones
[[0, 2.5], [1.6, 0.8], [3.1, -0.8], [4.6, -2.3], [6.1, -3.8]].forEach(([x, z]) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.22, 8), mStone)
        .translateX(x).translateY(0.11).translateZ(z));
});

// Portal ring
const portalMat = new THREE.MeshStandardMaterial({
    color: 0xaabbff, emissive: new THREE.Color(0x3355ff),
    emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.5
});
const portal = mesh(new THREE.TorusGeometry(2.5, 0.18, 12, 48), portalMat);
portal.position.set(0, 4, -8);
scene.add(portal);

// Floating orbs
const orbObjects = [];
for (let i = 0; i < 6; i++) {
    const mat = mOrb.clone();
    const hue = i / 6;
    mat.color.setHSL(hue, 0.7, 0.65);
    mat.emissive = new THREE.Color().setHSL(hue, 0.9, 0.5);
    mat.emissiveIntensity = 1.4;

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), mat);
    orb.userData = {
        angle:     (i / 6) * Math.PI * 2,
        radius:    4.2 + Math.random() * 2.0,
        speed:     0.28 + Math.random() * 0.18,
        bobOffset: Math.random() * Math.PI * 2,
        bobSpeed:  0.9 + Math.random() * 0.6,
        bobHeight: 3.5 + Math.random() * 2.5,
    };

    const pl = new THREE.PointLight(mat.emissive, 1.8, 9);
    orb.add(pl);
    scene.add(orb);
    orbObjects.push(orb);
}

// Sun sphere (moves with the directional light during day/night cycle)
const sunSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffef88 })
);
scene.add(sunSphere);

// Lights
const ambientLight = new THREE.AmbientLight(0x334466, 0.55);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.7);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfffbe8, 1.6);
dirLight.position.set(30, 45, -50);
dirLight.castShadow            = true;
dirLight.shadow.mapSize.width  = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near    = 0.5;
dirLight.shadow.camera.far     = 200;
dirLight.shadow.camera.left    = -50;
dirLight.shadow.camera.right   =  50;
dirLight.shadow.camera.top     =  50;
dirLight.shadow.camera.bottom  = -50;
dirLight.shadow.bias           = -0.001;
scene.add(dirLight);

const lanternLight = new THREE.PointLight(0xff8822, 2.5, 22);
lanternLight.position.set(0, 5.5, 11);
lanternLight.castShadow = true;
scene.add(lanternLight);

const spotLight = new THREE.SpotLight(0x66aaff, 4, 35, Math.PI / 7, 0.35);
spotLight.position.set(-6, 12, -5);
spotLight.target.position.set(-6.5, 0, -5);
spotLight.castShadow = true;
scene.add(spotLight);
scene.add(spotLight.target);

// 3-D models – loaded once, cloned per instance
const gltfLoader = new GLTFLoader();

function placeClone(src, srcBox, targetH, x, z, rotY = 0) {
    const size  = srcBox.getSize(new THREE.Vector3());
    const scale = targetH / Math.max(size.x, size.y, size.z);
    const clone = src.clone(true);
    clone.scale.setScalar(scale);
    clone.position.set(x, -srcBox.min.y * scale, z);
    clone.rotation.y = rotY;
    clone.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    scene.add(clone);
    return clone;
}

gltfLoader.load('./models/Tree-2.glb', (gltf) => {
    const src = gltf.scene;
    const box = new THREE.Box3().setFromObject(src);
    [
        [  9,   8, 6.5, 0.3], [-11,   7, 6.0, 1.2],
        [ 13,  -8, 7.0, 0.5], [ -9, -10, 5.5, 2.1],
        [ 16,   3, 6.5, 0.8], [-16,  -4, 7.0, 1.5],
        [  5, -15, 5.5, 0.2], [-13,  13, 6.0, 1.8],
        [  7,  15, 5.8, 0.6], [ -7,  15, 6.0, 1.1],
        [ 20,  -3, 7.0, 2.5],
    ].forEach(([x, z, h, r]) => placeClone(src, box, h, x, z, r));
}, undefined, (e) => console.warn('Tree-2.glb:', e.message));

gltfLoader.load('./models/Mushroom.glb', (gltf) => {
    const src = gltf.scene;
    const box = new THREE.Box3().setFromObject(src);
    [
        [ 3.2,  3.3, 1.4, 0.4], [ 4.1,  4.0, 0.9, 1.8],
        [-3.0,  8.0, 1.8, 0.2], [ 9.5, -3.5, 1.5, 2.7],
        [-8.5,  2.5, 1.2, 1.0], [ 2.0, -6.5, 1.6, 0.9],
    ].forEach(([x, z, h, r]) => placeClone(src, box, h, x, z, r));
}, undefined, (e) => console.warn('Mushroom.glb:', e.message));

gltfLoader.load('./models/PostLantern.glb', (gltf) => {
    const src = gltf.scene;
    const box = new THREE.Box3().setFromObject(src);
    [
        [-2.8, 12.5, 4.5, 0.0], [ 2.8, 12.5, 4.5, Math.PI],
        [-3.5,   6,  4.0, 0.5], [ 3.5,   6,  4.0, 3.7],
        [-3.5, -14,  4.0, 1.0], [ 3.5, -14,  4.0, 2.2],
    ].forEach(([x, z, h, r]) => placeClone(src, box, h, x, z, r));
}, undefined, (e) => console.warn('PostLantern.glb:', e.message));

gltfLoader.load('./models/vase.glb', (gltf) => {
    const src = gltf.scene;
    const box = new THREE.Box3().setFromObject(src);
    placeClone(src, box, 2.5, -6, -5.5, 0);
    const ped = mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.5, 12), mStone);
    ped.position.set(-6, 0.25, -5.5);
    scene.add(ped);
}, undefined, (e) => console.warn('vase.glb:', e.message));

let fishGroup = null;
let fishAngle = 0;
gltfLoader.load('./models/Goldfish.glb', (gltf) => {
    const model = gltf.scene;
    const box   = new THREE.Box3().setFromObject(model);
    const size  = box.getSize(new THREE.Vector3());
    const scale = 0.8 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.set(0, -box.min.y * scale - 0.1, 0);
    model.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    fishGroup = new THREE.Group();
    fishGroup.add(model);
    scene.add(fishGroup);
}, undefined, (e) => console.warn('Goldfish.glb:', e.message));

// Day/night cycle colour targets
const dayNight = {
    day:   { hemiSky: 0x87ceeb, hemiGnd: 0x3a5a2a, dirCol: 0xfffbe8, dirInt: 1.6, ambInt: 0.55 },
    night: { hemiSky: 0x0a0d1a, hemiGnd: 0x0a1206, dirCol: 0x3344aa, dirInt: 0.3, ambInt: 0.15 },
};

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    const cycleT    = (t % 80) / 80;
    const sunAngle  = cycleT * Math.PI * 2 - Math.PI / 2;
    const dayFactor = Math.max(0, Math.sin(sunAngle)); // 0 = night, 1 = full day

    dirLight.position.set(Math.cos(sunAngle) * 60, Math.sin(sunAngle) * 60, -30);
    sunSphere.position.copy(dirLight.position);

    dirLight.color.lerpColors(new THREE.Color(dayNight.night.dirCol), new THREE.Color(dayNight.day.dirCol), dayFactor);
    dirLight.intensity = dayNight.night.dirInt + (dayNight.day.dirInt - dayNight.night.dirInt) * dayFactor;

    hemiLight.color.lerpColors(new THREE.Color(dayNight.night.hemiSky), new THREE.Color(dayNight.day.hemiSky), dayFactor);
    hemiLight.groundColor.lerpColors(new THREE.Color(dayNight.night.hemiGnd), new THREE.Color(dayNight.day.hemiGnd), dayFactor);
    ambientLight.intensity = dayNight.night.ambInt + (dayNight.day.ambInt - dayNight.night.ambInt) * dayFactor;

    scene.fog.color.lerpColors(new THREE.Color(0x050812), new THREE.Color(0x8fa8c8), dayFactor);
    renderer.setClearColor(scene.fog.color);

    const nightBoost = 1 - dayFactor; // orbs glow brighter at night
    orbObjects.forEach((orb) => {
        const d = orb.userData;
        d.angle += d.speed * 0.016;
        orb.position.x = Math.cos(d.angle) * d.radius;
        orb.position.z = Math.sin(d.angle) * d.radius;
        orb.position.y = d.bobHeight + Math.sin(t * d.bobSpeed + d.bobOffset) * 1.3;
        const pulse = (Math.sin(t * 2.2 + d.angle) + 1) * 0.5;
        orb.material.emissiveIntensity = 0.8 + pulse * 1.4 + nightBoost * 1.2;
        orb.material.opacity           = 0.75 + nightBoost * 0.2;
        if (orb.children[0]) orb.children[0].intensity = 1.2 + pulse + nightBoost * 2;
    });

    crystals.forEach((c, i) => {
        const pulse = (Math.sin(t * 1.6 + i * 0.75) + 1) * 0.5;
        c.material.emissiveIntensity = 0.1 + pulse * 0.55 + nightBoost * 0.4;
        const s = 1 + pulse * 0.09;
        c.scale.set(s, 1, s);
    });

    portal.rotation.z = t * 0.4;
    portal.rotation.y = Math.sin(t * 0.3) * 0.25;

    waterTex.offset.x = t * 0.018;
    waterTex.offset.y = t * 0.012;

    lanternLight.intensity = 2.0 + Math.sin(t * 7.3) * 0.35 + Math.sin(t * 13.1) * 0.15;

    if (fishGroup) {
        fishAngle += 0.008;
        fishGroup.position.x = -6 + Math.cos(fishAngle) * 3.2;
        fishGroup.position.z = -5 + Math.sin(fishAngle) * 3.2;
        fishGroup.position.y = 0.08 + Math.sin(t * 1.8) * 0.06;
        fishGroup.rotation.y = -fishAngle + Math.PI / 2; // face direction of travel
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
