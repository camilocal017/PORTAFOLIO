/**
 * typed.js
 * Efecto de escritura y borrado en el rol del hero
 *
 * ¿Qué hace?
 * - Escribe el texto letra a letra
 * - Pausa 2.2 segundos
 * - Borra el texto letra a letra
 * - Pasa al siguiente texto de la lista
 * - Repite infinitamente
 *
 * Para cambiar los textos: edita el array ROLES
 */

function initTyped() {

  // ── CONFIGURACIÓN ─────────────────────────────────────────
  const ROLES = [
    'Full Stack Developer.',
    'Data Analyst.',
    'Python & Django Dev.',
    'Backend Engineer.',
    'Problem Solver.',
  ];

  const SPEED_WRITE  = 72;   // ms entre cada letra al escribir
  const SPEED_DELETE = 38;   // ms entre cada letra al borrar
  const PAUSE_END    = 2200; // ms de pausa cuando termina de escribir

  // ── ESTADO INTERNO ────────────────────────────────────────
  let roleIndex   = 0;     // Índice del rol actual
  let charIndex   = 0;     // Número de caracteres mostrados
  let isDeleting  = false; // ¿Está borrando o escribiendo?

  // Elemento del DOM donde se muestra el texto
  const el = document.getElementById('hero-role');

  if (!el) return; // Salir si el elemento no existe

  // ── FUNCIÓN PRINCIPAL ─────────────────────────────────────
  function type() {
    const currentRole = ROLES[roleIndex];

    if (!isDeleting) {
      // ESCRIBIENDO: mostrar más caracteres
      charIndex++;
      el.innerHTML = currentRole.substring(0, charIndex)
                   + '<span class="typed-cursor">|</span>';

      if (charIndex === currentRole.length) {
        // Terminó de escribir → pausar antes de borrar
        setTimeout(() => {
          isDeleting = true;
          type();
        }, PAUSE_END);
        return; // Salir para no llamar setTimeout dos veces
      }

    } else {
      // BORRANDO: mostrar menos caracteres
      charIndex--;
      el.innerHTML = currentRole.substring(0, charIndex)
                   + '<span class="typed-cursor">|</span>';

      if (charIndex === 0) {
        // Terminó de borrar → pasar al siguiente rol
        isDeleting  = false;
        roleIndex   = (roleIndex + 1) % ROLES.length;
        setTimeout(type, 300);
        return;
      }
    }

    // Velocidad diferente según si escribe o borra
    const delay = isDeleting ? SPEED_DELETE : SPEED_WRITE;
    setTimeout(type, delay);
  }

  // Arrancar con un pequeño delay inicial
  setTimeout(type, 800);
}
