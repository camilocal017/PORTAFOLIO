/**
 * galaxy3d.js — Galaxia espiral como FONDO del hero
 * Cubre todo el #hero, detrás del texto.
 * Cursor: escucha en #hero completo (no bloquea clics del texto).
 * Raycaster real: intersección con el plano de la galaxia.
 */
(function () {
  const container   = document.getElementById('robot-container');
  const canvas      = document.getElementById('robot-canvas');
  const heroSection = document.getElementById('hero');
  if (!container || !canvas || !heroSection || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    // ── Renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();

    // Cámara más alta → galaxia se ve como disco de fondo
    const camera = new THREE.PerspectiveCamera(68, W / H, 0.1, 100);
    camera.position.set(0, 3.8, 4.5);
    camera.lookAt(0, 0, 0);

    // ════════════════════════════════════════════
    //  GALAXIA — más grande para cubrir el fondo
    // ════════════════════════════════════════════
    const COUNT  = 8000;
    const RADIUS = 6.0;
    const ARMS   = 3;
    const SPIN   = 1.75;
    const SPREAD = 0.32;

    const positions    = new Float32Array(COUNT * 3);
    const origPos      = new Float32Array(COUNT * 3);
    const colors       = new Float32Array(COUNT * 3);
    const shimmerPhase = new Float32Array(COUNT);

    const WHITE = [1.00, 0.97, 0.90];
    const AMBER = [0.91, 0.64, 0.19];
    const DEEP  = [0.75, 0.18, 0.02];
    const COOL  = [0.55, 0.72, 1.00];
    const lc    = (a, b, t) => a + (b - a) * t;

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, cr, cg, cb;
      shimmerPhase[i] = Math.random() * Math.PI * 2;

      if (i < COUNT * 0.04) {                            // núcleo muy reducido
        const r     = Math.pow(Math.random(), 2) * 0.40; // radio menor
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta) * 0.20;
        z = r * Math.cos(phi);
        // Colores más tenues para que no saturen con blending aditivo
        cr = AMBER[0] * 0.55;
        cg = AMBER[1] * 0.55;
        cb = AMBER[2] * 0.55;
      } else {                                            // brazos
        const arm   = i % ARMS;
        const t     = Math.pow(Math.random(), 0.52);
        const r     = 0.5 + t * RADIUS;
        const angle = t * Math.PI * 4 * SPIN + (arm / ARMS) * Math.PI * 2;
        const scat  = SPREAD * (0.3 + t * 0.7);
        x = Math.cos(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;
        y = (Math.random() - 0.5) * 0.20 * (1 - t * 0.80);
        z = Math.sin(angle) * r + (Math.random() - 0.5) * scat * r * 0.5;

        const ratio = r / RADIUS;
        if (Math.random() < 0.05) {
          cr = COOL[0]; cg = COOL[1]; cb = COOL[2];
        } else if (ratio < 0.40) {
          const m = ratio / 0.40;
          cr = lc(WHITE[0], AMBER[0], m);
          cg = lc(WHITE[1], AMBER[1], m);
          cb = lc(WHITE[2], AMBER[2], m);
        } else {
          const m    = (ratio - 0.40) / 0.60;
          const fade = 1 - Math.max(0, (ratio - 0.68) / 0.32);
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
      size: 0.038, vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.72,   // semi-transparente → texto legible
      depthWrite: false, sizeAttenuation: true
    });

    const galaxy = new THREE.Points(geo, mat);
    scene.add(galaxy);

    // (halo eliminado — el blending aditivo del núcleo ya lo saturaba)

    // ════════════════════════════════════════════
    //  CURSOR — escucha en #hero completo
    //  (pointer-events:none en canvas → clics del texto funcionan)
    // ════════════════════════════════════════════
    let mX = 0, mY = 0, isHovering = false;

    const raycaster   = new THREE.Raycaster();
    const mouseNDC    = new THREE.Vector2();
    const worldHit    = new THREE.Vector3();
    const localHit    = new THREE.Vector3();
    const planeNormal = new THREE.Vector3();
    const galPlane    = new THREE.Plane();

    // Escuchar en el hero section (abarca texto + fondo)
    heroSection.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();  // canvas = inset:0 del hero
      mX = ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      isHovering = true;
    });
    heroSection.addEventListener('mouseleave', () => { isHovering = false; });

    // ════════════════════════════════════════════
    //  FÍSICA
    // ════════════════════════════════════════════
    const vel      = new Float32Array(COUNT * 3);
    const CURSOR_R  = 0.75;
    const CURSOR_R2 = CURSOR_R * CURSOR_R;  // se actualiza automático
    const PUSH      = 0.32;
    const SPRING    = 0.028;
    const DAMP      = 0.82;

    // ════════════════════════════════════════════
    //  ANIMACIÓN
    // ════════════════════════════════════════════
    let time = 0;
    let camX = 0, camY = 3.8;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.007;

      galaxy.rotation.y = time * 0.10;
      galaxy.rotation.x = 0.38 + Math.sin(time * 0.06) * 0.04;

      // Raycaster: cursor → espacio local de la galaxia
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
          const dx = pos[ix] - lx;
          const dy = pos[iy] - ly;
          const dz = pos[iz] - lz;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < CURSOR_R2 * 9) {
            const dist  = Math.sqrt(d2) || 0.001;
            const force = PUSH * Math.exp(-d2 / CURSOR_R2);
            vel[ix] += (dx / dist) * force;
            vel[iy] += (dy / dist) * force * 0.20;
            vel[iz] += (dz / dist) * force;
          }
        }

        vel[ix] += (origPos[ix] - pos[ix]) * SPRING;
        vel[iy] += (origPos[iy] - pos[iy]) * SPRING;
        vel[iz] += (origPos[iz] - pos[iz]) * SPRING;

        vel[ix] *= DAMP; vel[iy] *= DAMP; vel[iz] *= DAMP;
        pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz];

        // Shimmer en reposo
        const moved = (pos[ix]-origPos[ix])*(pos[ix]-origPos[ix])
                    + (pos[iz]-origPos[iz])*(pos[iz]-origPos[iz]);
        if (moved < 0.004) {
          pos[iy] = origPos[iy] + Math.sin(time * 2.6 + shimmerPhase[i]) * 0.009;
        }
      }

      geo.attributes.position.needsUpdate = true;


      // Parallax suave
      camX += (mX * 0.35 - camX) * 0.04;
      camY += (3.8 + mY * 0.25 - camY) * 0.04;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ────────────────────────────────────
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
