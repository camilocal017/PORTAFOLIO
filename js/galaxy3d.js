/**
 * galaxy3d.js — Galaxia espiral de partículas con Three.js
 * 6 000 puntos en brazos espirales, colores ámbar del portfolio.
 * El cursor las explota; vuelven solas con spring.
 */
(function () {
  const container = document.getElementById('robot-container');
  const canvas    = document.getElementById('robot-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || 360;
    const H = container.clientHeight || 560;

    // ── Renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Escena + Cámara ───────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 100);
    camera.position.set(0, 2.2, 7.0);
    camera.lookAt(0, 0, 0);

    // ════════════════════════════════════════════
    //  GALAXIA — generación de partículas
    // ════════════════════════════════════════════
    const COUNT   = 6000;
    const RADIUS  = 3.8;
    const ARMS    = 3;
    const SPIN    = 1.75;   // cuánto espiralan los brazos
    const SPREAD  = 0.30;   // dispersión lateral de cada brazo

    const positions = new Float32Array(COUNT * 3);
    const origPos   = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    // Colores base (rgb 0-1)
    const WHITE  = [1.00, 0.97, 0.90];   // núcleo: blanco cálido
    const AMBER  = [0.910, 0.635, 0.188]; // medio: ámbar portfolio
    const ORANGE = [0.85, 0.22, 0.02];   // borde: naranja profundo
    const BLUE   = [0.55, 0.72, 1.00];   // estrellas frías (acento)

    const lc = (a, b, t) => a + (b - a) * t; // lerp color canal

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, cr, cg, cb;

      // ─── Núcleo central (15 %) ───────────────
      if (i < COUNT * 0.15) {
        const r     = Math.pow(Math.random(), 2) * 0.65;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta) * 0.35;
        z = r * Math.cos(phi);
        const m = Math.random();
        cr = lc(WHITE[0], AMBER[0], m);
        cg = lc(WHITE[1], AMBER[1], m);
        cb = lc(WHITE[2], AMBER[2], m);

      // ─── Brazos espirales (85 %) ─────────────
      } else {
        const arm   = i % ARMS;
        const t     = Math.pow(Math.random(), 0.55); // más denso hacia afuera
        const r     = 0.45 + t * RADIUS;
        const angle = t * Math.PI * 4 * SPIN + (arm / ARMS) * Math.PI * 2;
        const scat  = SPREAD * (0.3 + t * 0.7);

        x = Math.cos(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;
        y = (Math.random() - 0.5) * 0.22 * (1 - t * 0.75);
        z = Math.sin(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;

        const ratio = r / RADIUS; // 0..1

        // Estrellas azules frías (5 %)
        if (Math.random() < 0.05) {
          cr = BLUE[0]; cg = BLUE[1]; cb = BLUE[2];
        } else if (ratio < 0.45) {
          // Zona interior: blanco→ámbar
          const m = ratio / 0.45;
          cr = lc(WHITE[0], AMBER[0], m);
          cg = lc(WHITE[1], AMBER[1], m);
          cb = lc(WHITE[2], AMBER[2], m);
        } else {
          // Zona exterior: ámbar→naranja, con fade
          const m    = (ratio - 0.45) / 0.55;
          const fade = 1 - Math.max(0, (ratio - 0.72) / 0.28);
          cr = lc(AMBER[0], ORANGE[0], m) * fade;
          cg = lc(AMBER[1], ORANGE[1], m) * fade;
          cb = lc(AMBER[2], ORANGE[2], m) * fade;
        }
      }

      positions[i*3]     = x;
      positions[i*3 + 1] = y;
      positions[i*3 + 2] = z;
      origPos[i*3]       = x;
      origPos[i*3 + 1]   = y;
      origPos[i*3 + 2]   = z;
      colors[i*3]        = cr;
      colors[i*3 + 1]    = cg;
      colors[i*3 + 2]    = cb;
    }

    // ── BufferGeometry ────────────────────────────
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    // ── Material: aditivo = brillo natural al superponerse ──
    const mat = new THREE.PointsMaterial({
      size:        0.038,
      vertexColors: true,
      blending:    THREE.AdditiveBlending,
      transparent: true,
      opacity:     0.90,
      depthWrite:  false,
      sizeAttenuation: true
    });

    const galaxy = new THREE.Points(geo, mat);
    scene.add(galaxy);

    // ── Halo de brillo central (sprite grande suave) ──
    const haloCv = document.createElement('canvas');
    haloCv.width = haloCv.height = 128;
    const hCtx = haloCv.getContext('2d');
    const grad = hCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0,   'rgba(255,220,100,0.55)');
    grad.addColorStop(0.3, 'rgba(232,162,48, 0.18)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    hCtx.fillStyle = grad;
    hCtx.fillRect(0, 0, 128, 128);

    const haloTex = new THREE.CanvasTexture(haloCv);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(2.4, 2.4, 1);
    scene.add(haloSprite);

    // ════════════════════════════════════════════
    //  MOUSE
    // ════════════════════════════════════════════
    let mX = 0, mY = 0;
    document.addEventListener('mousemove', e => {
      mX =  (e.clientX / window.innerWidth)  * 2 - 1;
      mY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ════════════════════════════════════════════
    //  ANIMACIÓN
    // ════════════════════════════════════════════
    let time = 0;

    // Velocidades de las partículas (para el spring)
    const vel = new Float32Array(COUNT * 3);

    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      // Rotación lenta de la galaxia
      galaxy.rotation.y = time * 0.12;
      // Ligera inclinación que oscila
      galaxy.rotation.x = 0.42 + Math.sin(time * 0.07) * 0.06 + mY * 0.12;
      galaxy.rotation.z = Math.sin(time * 0.05) * 0.02 + mX * 0.06;

      // ── Explosión cursor ──────────────────────
      // Proyectamos cursor a espacio local de la galaxia (plano XZ)
      // Approx: mapear mX→local X, mY→local Y antes de rotación Y
      const gy  = galaxy.rotation.y;
      const localX =  mX * 3.5 * Math.cos(-gy) + mY * 0 * Math.sin(-gy);
      const localZ = -mX * 3.5 * Math.sin(-gy);
      const localY =  mY * 2.0;

      const CURSOR_R  = 1.1;  // radio de influencia
      const PUSH      = 0.055; // fuerza de empuje
      const SPRING    = 0.028; // retorno
      const DAMPING   = 0.82;  // amortiguación

      const pos = geo.attributes.position.array;

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

        const dx = pos[ix] - localX;
        const dy = pos[iy] - localY;
        const dz = pos[iz] - localZ;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.001;

        // Empuje del cursor
        if (dist < CURSOR_R) {
          const force = (1 - dist / CURSOR_R) * PUSH;
          vel[ix] += (dx / dist) * force;
          vel[iy] += (dy / dist) * force * 0.4;
          vel[iz] += (dz / dist) * force;
        }

        // Spring de regreso a posición original
        vel[ix] += (origPos[ix] - pos[ix]) * SPRING;
        vel[iy] += (origPos[iy] - pos[iy]) * SPRING;
        vel[iz] += (origPos[iz] - pos[iz]) * SPRING;

        // Aplicar y amortiguar
        vel[ix] *= DAMPING;
        vel[iy] *= DAMPING;
        vel[iz] *= DAMPING;

        pos[ix] += vel[ix];
        pos[iy] += vel[iy];
        pos[iz] += vel[iz];
      }

      geo.attributes.position.needsUpdate = true;

      // Halo pulsa levemente
      const pulse = 1 + Math.sin(time * 1.4) * 0.08;
      haloSprite.scale.set(2.4 * pulse, 2.4 * pulse, 1);

      // Cámara con suave parallax del cursor
      camera.position.x += (mX * 0.5 - camera.position.x) * 0.04;
      camera.position.y += (2.2 + mY * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

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

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
