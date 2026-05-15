/**
 * cursor.js
 * Cursor personalizado — reemplaza el cursor del sistema
 *
 * ¿Cómo funciona?
 * - #cursor-dot   → sigue al mouse exactamente, sin retraso
 * - #cursor-ring  → sigue con suavidad (efecto de inercia)
 * - En hover sobre links/botones: el dot se agranda (ver variables.css)
 *
 * Para desactivar el cursor custom:
 *   Comenta initCursor() en main.js y borra cursor: none del body en base.css
 */

function initCursor() {

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  // Posición real del mouse
  let mouseX = 0;
  let mouseY = 0;

  // Posición interpolada del anillo
  let ringX = 0;
  let ringY = 0;

  // Se actualiza en cada movimiento del mouse
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  /**
   * Loop principal de animación
   * requestAnimationFrame garantiza ~60 fps sin bloquear el hilo
   */
  function loop() {
    // El punto sigue exactamente al mouse
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';

    // El anillo interpola hacia la posición del mouse
    // 0.1 = suave y lento / 0.3 = más reactivo
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;

    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';

    requestAnimationFrame(loop);
  }

  loop();

  // Añadir / quitar clase hover en elementos interactivos
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}
