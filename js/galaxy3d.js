/**
 * galaxy3d.js — Galaxia espiral Three.js
 * Cursor: THREE.Raycaster → intersección real con el plano de la galaxia
 * Explosión gaussiana, spring fluido, shimmer sutil
 */
(function () {
  const container = document.getElementById('robot-container');
  const canvas    = document.getElementById('robot-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || 360;
    const H = container.clientHeight || 500;

    // ── Renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 2.0, 6.2);   // más cerca → galaxia llena más el canvas
    camera.lookAt(0, -0.45, 0);

    // ════════════════════════════════════════════
    //  GALAXIA
    // ════════════════════════════════════════════
    const COUNT  = 6000;
    const RADIUS = 3.8;
    const ARMS   = 3;
    const SPIN   = 1.75;
    const SPREAD = 0.30;

    const positions    = new Float32Array(COUNT * 3);
    const origPos      = new Float32Array(COUNT * 3);
    const colors       = new Float32Array(COUNT * 3);
    const shimmerPhase = new Float32Array(COUNT);

    const WHITE = [1.00, 0.97, 0.90];
    const AMBER = [0.91, 0.64, 0.19];
    const DEEP  = [0.82, 0.20, 0.02];
    const COOL  = [0.55, 0.72, 1.00];
    const lc    = (a, b, t) => a + (b - a) * t;

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, cr, cg, cb;

      shimmerPhase[i] = Math.random() * Math.PI * 2;

      if (i < COUNT * 0.15) {                          // núcleo
        const r     = Math.pow(Math.random(), 2) * 0.70;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta) * 0.32;
        z = r * Math.cos(phi);
        const m = Math.random();
        cr = lc(WHITE[0], AMBER[0], m);
        cg = lc(WHITE[1], AMBER[1], m);
        cb = lc(WHITE[2], AMBER[2], m);
      } else {                                          // brazos
        const arm   = i % ARMS;
        const t     = Math.pow(Math.random(), 0.55);
        const r     = 0.45 + t * RADIUS;
        const angle = t * Math.PI * 4 * SPIN + (arm / ARMS) * Math.PI * 2;
        const scat  = SPREAD * (0.3 + t * 0.7);
        x = Math.cos(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;
        y = (Math.random() - 0.5) * 0.22 * (1 - t * 0.78);
        z = Math.sin(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;
        const ratio = r / RADIUS;
        if (Math.random() < 0.05) {
          cr = COOL[0]; cg = COOL[1]; cb = COOL[2];
        } else if (ratio < 0.42) {
          const m = ratio / 0.42;
          cr = lc(WHITE[0], AMBER[0], m);
          cg = lc(WHITE[1], AMBER[1], m);
          cb = lc(WHITE[2], AMBER[2], m);
        } else {
          const m    = (ratio - 0.42) / 0.58;
          const fade = 1 - Math.max(0, (ratio - 0.70) / 0.30);
          cr = lc(AMBER[0], DEEP[0], m) * fade;
          cg = lc(AMBER[1], DEEP[1], m) * fade;
          cb = lc(AMBER[2], DEEP[2], m) * fade;
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
      size: 0.040, vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.92,
      depthWrite: false, sizeAttenuation: true
    });

    const galaxy = new THREE.Points(geo, mat);
    scene.add(galaxy);

    // Halo central
    const haloCv = document.createElement('canvas');
    haloCv.width = haloCv.height = 128;
    const hCtx = haloCv.getContext('2d');
    const grad  = hCtx.createRadialGradient(64,64,0,64,64,64);
    grad.addColorStop(0,   'rgba(255,215,90,0.60)');
    grad.addColorStop(0.3, 'rgba(232,162,48,0.20)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    hCtx.fillStyle = grad; hCtx.fillRect(0,0,128,128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(haloCv),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    halo.scale.set(2.2, 2.2, 1);
    scene.add(halo);

    // ════════════════════════════════════════════
    //  CURSOR — Raycaster real (intersecta el plano de la galaxia)
    // ════════════════════════════════════════════
    let mX = 0, mY = 0, isHovering = false;

    // Objetos reutilizables para el raycaster (sin allocations por frame)
    const raycaster   = new THREE.Raycaster();
    const mouseNDC    = new THREE.Vector2();
    const worldHit    = new THREE.Vector3();
    const localHit    = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    let   galPlane    = new THREE.Plane();

    container.addEventListener('mousemove', e => {
      const rect = container.getBoundingClientRect();
      // NDC relativo al CANVAS (no a la ventana)
      mX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      isHovering = true;
    });
    container.addEventListener('mouseleave', () => { isHovering = false; });

    // ════════════════════════════════════════════
    //  FÍSICA
    // ════════════════════════════════════════════
    const vel = new Float32Array(COUNT * 3);

    const CURSOR_R  = 1.20;   // radio de influencia (unidades mundo)
    const CURSOR_R2 = CURSOR_R * CURSOR_R;
    const PUSH      = 0.28;   // fuerza máxima
    const SPRING    = 0.030;  // constante de retorno
    const DAMP      = 0.81;   // amortiguación velocidad

    // ════════════════════════════════════════════
    //  ANIMACIÓN
    // ════════════════════════════════════════════
    let time = 0;
    let camX = 0, camY = 2.2;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      // Rotar galaxia
      galaxy.rotation.y = time * 0.12;
      galaxy.rotation.x = 0.42 + Math.sin(time * 0.07) * 0.05;

      // ── Raycaster: cursor → espacio local de la galaxia ──────
      // El plano de la galaxia en espacio mundo cambia con su rotación
      let gotHit = false;
      let lx = 0, ly = 0, lz = 0;

      if (isHovering) {
        // Normal del plano de la galaxia (eje Y local en espacio mundo)
        planeNormal.set(0, 1, 0).applyQuaternion(galaxy.quaternion);
        galPlane.setFromNormalAndCoplanarPoint(planeNormal, galaxy.position);

        // Raycast desde la cámara a través del cursor
        mouseNDC.set(mX, mY);
        raycaster.setFromCamera(mouseNDC, camera);

        // Intersectar con el plano de la galaxia
        if (raycaster.ray.intersectPlane(galPlane, worldHit)) {
          // Convertir el punto mundo a espacio LOCAL de la galaxia
          // (galaxy.worldToLocal tiene en cuenta posición + rotación + escala)
          localHit.copy(worldHit);
          galaxy.worldToLocal(localHit);
          lx = localHit.x;
          ly = localHit.y;
          lz = localHit.z;
          gotHit = true;
        }
      }

      // ── Física de partículas ──────────────────────────────────
      const pos = geo.attributes.position.array;

      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;

        // Explosión gaussiana (solo si el cursor está sobre la galaxia)
        if (gotHit) {
          const dx = pos[ix] - lx;
          const dy = pos[iy] - ly;
          const dz = pos[iz] - lz;
          const d2 = dx*dx + dy*dy + dz*dz;

          if (d2 < CURSOR_R2 * 9) {           // chequeo eficiente (9×r²)
            const dist  = Math.sqrt(d2) || 0.001;
            // Fuerza gaussiana: máx en el centro, cae suave sin borde duro
            const force = PUSH * Math.exp(-d2 / CURSOR_R2);
            vel[ix] += (dx / dist) * force;
            vel[iy] += (dy / dist) * force * 0.25;  // menos rebote vertical
            vel[iz] += (dz / dist) * force;
          }
        }

        // Spring de retorno a posición original
        vel[ix] += (origPos[ix] - pos[ix]) * SPRING;
        vel[iy] += (origPos[iy] - pos[iy]) * SPRING;
        vel[iz] += (origPos[iz] - pos[iz]) * SPRING;

        // Amortiguación
        vel[ix] *= DAMP; vel[iy] *= DAMP; vel[iz] *= DAMP;

        // Aplicar velocidad
        pos[ix] += vel[ix];
        pos[iy] += vel[iy];
        pos[iz] += vel[iz];

        // Shimmer suave en partículas en reposo
        const moved = (pos[ix]-origPos[ix])*(pos[ix]-origPos[ix])
                    + (pos[iz]-origPos[iz])*(pos[iz]-origPos[iz]);
        if (moved < 0.004) {
          pos[iy] = origPos[iy] + Math.sin(time * 2.8 + shimmerPhase[i]) * 0.010;
        }
      }

      geo.attributes.position.needsUpdate = true;

      // Halo pulsa
      const p = 1 + Math.sin(time * 1.3) * 0.07;
      halo.scale.set(2.2*p, 2.2*p, 1);

      // Parallax suave de cámara
      camX += (mX * 0.40 - camX) * 0.05;
      camY += (2.0 + mY * 0.30 - camY) * 0.05;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, -0.45, 0);

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

  if (document.readyState === 'complete') { init(); }
  else { window.addEventListener('load', init); }
})();
