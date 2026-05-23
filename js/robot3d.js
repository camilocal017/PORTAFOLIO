/**
 * robot3d.js — Robot humanoide estilo I,Robot con Three.js
 * Proporciones humanas reales, materiales PBR, articulación completa.
 * Cámara calibrada para ver TODO el cuerpo sin corte.
 */
(function () {
  const container = document.getElementById('robot-container');
  const canvas    = document.getElementById('robot-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  // Esperar a que el contenedor tenga dimensiones reales
  function init() {
    const W = container.clientWidth  || 340;
    const H = container.clientHeight || 560;

    // ── Renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Scene ─────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Cámara: FOV amplio, lejos, centrada en robot ──
    // Robot mide ~3.5 unidades. Centro en y≈0.18
    // Con z=9, fov=44 → half_h = tan(22°)×9 = 3.64 → ve de -3.46 a 3.82 ✓
    const camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
    camera.position.set(0, 0.18, 9.0);
    camera.lookAt(0, 0.18, 0);

    // ── Luces ─────────────────────────────────────
    // Luz ambiente suave
    scene.add(new THREE.AmbientLight(0xd8e0ff, 0.55));

    // Luz clave (frontal-superior)
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(3, 6, 6);
    scene.add(key);

    // Luz de relleno (lado izquierdo, fría)
    const fill = new THREE.DirectionalLight(0x8899cc, 0.40);
    fill.position.set(-5, 2, -2);
    scene.add(fill);

    // Rim light (desde atrás, crea silueta)
    const rim = new THREE.DirectionalLight(0xffffff, 0.65);
    rim.position.set(0, 5, -8);
    scene.add(rim);

    // Luz ámbar (reactor/ojos) — sigue cursor
    const amberPt = new THREE.PointLight(0xe8a230, 2.2, 12);
    amberPt.position.set(0, 1.5, 3);
    scene.add(amberPt);

    // ── Materiales ────────────────────────────────
    // Panel blanco (cuerpo principal)
    const mW = new THREE.MeshPhongMaterial({
      color: 0xedf0f8, specular: 0xffffff, shininess: 220
    });
    // Panel secundario (abdomen, muslos)
    const mP = new THREE.MeshPhongMaterial({
      color: 0xcdd2e8, specular: 0xaaaacc, shininess: 140
    });
    // Juntas oscuras
    const mD = new THREE.MeshPhongMaterial({
      color: 0x0e0f18, specular: 0x334466, shininess: 90
    });
    // Acento ámbar
    const mA = new THREE.MeshPhongMaterial({
      color: 0xe8a230, emissive: 0x4a2800, shininess: 220
    });
    // Brillo ámbar (ojos, reactor)
    const mG = new THREE.MeshPhongMaterial({
      color: 0xffd060, emissive: 0xe8a230, emissiveIntensity: 1.6, shininess: 300
    });

    // ── Helpers ───────────────────────────────────
    const node = () => new THREE.Object3D();
    const Box  = (w,h,d,m)   => new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
    const Cyl  = (rt,rb,h,s,m)=> new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s), m);
    const Sph  = (r,s,m)     => new THREE.Mesh(new THREE.SphereGeometry(r,s,s), m);
    const pos  = (o,x,y,z)   => { o.position.set(x,y,z); return o; };

    // ══════════════════════════════════════════════
    //  ROOT — centro de la escena
    // ══════════════════════════════════════════════
    const root = new THREE.Group();
    scene.add(root);
    // root.position.y oscilará ±0.11 (float)

    // ══════════════════════════════════════════════
    //  CADERAS — centro de masa (y=0 en root)
    // ══════════════════════════════════════════════
    const hips = node();
    root.add(hips);

    // Placa pélvica
    const pelvisMesh = Cyl(0.27, 0.30, 0.24, 14, mP);
    hips.add(pelvisMesh);

    // Franja ámbar en cadera
    const hipStripe = Box(0.40, 0.032, 0.032, mA);
    pos(hipStripe, 0, 0, 0.16);
    hips.add(hipStripe);

    // ══════════════════════════════════════════════
    //  CINTURA → COLUMNA
    // ══════════════════════════════════════════════
    const spine = node();
    pos(spine, 0, 0.22, 0);
    hips.add(spine);

    // Vértebras / cintura
    const waistMesh = Cyl(0.20, 0.26, 0.20, 12, mD);
    pos(waistMesh, 0, 0.10, 0);
    spine.add(waistMesh);

    // ══════════════════════════════════════════════
    //  PECHO
    // ══════════════════════════════════════════════
    const chest = node();
    pos(chest, 0, 0.30, 0);
    spine.add(chest);

    // Torso inferior (transición cintura→pecho)
    const torsoLow = Cyl(0.32, 0.22, 0.28, 14, mW);
    pos(torsoLow, 0, 0.04, 0);
    chest.add(torsoLow);

    // Torso superior (más ancho — hombros anchos)
    const torsoHigh = Cyl(0.38, 0.32, 0.36, 14, mW);
    pos(torsoHigh, 0, 0.40, 0);
    chest.add(torsoHigh);

    // Placa esternal oscura (centro del pecho)
    const sternumPlate = Box(0.30, 0.52, 0.045, mD);
    pos(sternumPlate, 0, 0.20, 0.24);
    chest.add(sternumPlate);

    // Reactor central (arco ámbar + núcleo brillante)
    const reactorRing = Cyl(0.115, 0.115, 0.038, 20, mD);
    reactorRing.rotation.x = Math.PI / 2;
    pos(reactorRing, 0, 0.18, 0.268);
    chest.add(reactorRing);

    const reactorCore = Cyl(0.058, 0.058, 0.058, 16, mG);
    reactorCore.rotation.x = Math.PI / 2;
    pos(reactorCore, 0, 0.18, 0.275);
    chest.add(reactorCore);

    // Líneas de pecho (izquierda y derecha del esternón)
    [-0.18, 0.18].forEach(x => {
      const cLine = Box(0.22, 0.032, 0.032, mA);
      pos(cLine, x, 0.46, 0.24);
      chest.add(cLine);
    });

    // Clavículas
    [-1, 1].forEach(s => {
      const clav = Box(0.22, 0.055, 0.075, mD);
      pos(clav, s * 0.30, 0.56, 0.12);
      chest.add(clav);
    });

    // ══════════════════════════════════════════════
    //  CUELLO → CABEZA
    // ══════════════════════════════════════════════
    const neckBase = node();
    pos(neckBase, 0, 0.64, 0);
    chest.add(neckBase);

    // Cuello (cono truncado)
    const neckMesh = Cyl(0.082, 0.110, 0.32, 12, mD);
    pos(neckMesh, 0, 0.16, 0);
    neckBase.add(neckMesh);

    const headPivot = node();
    pos(headPivot, 0, 0.34, 0);
    neckBase.add(headPivot);

    // ─── CABEZA estilo I,Robot ─────────────────────
    // Cráneo (ovoide — ligeramente más alto, algo plano al frente)
    const skull = Sph(0.34, 30, 22, mW);
    skull.scale.set(0.96, 1.12, 0.90);
    pos(skull, 0, 0.14, 0);
    headPivot.add(skull);

    // Frente / tapa superior (línea dividida)
    const crownLine = Box(0.48, 0.038, 0.05, mD);
    pos(crownLine, 0, 0.42, 0.20);
    headPivot.add(crownLine);

    // Banda de la visera (oscura, cubre zona de ojos)
    const visor = Box(0.54, 0.175, 0.06, mD);
    pos(visor, 0, 0.17, 0.285);
    headPivot.add(visor);

    // Ojos ámbar brillantes
    [-0.145, 0.145].forEach(x => {
      const eyeHousing = Cyl(0.048, 0.048, 0.028, 16, mD);
      eyeHousing.rotation.x = Math.PI / 2;
      pos(eyeHousing, x, 0.17, 0.316);
      headPivot.add(eyeHousing);

      const eyeGlow = Cyl(0.028, 0.028, 0.040, 14, mG);
      eyeGlow.rotation.x = Math.PI / 2;
      pos(eyeGlow, x, 0.17, 0.322);
      headPivot.add(eyeGlow);
    });

    // Placa facial inferior (mentón)
    const faceLow = Box(0.44, 0.13, 0.055, mP);
    pos(faceLow, 0, 0.01, 0.295);
    headPivot.add(faceLow);

    // Mentón / quijada
    const chin = Box(0.30, 0.075, 0.075, mD);
    pos(chin, 0, -0.135, 0.255);
    headPivot.add(chin);

    // Detalle de sienes
    [-0.31, 0.31].forEach(x => {
      const temple = Box(0.038, 0.22, 0.075, mD);
      pos(temple, x, 0.14, 0.05);
      headPivot.add(temple);
    });

    // Conector cuello-cabeza
    const neckJoint = Sph(0.095, 10, mD);
    pos(neckJoint, 0, -0.02, 0);
    headPivot.add(neckJoint);

    // ══════════════════════════════════════════════
    //  BRAZOS (función para L y R)
    // ══════════════════════════════════════════════
    function makeArm(side) {
      const s = side === 'L' ? -1 : 1;

      // Pivote de hombro (unido al pecho)
      const shoulderPivot = node();
      pos(shoulderPivot, s * 0.50, 0.52, 0);
      chest.add(shoulderPivot);

      // Esfera de hombro (junta oscura visible)
      const shBall = Sph(0.125, 14, mD);
      shoulderPivot.add(shBall);

      // Capuchón del hombro (placa blanca externa)
      const shCap = Sph(0.105, 10, mW);
      pos(shCap, s * 0.095, 0.065, 0);
      shoulderPivot.add(shCap);

      // Pivote brazo superior
      const uaPivot = node();
      pos(uaPivot, 0, -0.125, 0);
      shoulderPivot.add(uaPivot);

      // Brazo superior (cono ligero)
      const uaMesh = Cyl(0.082, 0.105, 0.62, 12, mW);
      pos(uaMesh, 0, -0.31, 0);
      uaPivot.add(uaMesh);

      // Franja ámbar lateral
      const uaAccent = Box(0.022, 0.24, 0.022, mA);
      pos(uaAccent, s * 0.082, -0.26, 0);
      uaPivot.add(uaAccent);

      // Pivote codo
      const elbowPivot = node();
      pos(elbowPivot, 0, -0.62, 0);
      uaPivot.add(elbowPivot);

      // Esfera codo
      const elBall = Sph(0.090, 12, mD);
      elbowPivot.add(elBall);

      // Pivote antebrazo
      const faPivot = node();
      pos(faPivot, 0, -0.09, 0);
      elbowPivot.add(faPivot);

      // Antebrazo (más delgado)
      const faMesh = Cyl(0.070, 0.090, 0.52, 12, mW);
      pos(faMesh, 0, -0.26, 0);
      faPivot.add(faMesh);

      // Acento antebrazo
      const faAccent = Box(0.020, 0.20, 0.020, mA);
      pos(faAccent, 0, -0.24, s * 0.072);
      faPivot.add(faAccent);

      // Pivote muñeca
      const wristPivot = node();
      pos(wristPivot, 0, -0.52, 0);
      faPivot.add(wristPivot);

      // Esfera muñeca
      const wrBall = Sph(0.078, 8, mD);
      wristPivot.add(wrBall);

      // Mano (palma)
      const palm = Box(0.135, 0.090, 0.088, mW);
      pos(palm, 0, -0.100, 0);
      wristPivot.add(palm);

      // Dedos (3 studs)
      [-0.040, 0, 0.040].forEach(fx => {
        const finger = Box(0.030, 0.078, 0.030, mP);
        pos(finger, fx, -0.178, 0);
        wristPivot.add(finger);
      });

      return { shoulderPivot, uaPivot, elbowPivot, faPivot, wristPivot };
    }

    const armL = makeArm('L');
    const armR = makeArm('R');

    // ══════════════════════════════════════════════
    //  PIERNAS (función para L y R)
    // ══════════════════════════════════════════════
    function makeLeg(side) {
      const s = side === 'L' ? -1 : 1;

      // Socket cadera
      const hipSocket = node();
      pos(hipSocket, s * 0.190, -0.10, 0);
      hips.add(hipSocket);

      // Esfera cadera
      const hipBall = Sph(0.112, 14, mD);
      hipSocket.add(hipBall);

      // Pivote muslo
      const thighPivot = node();
      pos(thighPivot, 0, -0.112, 0);
      hipSocket.add(thighPivot);

      // Muslo (cono)
      const thighMesh = Cyl(0.098, 0.125, 0.64, 12, mW);
      pos(thighMesh, 0, -0.32, 0);
      thighPivot.add(thighMesh);

      // Acento muslo
      const thAccent = Box(0.028, 0.24, 0.028, mA);
      pos(thAccent, s * 0.090, -0.26, 0);
      thighPivot.add(thAccent);

      // Pivote rodilla
      const kneePivot = node();
      pos(kneePivot, 0, -0.64, 0);
      thighPivot.add(kneePivot);

      // Esfera rodilla
      const knBall = Sph(0.095, 12, mD);
      kneePivot.add(knBall);

      // Pivote espinilla
      const shinPivot = node();
      pos(shinPivot, 0, -0.095, 0);
      kneePivot.add(shinPivot);

      // Espinilla
      const shinMesh = Cyl(0.082, 0.098, 0.56, 12, mW);
      pos(shinMesh, 0, -0.28, 0);
      shinPivot.add(shinMesh);

      // Panel espinilla (panel frontal oscuro)
      const shinPanel = Box(0.060, 0.24, 0.038, mP);
      pos(shinPanel, 0, -0.24, 0.086);
      shinPivot.add(shinPanel);

      // Pivote tobillo
      const anklePivot = node();
      pos(anklePivot, 0, -0.56, 0);
      shinPivot.add(anklePivot);

      // Esfera tobillo
      const ankBall = Sph(0.080, 8, mD);
      anklePivot.add(ankBall);

      // Pie (elegante, ligeramente puntiagudo adelante)
      const footMesh = Box(0.175, 0.090, 0.40, mW);
      pos(footMesh, 0, -0.068, 0.10);
      anklePivot.add(footMesh);

      // Acento pie
      const footAccent = Box(0.115, 0.024, 0.024, mA);
      pos(footAccent, 0, -0.028, 0.29);
      anklePivot.add(footAccent);

      return { hipSocket, thighPivot, kneePivot, shinPivot, anklePivot };
    }

    const legL = makeLeg('L');
    const legR = makeLeg('R');

    // ══════════════════════════════════════════════
    //  MOUSE
    // ══════════════════════════════════════════════
    let mX = 0, mY = 0;
    document.addEventListener('mousemove', e => {
      mX =  (e.clientX / window.innerWidth)  * 2 - 1;
      mY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const lerp = (a, b, t) => a + (b - a) * t;

    const cur = {
      headY: 0, headX: 0,
      spineY: 0, spineX: 0,
      hipsY: 0,
      lShZ: 0, lShX: 0, lElbow: 0,
      rShZ: 0, rShX: 0, rElbow: 0,
      lThigh: 0, rThigh: 0,
      lKnee: 0,  rKnee: 0
    };

    // ══════════════════════════════════════════════
    //  LOOP DE ANIMACIÓN
    // ══════════════════════════════════════════════
    let t = 0;

    function animate() {
      requestAnimationFrame(animate);
      t += 0.016;

      // Flotación suave
      root.position.y = Math.sin(t * 0.78) * 0.11;

      const f = 0.065;

      // Cabeza (giro fuerte — sigue cursor)
      cur.headY = lerp(cur.headY, mX *  1.05, f + 0.025);
      cur.headX = lerp(cur.headX, -mY * 0.40, f + 0.02);

      // Columna (sigue suave)
      cur.spineY = lerp(cur.spineY, mX *  0.26, f);
      cur.spineX = lerp(cur.spineX, mY *  0.11, f);

      // Caderas (contra-rotación leve)
      cur.hipsY = lerp(cur.hipsY, -mX * 0.11, f * 0.7);

      // Brazo izquierdo
      const lA = mX < -0.08;
      cur.lShZ   = lerp(cur.lShZ,   lA ? -mX * 0.65 :  0.05, f);
      cur.lShX   = lerp(cur.lShX,    mX *  0.13,               f);
      cur.lElbow = lerp(cur.lElbow,  lA ? Math.abs(mX) * 0.55 : 0.05, f);

      // Brazo derecho
      const rA = mX > 0.08;
      cur.rShZ   = lerp(cur.rShZ,   rA ?  mX * 0.65 : -0.05, f);
      cur.rShX   = lerp(cur.rShX,    mX *  0.13,               f);
      cur.rElbow = lerp(cur.rElbow,  rA ?  mX * 0.55 : 0.05, f);

      // Piernas (desplazamiento de peso sutil)
      cur.lThigh = lerp(cur.lThigh,  mX * 0.04, f * 0.45);
      cur.rThigh = lerp(cur.rThigh, -mX * 0.04, f * 0.45);
      cur.lKnee  = lerp(cur.lKnee,  Math.abs(mX) * 0.045, f);
      cur.rKnee  = lerp(cur.rKnee,  Math.abs(mX) * 0.045, f);

      // ── Aplicar rotaciones ──────────────────────
      headPivot.rotation.y = cur.headY;
      headPivot.rotation.x = cur.headX;

      spine.rotation.y = cur.spineY;
      spine.rotation.x = cur.spineX;

      hips.rotation.y  = cur.hipsY;

      armL.shoulderPivot.rotation.z =  cur.lShZ;
      armL.shoulderPivot.rotation.x =  cur.lShX;
      armL.elbowPivot.rotation.z    = -cur.lElbow * 0.52;

      armR.shoulderPivot.rotation.z = -cur.rShZ;
      armR.shoulderPivot.rotation.x =  cur.rShX;
      armR.elbowPivot.rotation.z    =  cur.rElbow * 0.52;

      legL.thighPivot.rotation.z = -cur.lThigh;
      legR.thighPivot.rotation.z =  cur.rThigh;
      legL.kneePivot.rotation.z  =  cur.lKnee;
      legR.kneePivot.rotation.z  = -cur.rKnee;

      // Luz ámbar sigue cursor
      amberPt.position.x = mX * 1.8;
      amberPt.position.y = mY * 0.9 + 1.4;

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ────────────────────────────────────
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
  }

  // Iniciar cuando el DOM esté completamente pintado
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})();
