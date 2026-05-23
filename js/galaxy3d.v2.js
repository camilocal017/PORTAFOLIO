/**
 * galaxy3d.v2.js — Sistema solar 3D como fondo del hero
 * Estrella central + anillos orbitales + planetas en órbita
 * Cámara a 30° de elevación → anillos se ven como elipses
 */
(function () {
  const container   = document.getElementById('robot-container');
  const canvas      = document.getElementById('robot-canvas');
  const heroSection = document.getElementById('hero');
  if (!container || !canvas || !heroSection || typeof THREE === 'undefined') return;

  function init() {
    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();

    // Camara a 30° de elevacion → anillos aparecen como elipses
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 5.5, 9.5);
    camera.lookAt(0, 0, 0);

    // Luces
    scene.add(new THREE.AmbientLight(0x111111, 1));
    const starLight = new THREE.PointLight(0xe8a230, 3.5, 18);
    starLight.position.set(0, 0, 0);
    scene.add(starLight);
    const rimLight = new THREE.DirectionalLight(0x334466, 0.4);
    rimLight.position.set(-5, 8, -5);
    scene.add(rimLight);

    // ── Estrella central ─────────────────────────
    const starMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe080 })
    );
    scene.add(starMesh);

    const glowCv = document.createElement('canvas');
    glowCv.width = glowCv.height = 128;
    const gCtx = glowCv.getContext('2d');
    const gGrad = gCtx.createRadialGradient(64,64,0, 64,64,64);
    gGrad.addColorStop(0,   'rgba(255,235,120,0.90)');
    gGrad.addColorStop(0.15,'rgba(232,162, 48,0.45)');
    gGrad.addColorStop(0.5, 'rgba(180,100, 20,0.12)');
    gGrad.addColorStop(1,   'rgba(0,0,0,0)');
    gCtx.fillStyle = gGrad; gCtx.fillRect(0,0,128,128);
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCv),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    glowSprite.scale.set(1.0, 1.0, 1);
    scene.add(glowSprite);

    // ── Anillos de particulas ─────────────────────
    const ringDefs = [
      { r: 0.70, count:  280, spread: 0.06, col: [1.00, 0.92, 0.55] },
      { r: 1.25, count:  420, spread: 0.08, col: [0.96, 0.76, 0.22] },
      { r: 1.95, count:  560, spread: 0.11, col: [0.91, 0.60, 0.13] },
      { r: 2.80, count: 1100, spread: 0.22, col: [0.80, 0.44, 0.08] },
      { r: 3.75, count:  380, spread: 0.13, col: [0.62, 0.30, 0.05] },
      { r: 4.80, count:  260, spread: 0.16, col: [0.44, 0.20, 0.03] },
      { r: 5.90, count:  140, spread: 0.20, col: [0.26, 0.11, 0.01] },
    ];

    const dustCount = 600;
    const COUNT = ringDefs.reduce((s, r) => s + r.count, 0) + dustCount;

    const positions    = new Float32Array(COUNT * 3);
    const origPos      = new Float32Array(COUNT * 3);
    const colors       = new Float32Array(COUNT * 3);
    const shimmerPhase = new Float32Array(COUNT);
    let idx = 0;

    ringDefs.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rr    = ring.r + (Math.random() - 0.5) * ring.spread;
        const x     = Math.cos(angle) * rr;
        const y     = (Math.random() - 0.5) * 0.04;
        const z     = Math.sin(angle) * rr;
        const bri   = 0.55 + Math.random() * 0.45;
        positions[idx*3]   = x; origPos[idx*3]   = x; colors[idx*3]   = ring.col[0]*bri;
        positions[idx*3+1] = y; origPos[idx*3+1] = y; colors[idx*3+1] = ring.col[1]*bri;
        positions[idx*3+2] = z; origPos[idx*3+2] = z; colors[idx*3+2] = ring.col[2]*bri;
        shimmerPhase[idx] = Math.random() * Math.PI * 2;
        idx++;
      }
    });

    for (let i = 0; i < dustCount; i++) {
      const r     = 1.5 + Math.random() * 5.0;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle)*r + (Math.random()-0.5)*2;
      const y = (Math.random()-0.5)*0.3;
      const z = Math.sin(angle)*r + (Math.random()-0.5)*2;
      const v = 0.08 + Math.random()*0.15;
      positions[idx*3]=x; origPos[idx*3]=x; colors[idx*3]=v*0.9;
      positions[idx*3+1]=y; origPos[idx*3+1]=y; colors[idx*3+1]=v*0.6;
      positions[idx*3+2]=z; origPos[idx*3+2]=z; colors[idx*3+2]=v*0.1;
      shimmerPhase[idx] = Math.random()*Math.PI*2;
      idx++;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    const mat = new THREE.PointsMaterial({
      size: 0.030, vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true, opacity: 0.85,
      depthWrite: false, sizeAttenuation: true
    });
    const disk = new THREE.Points(geo, mat);
    scene.add(disk);

    // ── Planetas que orbitan ──────────────────────
    const planetDefs = [
      { r: 1.25, speed: 0.55, size: 0.065, color: 0xcc9955, emissive: 0x442200 },
      { r: 1.95, speed: 0.35, size: 0.085, color: 0xddbb77, emissive: 0x553300 },
      { r: 3.75, speed: 0.16, size: 0.075, color: 0xcc5533, emissive: 0x441100 },
      { r: 4.80, speed: 0.09, size: 0.130, color: 0xe8a230, emissive: 0x4a2800 },
    ];
    const planets = planetDefs.map(d => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(d.size, 12, 12),
        new THREE.MeshPhongMaterial({ color: d.color, emissive: d.emissive, specular: 0x222222, shininess: 60 })
      );
      scene.add(mesh);
      return { mesh, r: d.r, speed: d.speed, angle: Math.random()*Math.PI*2 };
    });

    // ── Cursor ────────────────────────────────────
    let mX = 0, mY = 0, isHovering = false;
    const raycaster     = new THREE.Raycaster();
    const mouseNDC      = new THREE.Vector2();
    const worldHit      = new THREE.Vector3();
    const localHit      = new THREE.Vector3();
    const interactPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    heroSection.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mX =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      isHovering = true;
    });
    heroSection.addEventListener('mouseleave', () => { isHovering = false; });

    // ── Fisica ────────────────────────────────────
    const vel      = new Float32Array(COUNT * 3);
    const CURSOR_R  = 0.75;
    const CURSOR_R2 = CURSOR_R * CURSOR_R;
    const PUSH      = 0.28;
    const SPRING    = 0.030;
    const DAMP      = 0.82;

    // ── Loop ──────────────────────────────────────
    let time = 0;
    let camX = 0, camY = 5.5;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.007;

      disk.rotation.y = time * 0.08;

      const pulse = 1 + Math.sin(time * 1.8) * 0.06;
      glowSprite.scale.set(pulse, pulse, 1);

      planets.forEach(p => {
        p.angle += p.speed * 0.007;
        p.mesh.position.x = Math.cos(p.angle) * p.r;
        p.mesh.position.z = Math.sin(p.angle) * p.r;
        p.mesh.rotation.y += 0.02;
      });

      let gotHit = false, lx = 0, lz = 0;
      if (isHovering) {
        mouseNDC.set(mX, mY);
        raycaster.setFromCamera(mouseNDC, camera);
        if (raycaster.ray.intersectPlane(interactPlane, worldHit)) {
          localHit.copy(worldHit);
          disk.worldToLocal(localHit);
          lx = localHit.x; lz = localHit.z;
          gotHit = true;
        }
      }

      const pos = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = ix+1, iz = ix+2;
        if (gotHit) {
          const dx = pos[ix]-lx, dz = pos[iz]-lz;
          const d2 = dx*dx + dz*dz;
          if (d2 < CURSOR_R2 * 9) {
            const dist  = Math.sqrt(d2) || 0.001;
            const force = PUSH * Math.exp(-d2 / CURSOR_R2);
            vel[ix] += (dx/dist)*force;
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
        if (moved < 0.003) {
          pos[iy] = origPos[iy] + Math.sin(time*2.4+shimmerPhase[i])*0.006;
        }
      }
      geo.attributes.position.needsUpdate = true;

      camX += (mX*0.8 - camX)*0.04;
      camY += (5.5 + mY*0.5 - camY)*0.04;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 0, 0);

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
