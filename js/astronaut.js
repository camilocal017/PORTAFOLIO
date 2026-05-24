/**
 * astronaut.js — Astronauta 3D compañero con Three.js
 * Movimiento orgánico en los 3 ejes, cursor lo atrae suavemente.
 * Burbujas contextuales por sección.
 */
(function () {
  const companion = document.getElementById('astronaut-companion');
  const canvas    = document.getElementById('astronaut-canvas');
  const bubble    = document.getElementById('companion-bubble');
  const bubbleTxt = document.getElementById('bubble-text');
  if (!companion || !canvas || typeof THREE === 'undefined') return;

  // ══════════════════════════════════════════
  //  THREE.JS — renderer, escena, cámara
  // ══════════════════════════════════════════
  const W = 170, H = 210;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 50);
  camera.position.set(0, 0.05, 2.9);
  camera.lookAt(0, 0, 0);

  // ── Luces ─────────────────────────────────
  scene.add(new THREE.AmbientLight(0xddeeff, 0.65));

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 3);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8899cc, 0.4);
  fill.position.set(-3, 1, -2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(0, -3, -4);
  scene.add(rim);

  const amberPt = new THREE.PointLight(0xe8a230, 1.4, 3.5);
  amberPt.position.set(0, 0, 0.5);
  scene.add(amberPt);

  // ── Materiales ────────────────────────────
  const mW = new THREE.MeshPhongMaterial({ color: 0xeceff8, specular: 0xffffff, shininess: 200 });
  const mG = new THREE.MeshPhongMaterial({ color: 0xb0b8cc, specular: 0xaaaacc, shininess: 100 });
  const mD = new THREE.MeshPhongMaterial({ color: 0x0d1117, specular: 0x223355, shininess: 80  });
  const mA = new THREE.MeshPhongMaterial({ color: 0xe8a230, emissive: 0x4a2800, shininess: 220 });
  const mGl= new THREE.MeshPhongMaterial({ color: 0xffe080, emissive: 0xe8a230, emissiveIntensity: 1.4 });

  // ── Helpers ───────────────────────────────
  const Sph = (r,s,m)       => new THREE.Mesh(new THREE.SphereGeometry(r,s,s), m);
  const Cyl = (rt,rb,h,s,m) => new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s), m);
  const Box = (w,h,d,m)     => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
  const p   = (o,x,y,z)     => { o.position.set(x,y,z); return o; };

  // ══════════════════════════════════════════
  //  MODELO 3D DEL ASTRONAUTA
  // ══════════════════════════════════════════
  const root = new THREE.Group();
  scene.add(root);

  // ── Cuerpo ────────────────────────────────
  const body = Cyl(0.22, 0.20, 0.50, 16, mW);
  root.add(body);

  // Panel de control (front)
  const panel = Box(0.20, 0.22, 0.03, mD);
  p(panel, 0, 0.02, 0.21);
  root.add(panel);

  // Reactor ámbar (centro del panel)
  const reactor = Sph(0.058, 12, mGl);
  p(reactor, 0, 0.02, 0.245);
  root.add(reactor);
  // Aro del reactor
  const reactorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.018, 8, 20), mA
  );
  reactorRing.rotation.x = Math.PI / 2;
  p(reactorRing, 0, 0.02, 0.235);
  root.add(reactorRing);

  // Líneas de detalle del traje
  [-0.13, 0.13].forEach(x => {
    const stripe = Box(0.06, 0.03, 0.03, mA);
    p(stripe, x, 0.18, 0.22);
    root.add(stripe);
  });

  // Tanque de oxígeno (espalda)
  const tank = Cyl(0.075, 0.075, 0.32, 10, mG);
  tank.rotation.x = Math.PI / 2;
  p(tank, 0, 0.04, -0.27);
  root.add(tank);
  const tankCap1 = Sph(0.075, 8, mG); p(tankCap1, 0, 0.04, -0.43); root.add(tankCap1);
  const tankCap2 = Sph(0.075, 8, mG); p(tankCap2, 0, 0.04, -0.11); root.add(tankCap2);

  // ── Cuello ────────────────────────────────
  const neck = Cyl(0.095, 0.11, 0.10, 12, mG);
  p(neck, 0, 0.30, 0);
  root.add(neck);

  // ── Casco ─────────────────────────────────
  const helmetPivot = new THREE.Group();
  p(helmetPivot, 0, 0.36, 0);
  root.add(helmetPivot);

  const helmet = Sph(0.27, 28, 22, mW);
  helmet.scale.set(1, 1.05, 1);
  helmetPivot.add(helmet);

  // Aro de unión casco-traje
  const helmetRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.035, 8, 24), mG
  );
  helmetRing.rotation.x = Math.PI / 2;
  helmetPivot.add(helmetRing);

  // Visor (oscuro)
  const visor = Sph(0.22, 20, 16, mD);
  visor.scale.set(0.88, 0.72, 0.30);
  p(visor, 0, 0.05, 0.18);
  helmetPivot.add(visor);

  // Reflejo del visor
  const visorGlare = Sph(0.10, 8, new THREE.MeshPhongMaterial({
    color: 0xffffff, transparent: true, opacity: 0.10, shininess: 300
  }));
  visorGlare.scale.set(0.7, 0.5, 0.3);
  p(visorGlare, -0.06, 0.10, 0.22);
  helmetPivot.add(visorGlare);

  // Ojos (ámbar brillante detrás del visor)
  [-0.09, 0.09].forEach(x => {
    const eye = Sph(0.040, 10, mGl);
    p(eye, x, 0.04, 0.24);
    helmetPivot.add(eye);
  });

  // Antena
  const antenna = Cyl(0.008, 0.008, 0.18, 6, mG);
  p(antenna, 0.14, 0.32, 0);
  helmetPivot.add(antenna);
  const antennaTip = Sph(0.018, 6, mA);
  p(antennaTip, 0.14, 0.42, 0);
  helmetPivot.add(antennaTip);

  // ── Hombros + Brazos ──────────────────────
  function makeArm(side) {
    const s = side === 'L' ? -1 : 1;

    const shoulderBall = Sph(0.115, 12, mG);
    p(shoulderBall, s * 0.32, 0.18, 0);
    root.add(shoulderBall);

    const shoulderCap = Sph(0.095, 10, mW);
    p(shoulderCap, s * 0.38, 0.22, 0);
    root.add(shoulderCap);

    const upperArm = Cyl(0.080, 0.090, 0.30, 10, mW);
    p(upperArm, s * 0.34, -0.02, 0);
    root.add(upperArm);

    const elbow = Sph(0.085, 10, mG);
    p(elbow, s * 0.34, -0.18, 0);
    root.add(elbow);

    const forearm = Cyl(0.072, 0.082, 0.26, 10, mW);
    p(forearm, s * 0.34, -0.36, 0);
    root.add(forearm);

    const glove = Sph(0.095, 10, mG);
    p(glove, s * 0.34, -0.52, 0);
    root.add(glove);

    // Acento ámbar en el brazo
    const armAccent = Box(0.020, 0.10, 0.020, mA);
    p(armAccent, s * (0.34 + 0.08), -0.32, 0);
    root.add(armAccent);
  }
  makeArm('L');
  makeArm('R');

  // ── Cintura + Piernas ─────────────────────
  const waist = Cyl(0.18, 0.20, 0.12, 14, mG);
  p(waist, 0, -0.31, 0);
  root.add(waist);

  function makeLeg(side) {
    const s = side === 'L' ? -1 : 1;

    const hipBall = Sph(0.10, 10, mG);
    p(hipBall, s * 0.13, -0.40, 0);
    root.add(hipBall);

    const thigh = Cyl(0.095, 0.10, 0.28, 10, mW);
    p(thigh, s * 0.13, -0.57, 0);
    root.add(thigh);

    const knee = Sph(0.092, 10, mG);
    p(knee, s * 0.13, -0.72, 0);
    root.add(knee);

    const shin = Cyl(0.085, 0.095, 0.24, 10, mW);
    p(shin, s * 0.13, -0.87, 0);
    root.add(shin);

    const boot = Box(0.18, 0.12, 0.22, mG);
    p(boot, s * 0.13, -1.01, 0.04);
    root.add(boot);

    const bootAccent = Box(0.12, 0.022, 0.022, mA);
    p(bootAccent, s * 0.13, -0.96, 0.14);
    root.add(bootAccent);
  }
  makeLeg('L');
  makeLeg('R');

  // ══════════════════════════════════════════
  //  CURSOR
  // ══════════════════════════════════════════
  let mX = 0, mY = 0;
  document.addEventListener('mousemove', e => {
    mX = (e.clientX / window.innerWidth)  * 2 - 1;
    mY = (e.clientY / window.innerHeight) * 2 - 1;
    wake();
  });

  // ══════════════════════════════════════════
  //  ANIMACIÓN 3D ORGÁNICA
  // ══════════════════════════════════════════
  let time  = 0;
  // Estado suavizado del cursor
  let cX = 0, cY = 0;
  // Base rotation suavizada
  let bX = 0, bY = 0, bZ = 0;

  const lerp = (a, b, t) => a + (b - a) * t;

  function animate3D() {
    requestAnimationFrame(animate3D);
    time += 0.010;

    // Movimiento orgánico base: 3 frecuencias independientes por eje
    const targetBX = Math.sin(time * 0.34)  * 0.38
                   + Math.sin(time * 0.11)  * 0.18;
    const targetBY = time * 0.22
                   + Math.sin(time * 0.17)  * 0.40;
    const targetBZ = Math.cos(time * 0.23)  * 0.30
                   + Math.sin(time * 0.08)  * 0.15;

    bX = lerp(bX, targetBX, 0.04);
    bY = lerp(bY, targetBY, 0.04);
    bZ = lerp(bZ, targetBZ, 0.04);

    // Cursor atrae suavemente (influye sobre la rotación base)
    cX = lerp(cX, -mY * 0.55, 0.025);
    cY = lerp(cY,  mX * 0.75, 0.025);

    root.rotation.x = bX + cX;
    root.rotation.y = bY + cY;
    root.rotation.z = bZ;

    // Posición: leve drift en 3D
    root.position.x = Math.sin(time * 0.29) * 0.06;
    root.position.y = Math.sin(time * 0.21) * 0.05 - 0.12;
    root.position.z = Math.sin(time * 0.15) * 0.04;

    // Reactor y antena pulsan
    const glow = 0.9 + Math.sin(time * 2.2) * 0.3;
    mGl.emissiveIntensity = glow;
    amberPt.intensity = 1.2 + Math.sin(time * 2.2) * 0.4;

    renderer.render(scene, camera);
  }
  animate3D();

  // ══════════════════════════════════════════
  //  BURBUJAS Y COMPORTAMIENTO
  // ══════════════════════════════════════════
  const MSGS = {
    hero:       '¡Explorando el universo de Camilo! 🚀',
    about:      'Conoce al desarrollador 👨‍💻',
    skills:     '¡Mira esas herramientas! ⚡',
    projects:   '¡Proyectos reales! 🛠️',
    experience: 'La experiencia habla sola 💼',
    contact:    '¡Dale, escríbele! 📬',
  };

  let bubbleTimer = null;
  function showBubble(text, ms = 3800) {
    if (!bubble || !bubbleTxt) return;
    bubbleTxt.textContent = text;
    bubble.classList.remove('hidden');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), ms);
  }

  setTimeout(() => showBubble(MSGS.hero, 4500), 1800);

  Object.keys(MSGS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && id !== 'hero') showBubble(MSGS[id]);
    }, { threshold: 0.4 }).observe(el);
  });

  // Sleep
  let sleepTimer = null, sleeping = false;
  function sleep() {
    sleeping = true;
    showBubble('Zzz... 💤', 99999);
  }
  function wake() {
    clearTimeout(sleepTimer);
    if (sleeping) { sleeping = false; showBubble('¡Estoy aquí! 👀'); }
    sleepTimer = setTimeout(sleep, 30000);
  }
  wake();

  // Hover
  companion.addEventListener('mouseenter', () => { wake(); showBubble('¡Hola! 👋'); });

  // Click
  const clicks = [
    '¡No olvides hacer commit! 💾',
    'El código es poesía 🖥️',
    '¿Ya viste los proyectos? 🚀',
    'Camilo lo construyó con ❤️',
    '¡Tú puedes! 🌟',
  ];
  let ci = 0;
  companion.addEventListener('click', () => { wake(); showBubble(clicks[ci++ % clicks.length]); });

})();
