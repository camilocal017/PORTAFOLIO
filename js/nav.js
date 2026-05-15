/**
 * nav.js
 * Navegación — comportamiento al hacer scroll y menú móvil
 *
 * Funcionalidades:
 * 1. Nav compacta al bajar la página (clase .scrolled)
 * 2. Abrir / cerrar menú móvil con el botón hamburguesa
 */

function initNav() {

  const navbar     = document.getElementById('navbar');
  const burger     = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  // ── 1. NAV COMPACTA AL HACER SCROLL ──────────────────────
  // Escucha el evento scroll del navegador
  window.addEventListener('scroll', () => {

    // Si bajamos más de 60px → activar modo compacto
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ── 2. MENÚ MÓVIL ─────────────────────────────────────────
  // Alternar el menú al hacer click en el botón hamburguesa
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

/**
 * Cerrar el menú móvil al hacer click en un link
 * Esta función se llama desde el onclick de cada link en el HTML
 */
function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.remove('open');
}
