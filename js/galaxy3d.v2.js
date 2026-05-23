/**
 * galaxy3d.js — Disco galáctico visto de perfil (estilo protoplanetario)
 * Cámara baja, disco muy plano e inclinado → aspecto de imagen astronómica.
 */
(function () {
  const container   = document.getElementById('robot-container');
  const canvas      = document.getElementById('robot-canvas');
  const heroSection = document.getElementById('hero');
  if (!container || !canvas || !heroSection || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    // ── Cámara: ángulo bajo, casi a nivel del disco ──────────
    // Elevation ≈ 15° sobre el plano del disco → aspecto protoplanetario
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
    camera.position.set(0, 2.8, 10.5);
    camera.lookAt(0, 0.4, 0);

    // ════════════════════════════════════════════
    //  GALAXIA — disco muy plano, 4 brazos, más espirales
    // ════════════════════════════════════════════
    const COUNT  = 9000;
    const RADIUS = 5.5;
    const ARMS   = 4;      // más brazos = más "anillos" al verlo de perfil
    const SPIN   = 2.2;    // espirales más cerradas
    const SPREAD = 0.22;   // brazos más delgados

    const positions    = new Float32Array(COUNT * 3);
    const origPos      = new Float32Array(COUNT * 3);
    const colors       = new Float32Array(COUNT * 3);
    const shimmerPhase = new Float32Array(COUNT);

    // Paleta: dorado brillante → ámbar → naranja → óxido apagado
    const CORE  = [1.00, 0.90, 0.50];   // amarillo-dorado (núcleo)
    const AMBER = [0.91, 0.60, 0.12];   // ámbar medio
    const RUST  = [0.70, 0.22, 0.02];   // naranja óxido (bordes)
    const COOL  = [0.50, 0.65, 1.00];   // azul-blanco (estrellas frías)
    const lc    = (a, b, t) => a + (b - a) * t;

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, cr, cg, cb;
      shimmerPhase[i] = Math.random() * Math.PI * 2;

      // ── Núcleo (solo 2 %, muy pequeño y tenue) ──
      if (i < COUNT * 0.02) {
        const r     = Math.pow(Math.random(), 3) * 0.22;
        const theta = Math.random() * Math.PI * 2;
        x = r * Math.cos(theta);
        y = (Math.random() - 0.5) * 0.04;
        z = r * Math.sin(theta);
        cr = CORE[0] * 0.45;
        cg = CORE[1] * 0.45;
        cb = CORE[2] * 0.45;

      // ── Brazos espirales (disco muy plano) ──────
      } else {
        const arm   = i % ARMS;
        const t     = Math.pow(Math.random(), 0.50);
        const r     = 0.30 + t * RADIUS;
        const angle = t * Math.PI * 4 * SPIN + (arm / ARMS) * Math.PI * 2;
        const scat  = SPREAD * (0.2 + t * 0.8);

        x = Math.cos(angle) * r + (Math.random() - 0.5) * scat * r * 0.45;
        // Disco MUY plano: dispersión vertical mínima
        y = (Math.random() - 0.5) * 0.055 * (1 - t * 0.85);
        z = Math.sin(angle) * r + (Math.random() - 0.5) * scat * r * 0.45;

        const ratio = r / RADIUS;   // 0 → 1

        if (Math.random() < 0.04) {
          // Estrellas frías azules (puntitos de acento)
          cr = COOL[0]; cg = COOL[1]; cb = COOL[2];
        } else if (ratio < 0.30) {
          // Interior dorado
          const m = ratio / 0.30;
          cr = lc(CORE[0],  AMBER[0], m);
          cg = lc(CORE[1],  AMBER[1], m);
          cb = lc(CORE[2],  AMBER[2], m);
        } else if (ratio < 0.65) {
          // Medio ámbar
          const m = (ratio - 0.30) / 0.35;
          cr = lc(AMBER[0], RUST[0], m);
          cg = lc(AMBER[1], RUST[1], m);
          cb = lc(AMBER[2], RUST[2], m);
        } else {
          // Bordes: óxido que se desvanece
          const m    = (ratio - 0.65) / 0.35;
          const fade = 1 - Math.max(0, (ratio - 0.75) / 0.25);
          cr = RUST[0] * (1 - m * 0.4) * fade;
          cg = RUST[1] * (1 - m * 0.6) * fade;
          cb = RUST[2] * fade;
        }
      }

      positions[i*3]   = x;  origPos[i*3]   = x;  colors[i*3]   = cr;
      positions[i*3+1] = y;  origPos[i*3+1] = y;  colors[i*3+1] = cg;
      positions[i*3+2] = z;  origPos[i*3+2] = z;  colors[i*3+2] = cb;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size: 0.032, vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.80,
      depthWrite: false, sizeAttenuation: true
    });

    const galaxy = new THREE.Points(geo, mat);
    // Inclinación inicial: casi de canto (1.25 rad ≈ 72°)
    // El disco se ve de perfil → anillos visibles como en la imagen
    galaxy.rotation.x = 1.25;
    scene.add(galaxy);

    // ════════════════════════════════════════════
    //  CURSOR
    // ════════════════════════════════════════════
    let mX = 0, mY = 0, isHovering = false;

    const raycaster   = new THREE.Raycaster();
    const mouseNDC    = new THREE.Vector2();
    const worldHit    = new THREE.Vector3();
    const localHit    = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    const galPlane    = new THREE.Plane();

    heroSection.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      isHovering = true;
    });
    heroSection.addEventListener('mouseleave', () => { isHovering = false; });

    // ════════════════════════════════════════════
    //  FÍSICA
    // ════════════════════════════════════════════
    const vel      = new Float32Array(COUNT * 3);
    const CURSOR_R  = 0.75;
    const CURSOR_R2 = CURSOR_R * CURSOR_R;
    const PUSH      = 0.30;
    const SPRING    = 0.028;
    const DAMP      = 0.82;

    // ════════════════════════════════════════════
    //  ANIMACIÓN
    // ════════════════════════════════════════════
    let time = 0;
    let camX = 0, camY = 2.8;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.007;

      // Rotación Y lenta — el disco gira sobre su eje
      galaxy.rotation.y  = time * 0.09;
      // Tilt: casi estático, pequeña oscilación (0.03 rad)
      galaxy.rotation.x  = 1.25 + Math.sin(time * 0.05) * 0.03;

      // Raycaster
      let gotHit = false;
      let lx = 0, ly = 0, lz = 0;
      if (isHovering) {
        planeNormal.set(0, 1, 0).applyQuaternion(galaxy.quaternion);
        galPlane.setFromNormalAndCoplanarPoint(planeNormal, galaxy.position);
        mouseNDC.set(mX, mY);
        raycaster.setFromCamera(mouseNDC, camera);
        if (raycaster.ray.intersectPlane(galPlane, worldHit)) {
          localHit.copy(worldHit);
          galaxy.worldToLocal(localHit);
          lx = localHit.x; ly = localHit.y; lz = localHit.z;
          gotHit = true;
        }
      }

      const pos = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;

        if (gotHit) {
          const dx = pos[ix]-lx, dy = pos[iy]-ly, dz = pos[iz]-lz;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < CURSOR_R2 * 9) {
            const dist  = Math.sqrt(d2) || 0.001;
            const force = PUSH * Math.exp(-d2 / CURSOR_R2);
            vel[ix] += (dx/dist)*force;
            vel[iy] += (dy/dist)*force*0.15;
            vel[iz] += (dz/dist)*force;
          }
        }

        vel[ix] += (origPos[ix]-pos[ix])*SPRING;
        vel[iy] += (origPos[iy]-pos[iy])*SPRING;
        vel[iz] += (origPos[iz]-pos[iz])*SPRING;
        vel[ix] *= DAMP; vel[iy] *= DAMP; vel[iz] *= DAMP;
        pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz];

        const moved = (pos[ix]-origPos[ix])*(pos[ix]-origPos[ix])
                    + (pos[iz]-origPos[iz])*(pos[iz]-origPos[iz]);
        if (moved < 0.004) {
          pos[iy] = origPos[iy] + Math.sin(time*2.5 + shimmerPhase[i]) * 0.007;
        }
      }
      geo.attributes.position.needsUpdate = true;

      // Parallax suave
      camX += (mX * 0.28 - camX) * 0.04;
      camY += (2.8 + mY * 0.18 - camY) * 0.04;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
  }

  if (document.readyState === 'complete') { init(); }
  else { window.addEventListener('load', init); }
})();
