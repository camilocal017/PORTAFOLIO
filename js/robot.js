/**
 * robot.js — Humanoide que sigue el cursor
 *
 * Cabeza: rotateY() + rotateX() = giro 3D real (no inclinación 2D)
 * Cuerpo: rotateY() sutil para acompañar
 * Pupilas: translate() dentro del ojo
 */
(function () {
  const container = document.getElementById('robot-container');
  const head      = document.getElementById('bot-head');
  const body      = document.getElementById('bot-body');
  const pupilL    = document.getElementById('pupil-l');
  const pupilR    = document.getElementById('pupil-r');

  if (!container || !head) return;

  // Máximos de rotación
  const HEAD_Y  = 38;   // giro horizontal cabeza (deg)
  const HEAD_X  = 20;   // inclinación vertical cabeza (deg)
  const BODY_Y  = 10;   // giro horizontal cuerpo (deg)
  const EYE_PX  = 5;    // movimiento pupila (px)

  // Targets (actualizados por mousemove)
  let tHY = 0, tHX = 0, tBY = 0, tEX = 0, tEY = 0;
  // Actuales suavizados (lerp)
  let cHY = 0, cHX = 0, cBY = 0, cEX = 0, cEY = 0;

  const lerp = (a, b, t) => a + (b - a) * t;

  document.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    // Normalizar: -1 a 1
    const nx =  (e.clientX - cx) / (window.innerWidth  / 2);
    const ny = -(e.clientY - cy) / (window.innerHeight / 2); // invertir Y

    tHY = nx * HEAD_Y;
    tHX = ny * HEAD_X;
    tBY = nx * BODY_Y;
    tEX = nx * EYE_PX;
    tEY = -ny * EYE_PX * 0.6;
  });

  function tick() {
    // Suavizar
    cHY = lerp(cHY, tHY, 0.07);
    cHX = lerp(cHX, tHX, 0.07);
    cBY = lerp(cBY, tBY, 0.04);
    cEX = lerp(cEX, tEX, 0.12);
    cEY = lerp(cEY, tEY, 0.12);

    // Cabeza: giro 3D real (rotateY = izq/der, rotateX = arriba/abajo)
    head.style.transform = `rotateY(${cHY}deg) rotateX(${cHX}deg)`;

    // Cuerpo: giro suave acompañando
    if (body) body.style.transform = `rotateY(${cBY}deg)`;

    // Pupilas: translate dentro del ojo
    if (pupilL) pupilL.style.transform = `translate(${cEX}px, ${cEY}px)`;
    if (pupilR) pupilR.style.transform = `translate(${cEX}px, ${cEY}px)`;

    requestAnimationFrame(tick);
  }

  tick();
})();
