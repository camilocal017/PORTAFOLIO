/**
 * main.js
 * Punto de entrada — inicializa todos los módulos
 *
 * ¿Qué hace?
 * Espera a que el DOM esté listo y luego llama a cada función
 * de inicialización en el orden correcto.
 *
 * Archivos JS del proyecto:
 * ┌─────────────────┬──────────────────────────────────────────┐
 * │ cursor.js       │ Cursor personalizado con inercia          │
 * │ nav.js          │ Nav compacta al scroll + menú móvil       │
 * │ typed.js        │ Efecto de escritura en el rol del hero    │
 * │ counters.js     │ Animación de números (3+, 6+, 10+)        │
 * │ animations.js   │ Reveal al scroll + barras de skills       │
 * │ ticker.js       │ Banda de tecnologías (marquee)            │
 * │ main.js         │ Este archivo — orquesta todo lo demás     │
 * └─────────────────┴──────────────────────────────────────────┘
 */

// DOMContentLoaded: el HTML está parseado pero las imágenes
// pueden no haberse cargado aún — es el momento correcto para
// manipular el DOM sin esperar recursos externos.
document.addEventListener('DOMContentLoaded', () => {

  // 1. Cursor personalizado
  initCursor();

  // 2. Comportamiento de la navegación
  initNav();

  // 3. Efecto de escritura del hero
  initTyped();

  // 4. Contadores del hero (animan al cargar)
  initCounters();

  // 5. Animaciones de entrada al hacer scroll
  initAnimations();

  // 6. Animación de entrada del hero (sin scroll)
  animateHeroEntrance();

  // 7. Ticker / marquee de tecnologías
  initTicker();

  console.log('✅ Portfolio de Camilo Calderón — todos los módulos iniciados');
});
