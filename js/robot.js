/**
 * robot.js
 * Robot SVG que sigue el cursor con cabeza y cuerpo independientes.
 * Usa lerp (interpolación lineal) para movimiento suave sin saltos.
 */
(function () {
  const container  = document.getElementById('robot-container');
  const robotRoot  = document.getElementById('robot-root');
  const headGroup  = document.getElementById('robot-head-group');
  const pupilL     = document.getElementById('pupil-left');
  const pupilLi    = document.getElementById('pupil-left-inner');
  const pupilR     = document.getElementById('pupil-right');
  const pupilRi    = document.getElementById('pupil-right-inner');

  if (!container || !robotRoot) return;

  // Posiciones de pupilas en reposo
  const EYE_L = { x: 138, y: 100 };
  const EYE_R = { x: 182, y: 100 };
  const EYE_RANGE = 7; // píxeles máx de movimiento de pupila

  // Valores objetivo (actualizados por mousemove)
  let tBody = 0, tHead = 0, tEyeX = 0, tEyeY = 0;
  // Valores actuales suavizados (actualizados por lerp)
  let cBody = 0, cHead = 0, cEyeX = 0, cEyeY = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  document.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Normalizar: -1 a 1 según posición en pantalla
    const nx = (e.clientX - cx) / (window.innerWidth  / 2);
    const ny = (e.clientY - cy) / (window.innerHeight / 2);

    tBody  = nx * 9;          // cuerpo: máx ±9°
    tHead  = nx * 22;         // cabeza: máx ±22°
    tEyeX  = nx * EYE_RANGE;  // ojo X: máx ±7px
    tEyeY  = ny * (EYE_RANGE * 0.6); // ojo Y: máx ±4px
  });

  function tick() {
    // Suavizar con lerp — valores más pequeños = más lento/suave
    cBody  = lerp(cBody,  tBody,  0.05);
    cHead  = lerp(cHead,  tHead,  0.09);
    cEyeX  = lerp(cEyeX,  tEyeX,  0.12);
    cEyeY  = lerp(cEyeY,  tEyeY,  0.12);

    // Aplicar rotación al cuerpo (desde los pies)
    robotRoot.style.transform = `rotate(${cBody}deg)`;

    // Cabeza rota más — se resta la rotación del cuerpo para que sea relativa
    headGroup.style.transform = `rotate(${cHead - cBody}deg)`;

    // Mover pupilas
    pupilL.setAttribute('cx',  EYE_L.x + cEyeX);
    pupilL.setAttribute('cy',  EYE_L.y + cEyeY);
    pupilLi.setAttribute('cx', EYE_L.x + cEyeX);
    pupilLi.setAttribute('cy', EYE_L.y + cEyeY);

    pupilR.setAttribute('cx',  EYE_R.x + cEyeX);
    pupilR.setAttribute('cy',  EYE_R.y + cEyeY);
    pupilRi.setAttribute('cx', EYE_R.x + cEyeX);
    pupilRi.setAttribute('cy', EYE_R.y + cEyeY);

    requestAnimationFrame(tick);
  }

  tick();
})();
