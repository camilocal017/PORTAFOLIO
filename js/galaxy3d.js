/**
 * galaxy3d.js — Galaxia espiral Three.js
 * Cursor: coordenadas relativas al CONTENEDOR (no a la ventana)
 * Explosión real solo cuando el cursor está dentro del canvas.
 */
(function () {
  const container = document.getElementById('robot-container');
  const canvas    = document.getElementById('robot-canvas');
  if (!container || !canvas || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || 360;
    const H = container.clientHeight || 520;

    // ── Renderer ──────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Escena ────────────────────────────────────
    const scene  = new THREE.Scene();

    // Cámara: mira hacia abajo para que la galaxia inclinada quede centrada en canvas
    const camera = new THREE.PerspectiveCamera(56, W / H, 0.1, 100);
    camera.position.set(0, 2.2, 7.5);
    camera.lookAt(0, -0.55, 0);  // apuntar más abajo → galaxia sube en el canvas

    // ════════════════════════════════════════════
    //  GALAXIA — partículas en brazos espirales
    // ════════════════════════════════════════════
    const COUNT  = 6000;
    const RADIUS = 3.8;
    const ARMS   = 3;
    const SPIN   = 1.75;
    const SPREAD = 0.30;

    const positions = new Float32Array(COUNT * 3);
    const origPos   = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    // Canales de color (r,g,b 0–1)
    const WHITE  = [1.00, 0.97, 0.90];
    const AMBER  = [0.91, 0.64, 0.19];
    const DEEP   = [0.82, 0.20, 0.02];
    const COOL   = [0.55, 0.72, 1.00];

    const lc = (a, b, t) => a + (b - a) * t;

    for (let i = 0; i < COUNT; i++) {
      let x, y, z, cr, cg, cb;

      // Núcleo central (15 %)
      if (i < COUNT * 0.15) {
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

      // Brazos espirales (85 %)
      } else {
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

      positions[i*3]   = x;   origPos[i*3]   = x;   colors[i*3]   = cr;
      positions[i*3+1] = y;   origPos[i*3+1] = y;   colors[i*3+1] = cg;
      positions[i*3+2] = z;   origPos[i*3+2] = z;   colors[i*3+2] = cb;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const mat = new THREE.PointsMaterial({
      size: 0.040, vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.92, depthWrite: false,
      sizeAttenuation: true
    });

    const galaxy = new THREE.Points(geo, mat);
    scene.add(galaxy);

    // Halo central (sprite suave)
    const haloCv  = document.createElement('canvas');
    haloCv.width  = haloCv.height = 128;
    const hCtx = haloCv.getContext('2d');
    const grad = hCtx.createRadialGradient(64,64,0, 64,64,64);
    grad.addColorStop(0,   'rgba(255,215,90, 0.60)');
    grad.addColorStop(0.3, 'rgba(232,162,48, 0.20)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    hCtx.fillStyle = grad; hCtx.fillRect(0,0,128,128);
    const haloTex = new THREE.CanvasTexture(haloCv);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(2.2, 2.2, 1);
    scene.add(halo);

    // ════════════════════════════════════════════
    //  CURSOR — solo dentro del contenedor
    // ════════════════════════════════════════════
    let mX = 0, mY = 0, isHovering = false;

    // Parámetros de proyección aproximada para mapear
    // cursor (NDC del contenedor) → espacio local de la galaxia
    // Cámara z=7.5, fov=56° → half_h = tan(28°)×7.5 = 3.99
    // half_w = half_h × aspectPortrait ≈ 3.99 × (W/H)
    const SCALE_Y = 3.8;  // unidades mundo ↔ NDC vertical
    // SCALE_X calculado dinámicamente con aspect ratio del contenedor

    container.addEventListener('mousemove', e => {
      const rect = container.getBoundingClientRect();
      mX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;   // −1..1 dentro del canvas
      mY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      isHovering = true;
    });
    container.addEventListener('mouseleave', () => { isHovering = false; });

    // ════════════════════════════════════════════
    //  FÍSICA
    // ════════════════════════════════════════════
    const vel = new Float32Array(COUNT * 3);

    // Parámetros de explosión
    const CURSOR_R = 1.20;   // radio de influencia (unidades galaxia)
    const PUSH     = 0.18;   // fuerza de empuje
    const SPRING   = 0.030;  // constante de retorno
    const DAMP     = 0.80;   // amortiguación

    // ════════════════════════════════════════════
    //  ANIMACIÓN
    // ════════════════════════════════════════════
    let time = 0;

    // Posición suavizada de la cámara (parallax)
    let camX = 0, camY = 2.0;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.008;

      // Rotación de la galaxia
      galaxy.rotation.y  = time * 0.12;
      galaxy.rotation.x  = 0.42 + Math.sin(time * 0.07) * 0.05;

      // ── Mapear cursor al espacio LOCAL de la galaxia ──
      // Convertir NDC del contenedor a coordenadas mundo (plano xz a y≈0)
      // y luego desrotar por rotación Y de la galaxia
      let localX = 0, localY = 0, localZ = 0;

      if (isHovering) {
        const aspect   = W / H;
        const worldX   = mX * SCALE_Y * aspect * 0.68; // factor empírico de la cámara
        const worldY   = mY * SCALE_Y * 0.55;
        const gy       = -galaxy.rotation.y;
        localX = worldX * Math.cos(gy);
        localZ = worldX * Math.sin(gy);
        localY = worldY;
      }

      // ── Física de partículas ──────────────────
      const pos = geo.attributes.position.array;

      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;

        // Empujar solo si el cursor está dentro del canvas
        if (isHovering) {
          const dx = pos[ix] - localX;
          const dy = pos[iy] - localY;
          const dz = pos[iz] - localZ;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.001;

          if (dist < CURSOR_R) {
            const force = (1 - dist / CURSOR_R);
            const f2 = force * force * PUSH;   // cuadrático = mas fuerte en el centro
            vel[ix] += (dx / dist) * f2;
            vel[iy] += (dy / dist) * f2 * 0.35;
            vel[iz] += (dz / dist) * f2;
          }
        }

        // Spring de retorno a posición original
        vel[ix] += (origPos[ix] - pos[ix]) * SPRING;
        vel[iy] += (origPos[iy] - pos[iy]) * SPRING;
        vel[iz] += (origPos[iz] - pos[iz]) * SPRING;

        vel[ix] *= DAMP; vel[iy] *= DAMP; vel[iz] *= DAMP;
        pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz];
      }
      geo.attributes.position.needsUpdate = true;

      // Halo pulsa
      const pulse = 1 + Math.sin(time * 1.3) * 0.07;
      halo.scale.set(2.2 * pulse, 2.2 * pulse, 1);

      // Parallax suave de cámara
      camX += (mX * 0.45 - camX) * 0.05;
      camY += (2.2 + mY * 0.35 - camY) * 0.05;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, -0.55, 0);

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
