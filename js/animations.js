/**
 * animations.js
 * Animaciones al hacer scroll (Intersection Observer)
 *
 * ¿Qué hace?
 * - Observa todos los elementos con clase .reveal
 * - Cuando un elemento entra al viewport → añade .in → aparece
 * - También dispara las barras de skills y contadores al entrar
 *
 * Intersection Observer es más eficiente que escuchar el evento
 * scroll directamente (no bloquea el hilo principal).
 */

function initAnimations() {

  // ── OBSERVER PRINCIPAL ────────────────────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {

        // Solo actuar cuando el elemento entra al viewport
        if (!entry.isIntersecting) return;

        const el = entry.target;

        // 1. Añadir clase .in para activar la animación CSS
        el.classList.add('in');

        // 2. Si hay contadores dentro, animarlos
        el.querySelectorAll('[data-count]').forEach((counter) => {
          animateCounter(counter, parseInt(counter.dataset.count));
        });

        // 3. Si hay barras de skills dentro, animarlas
        if (el.querySelector('.bar-fill')) {
          animateSkillBars();
        }

        // Dejar de observar este elemento (la animación ya se hizo)
        observer.unobserve(el);
      });
    },
    {
      threshold: 0.1, // El elemento debe estar 10% visible para activarse
    }
  );

  // Observar todos los elementos con .reveal
  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Animar las barras de nivel de skills
 * Añade la clase .animated que activa la transición CSS en sections.css
 */
function animateSkillBars() {
  document.querySelectorAll('.bar-fill').forEach((bar) => {
    bar.classList.add('animated');
  });
}

/**
 * Animar el hero al cargar la página (sin scroll)
 * Los hijos del hero-content aparecen en cascada
 */
function animateHeroEntrance() {
  const heroChildren = document.querySelectorAll('.hero-content > *');

  heroChildren.forEach((el, index) => {
    // Estado inicial
    el.style.opacity   = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity 0.7s ${index * 0.1}s ease,
                           transform 0.7s ${index * 0.1}s ease`;

    // Activar con pequeño delay inicial
    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    }, 150 + index * 110);
  });
}
