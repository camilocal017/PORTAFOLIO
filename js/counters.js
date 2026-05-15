/**
 * counters.js
 * Animación de contadores numéricos
 *
 * ¿Qué hace?
 * - Busca todos los elementos con el atributo data-count="N"
 * - Cuando entran al viewport, anima el número de 0 a N
 * - Usa una curva de ease-out para que se vea natural
 *
 * Uso en HTML:
 *   <div data-count="42">0</div>
 */

/**
 * Anima un solo contador desde 0 hasta target
 *
 * @param {HTMLElement} el      - Elemento del DOM a animar
 * @param {number}      target  - Número final
 * @param {number}      duration - Duración en ms (por defecto 1400ms)
 */
function animateCounter(el, target, duration = 1400) {

  let startTime = null;

  function step(timestamp) {

    // Guardar el momento en que empezó la animación
    if (!startTime) startTime = timestamp;

    // Progreso de 0 a 1 según el tiempo transcurrido
    const progress = Math.min((timestamp - startTime) / duration, 1);

    // Curva ease-out: empieza rápido, termina despacio
    // Math.pow(1 - progress, 4) → deceleración pronunciada
    const easedProgress = 1 - Math.pow(1 - progress, 4);

    // Calcular y mostrar el número actual
    const currentValue = Math.floor(easedProgress * target);
    el.textContent = currentValue + (progress >= 1 ? '+' : '');

    // Continuar hasta llegar al 100%
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/**
 * Inicializar todos los contadores de la página
 * Los contadores del hero se animan inmediatamente.
 * Los demás se animan cuando entran al viewport (ver animations.js)
 */
function initCounters() {

  // Animar los contadores del hero con un pequeño delay
  setTimeout(() => {
    document.querySelectorAll('.hstat-n[data-count]').forEach((el) => {
      animateCounter(el, parseInt(el.dataset.count));
    });
  }, 700);
}
