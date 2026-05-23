/**
 * robot3d.js — Robot humanoide articulado con Three.js
 * Esqueleto completo: cabeza, columna, brazos (hombro+codo), caderas, piernas (rodilla)
 * Todo sigue el cursor con interpolación suave (lerp)
 */
(function () {
  const container = document.getElementById('robot-container');
  const canvas    = document.getElementById('robot-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  // ── Renderer ──────────────────────────────────
  const W = container.clientWidth;
  const H = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ── Scene + Camera ─────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.set(0, 0.8, 7.5);
  camera.lookAt(0, 0.8, 0);

  // ── Lights ────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaabbff, 0.35);
  fill.position.set(-3, 2, -3);
  scene.add(fill);

  const amber = new THREE.PointLight(0xe8a230, 1.2, 10);
  amber.position.set(0, 1, 3.5);
  scene.add(amber);

  // ── Materials ──────────────────────────────────
  const mBody   = new THREE.MeshPhongMaterial({ color: 0xdedede, specular: 0x999999, shininess: 100 });
  const mDark   = new THREE.MeshPhongMaterial({ color: 0x111111, specular: 0x444444, shininess: 60  });
  const mAccent = new THREE.MeshPhongMaterial({ color: 0xe8a230, emissive: 0x3a2000, shininess: 120 });
  const mGlow   = new THREE.MeshPhongMaterial({ color: 0xe8a230, emissive: 0xe8a230, shininess: 200 });

  // ── Helpers ────────────────────────────────────
  const node  = ()        => new THREE.Object3D();
  const box   = (w,h,d,m) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d,1,1,1), m);
  const cyl   = (r,h,s,m) => new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,h,s), m);
  const sph   = (r,s,m)   => new THREE.Mesh(new THREE.SphereGeometry(r,s,s), m);
  const disk  = (r,h,s,m) => new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,s), m);

  const place = (obj, x, y, z) => { obj.position.set(x,y,z); return obj; };
  const add   = (parent, ...children) => { children.forEach(c => parent.add(c)); return parent; };

  // ── Robot root ─────────────────────────────────
  const root = new THREE.Group();
  root.position.y = 1.85; // centra verticalmente en la cámara
  scene.add(root);

  // ── HIPS ──────────────────────────────────────
  const hips = node();
  root.add(hips);

  const hipsMesh = box(0.62, 0.28, 0.36, mBody);
  hips.add(hipsMesh);

  // Hip detail lines
  const hipLine = box(0.44, 0.04, 0.04, mAccent);
  hipLine.position.set(0, 0.02, 0.18);
  hips.add(hipLine);

  // ── SPINE → CHEST ─────────────────────────────
  const spine = node(); spine.position.y = 0.22;
  hips.add(spine);

  const chest = node(); chest.position.y = 0.28;
  spine.add(chest);

  // Torso mesh (tapered — más ancho arriba)
  const torsoGeo = new THREE.BoxGeometry(0.76, 0.78, 0.4);
  const torsoMesh = new THREE.Mesh(torsoGeo, mBody);
  torsoMesh.position.y = 0.08;
  chest.add(torsoMesh);

  // Chest arc detail
  const chestArc = box(0.52, 0.06, 0.04, mAccent);
  chestArc.position.set(0, 0.22, 0.21);
  chest.add(chestArc);

  // Chest circle / reactor
  const reactorBase = disk(0.14, 0.04, 20, mDark);
  reactorBase.rotation.x = Math.PI / 2;
  reactorBase.position.set(0, 0.04, 0.21);
  chest.add(reactorBase);

  const reactorGlow = disk(0.07, 0.06, 16, mGlow);
  reactorGlow.rotation.x = Math.PI / 2;
  reactorGlow.position.set(0, 0.04, 0.22);
  chest.add(reactorGlow);

  // Collar bone strip
  const collarL = box(0.22, 0.06, 0.06, mDark);
  collarL.position.set(-0.27, 0.42, 0.1);
  chest.add(collarL);
  const collarR = box(0.22, 0.06, 0.06, mDark);
  collarR.position.set( 0.27, 0.42, 0.1);
  chest.add(collarR);

  // ── NECK → HEAD ───────────────────────────────
  const neckPivot = node(); neckPivot.position.y = 0.5;
  chest.add(neckPivot);

  const neckMesh = cyl(0.1, 0.26, 8, mDark);
  neckMesh.position.y = 0.13;
  neckPivot.add(neckMesh);

  const headPivot = node(); headPivot.position.y = 0.28;
  neckPivot.add(headPivot);

  // Head — slightly egg-shaped
  const headGeo = new THREE.SphereGeometry(0.38, 24, 20);
  const headMesh = new THREE.Mesh(headGeo, mBody);
  headMesh.scale.set(1, 1.12, 0.92);
  headMesh.position.y = 0.14;
  headPivot.add(headMesh);

  // Visor band
  const visorGeo = new THREE.BoxGeometry(0.58, 0.12, 0.06);
  const visorMesh = new THREE.Mesh(visorGeo, mDark);
  visorMesh.position.set(0, 0.2, 0.34);
  headPivot.add(visorMesh);

  // Eyes (glowing)
  [-0.16, 0.16].forEach(x => {
    const eyeRing = disk(0.055, 0.025, 14, mDark);
    eyeRing.rotation.x = Math.PI / 2;
    eyeRing.position.set(x, 0.2, 0.36);
    headPivot.add(eyeRing);

    const eyeGlow = disk(0.032, 0.035, 12, mGlow);
    eyeGlow.rotation.x = Math.PI / 2;
    eyeGlow.position.set(x, 0.2, 0.365);
    headPivot.add(eyeGlow);
  });

  // Head jaw detail
  const jawLine = box(0.36, 0.04, 0.04, mAccent);
  jawLine.position.set(0, -0.04, 0.3);
  headPivot.add(jawLine);

  // Head-neck joint sphere
  const neckJoint = sph(0.11, 10, mDark);
  neckJoint.position.y = 0.01;
  headPivot.add(neckJoint);

  // ── SHOULDERS + ARMS ───────────────────────────
  function makeArm(side) {
    const s = side === 'L' ? -1 : 1;

    // Shoulder socket
    const shoulderPivot = node();
    shoulderPivot.position.set(s * 0.48, 0.38, 0);
    chest.add(shoulderPivot);

    const shoulderBall = sph(0.13, 10, mDark);
    shoulderPivot.add(shoulderBall);

    // Shoulder cap
    const shoulderCap = sph(0.1, 8, mBody);
    shoulderCap.position.set(s * 0.08, 0.04, 0);
    shoulderPivot.add(shoulderCap);

    // Upper arm pivot (rotates at shoulder)
    const upperArmPivot = node(); upperArmPivot.position.y = -0.13;
    shoulderPivot.add(upperArmPivot);

    const upperArmMesh = cyl(0.1, 0.52, 10, mBody);
    upperArmMesh.position.y = -0.26;
    upperArmPivot.add(upperArmMesh);

    // Elbow joint
    const elbowPivot = node(); elbowPivot.position.y = -0.52;
    upperArmPivot.add(elbowPivot);

    const elbowBall = sph(0.1, 10, mDark);
    elbowPivot.add(elbowBall);

    // Forearm pivot
    const forearmPivot = node(); forearmPivot.position.y = -0.1;
    elbowPivot.add(forearmPivot);

    const forearmMesh = cyl(0.082, 0.46, 10, mBody);
    forearmMesh.position.y = -0.23;
    forearmPivot.add(forearmMesh);

    // Wrist
    const wristPivot = node(); wristPivot.position.y = -0.46;
    forearmPivot.add(wristPivot);

    const wristBall = sph(0.09, 8, mDark);
    wristPivot.add(wristBall);

    // Hand
    const handMesh = sph(0.1, 10, mBody);
    handMesh.scale.set(1.1, 0.85, 0.85);
    handMesh.position.y = -0.1;
    wristPivot.add(handMesh);

    // Accent stripe on forearm
    const stripe = box(0.025, 0.2, 0.025, mAccent);
    stripe.position.set(s * 0.07, -0.2, 0);
    forearmPivot.add(stripe);

    return { shoulderPivot, upperArmPivot, elbowPivot, forearmPivot, wristPivot };
  }

  const armL = makeArm('L');
  const armR = makeArm('R');

  // ── HIP SOCKETS + LEGS ─────────────────────────
  function makeLeg(side) {
    const s = side === 'L' ? -1 : 1;

    const hipSocket = node(); hipSocket.position.set(s * 0.2, -0.06, 0);
    hips.add(hipSocket);

    const hipBall = sph(0.12, 10, mDark);
    hipSocket.add(hipBall);

    // Thigh pivot
    const thighPivot = node(); thighPivot.position.y = -0.12;
    hipSocket.add(thighPivot);

    const thighMesh = cyl(0.12, 0.56, 10, mBody);
    thighMesh.position.y = -0.28;
    thighPivot.add(thighMesh);

    // Thigh accent
    const thighAccent = box(0.03, 0.2, 0.03, mAccent);
    thighAccent.position.set(s * 0.1, -0.22, 0);
    thighPivot.add(thighAccent);

    // Knee
    const kneePivot = node(); kneePivot.position.y = -0.56;
    thighPivot.add(kneePivot);

    const kneeBall = sph(0.1, 10, mDark);
    kneePivot.add(kneeBall);

    // Shin pivot
    const shinPivot = node(); shinPivot.position.y = -0.1;
    kneePivot.add(shinPivot);

    const shinMesh = cyl(0.095, 0.52, 10, mBody);
    shinMesh.position.y = -0.26;
    shinPivot.add(shinMesh);

    // Ankle + foot
    const anklePivot = node(); anklePivot.position.y = -0.52;
    shinPivot.add(anklePivot);

    const ankleBall = sph(0.08, 8, mDark);
    anklePivot.add(ankleBall);

    const footMesh = box(0.2, 0.1, 0.36, mBody);
    footMesh.position.set(0, -0.07, 0.09);
    anklePivot.add(footMesh);

    const footAccent = box(0.14, 0.025, 0.025, mAccent);
    footAccent.position.set(0, -0.03, 0.26);
    anklePivot.add(footAccent);

    return { hipSocket, thighPivot, kneePivot, shinPivot, anklePivot };
  }

  const legL = makeLeg('L');
  const legR = makeLeg('R');

  // ── Mouse state ─────────────────────────────────
  let mX = 0, mY = 0;
  document.addEventListener('mousemove', e => {
    mX =  (e.clientX / window.innerWidth)  * 2 - 1; // -1 a 1
    mY = -(e.clientY / window.innerHeight) * 2 + 1; // -1 a 1
  });

  // ── Lerp ────────────────────────────────────────
  const lerp = (a, b, t) => a + (b - a) * t;

  // Current rotation state
  const cur = {
    headY: 0, headX: 0,
    spineY: 0, spineX: 0,
    hipsY: 0,
    lShZ: 0, lShX: 0, lElbow: 0,
    rShZ: 0, rShX: 0, rElbow: 0,
    lThigh: 0, rThigh: 0,
    lKnee: 0,  rKnee: 0,
  };

  // ── Animation loop ───────────────────────────────
  let clock = 0;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

    // Float
    root.position.y = 1.85 + Math.sin(clock * 0.85) * 0.14;

    const f = 0.065;

    // Head: gira fuerte siguiendo cursor
    cur.headY  = lerp(cur.headY,  mX *  0.95, f + 0.02);
    cur.headX  = lerp(cur.headX, -mY *  0.45, f + 0.02);

    // Spine: sigue suave
    cur.spineY = lerp(cur.spineY, mX *  0.32, f);
    cur.spineX = lerp(cur.spineX, mY *  0.14, f);

    // Caderas: contrarotación leve
    cur.hipsY  = lerp(cur.hipsY, -mX * 0.14, f);

    // Brazo IZQUIERDO
    const lActive = mX < -0.1;
    cur.lShZ   = lerp(cur.lShZ,  lActive ? -mX * 0.55 : 0.06,   f);
    cur.lShX   = lerp(cur.lShX,   mX * 0.15,                     f);
    cur.lElbow = lerp(cur.lElbow, lActive ? Math.abs(mX)*0.5 : 0.08, f);

    // Brazo DERECHO
    const rActive = mX > 0.1;
    cur.rShZ   = lerp(cur.rShZ,  rActive ?  mX * 0.55 : -0.06,  f);
    cur.rShX   = lerp(cur.rShX,   mX * 0.15,                    f);
    cur.rElbow = lerp(cur.rElbow, rActive ?  mX * 0.5  : 0.08,  f);

    // Piernas: leve desplazamiento de peso
    cur.lThigh = lerp(cur.lThigh,  mX * 0.05, f * 0.6);
    cur.rThigh = lerp(cur.rThigh, -mX * 0.05, f * 0.6);
    cur.lKnee  = lerp(cur.lKnee,   Math.abs(mX) * 0.06, f);
    cur.rKnee  = lerp(cur.rKnee,   Math.abs(mX) * 0.06, f);

    // ── Aplicar rotaciones ───────────────────────
    headPivot.rotation.y = cur.headY;
    headPivot.rotation.x = cur.headX;

    spine.rotation.y     = cur.spineY;
    spine.rotation.x     = cur.spineX;

    hips.rotation.y      = cur.hipsY;

    // Brazos
    armL.shoulderPivot.rotation.z  =  cur.lShZ;
    armL.shoulderPivot.rotation.x  =  cur.lShX;
    armL.elbowPivot.rotation.z     = -cur.lElbow * 0.55;

    armR.shoulderPivot.rotation.z  = -cur.rShZ;
    armR.shoulderPivot.rotation.x  =  cur.rShX;
    armR.elbowPivot.rotation.z     =  cur.rElbow * 0.55;

    // Piernas
    legL.thighPivot.rotation.z = -cur.lThigh;
    legR.thighPivot.rotation.z =  cur.rThigh;
    legL.kneePivot.rotation.z  =  cur.lKnee;
    legR.kneePivot.rotation.z  = -cur.rKnee;

    // Luz ambar sigue ligeramente al cursor
    amber.position.x = mX * 1.5;
    amber.position.y = mY * 1.0 + 1;

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize ──────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
})();
