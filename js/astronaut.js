/**
 * astronaut.js — Compañero astronauta fijo en pantalla
 * - Ojos siguen el cursor
 * - Burbujas según sección visible
 * - Modo sleep tras 28s de inactividad
 * - Saludo al hacer hover
 */
(function () {
  const companion  = document.getElementById('astronaut-companion');
  const bubble     = document.getElementById('companion-bubble');
  const bubbleTxt  = document.getElementById('bubble-text');
  const pupilL     = document.getElementById('astro-pupil-l');
  const pupilR     = document.getElementById('astro-pupil-r');
  if (!companion || !bubble || !pupilL) return;

  // ── Mensajes por sección ────────────────────
  const MSGS = {
    hero:       '¡Explorando el universo de Camilo! 🚀',
    about:      'Conoce al desarrollador detrás del código 👨‍💻',
    skills:     'Mira todas estas herramientas ⚡',
    projects:   '¡Proyectos reales, resultados reales! 🛠️',
    experience: 'La experiencia lo respalda 💼',
    contact:    '¡Dale, escríbele! No muerde 📬',
  };

  // ── Burbuja ─────────────────────────────────
  let bubbleTimer = null;

  function showBubble(text, duration = 3800) {
    bubbleTxt.textContent = text;
    bubble.classList.remove('hidden');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), duration);
  }

  // Burbuja inicial tras 1.5s
  setTimeout(() => showBubble(MSGS.hero, 4500), 1500);

  // ── Scroll → sección activa ─────────────────
  const sections = Object.keys(MSGS);
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && id !== 'hero') {
        showBubble(MSGS[id]);
      }
    }, { threshold: 0.45 });
    obs.observe(el);
  });

  // ── Ojos siguen el cursor ───────────────────
  // Posición base de pupilas en el SVG (coordenadas viewBox)
  const BASE = { lx: 30, ly: 39, rx: 50, ry: 39 };
  const MAX_MOVE = 2.2; // px en viewBox

  document.addEventListener('mousemove', e => {
    wake();

    const rect = companion.getBoundingClientRect();
    // Centro aprox de los ojos en pantalla
    const eyeCX = rect.left + rect.width  * 0.50;
    const eyeCY = rect.top  + rect.height * 0.31;

    const dx   = e.clientX - eyeCX;
    const dy   = e.clientY - eyeCY;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx   = (dx / dist) * Math.min(dist / 80, 1) * MAX_MOVE;
    const ny   = (dy / dist) * Math.min(dist / 80, 1) * MAX_MOVE;

    pupilL.setAttribute('cx', BASE.lx + nx);
    pupilL.setAttribute('cy', BASE.ly + ny);
    pupilR.setAttribute('cx', BASE.rx + nx);
    pupilR.setAttribute('cy', BASE.ry + ny);
  });

  // ── Modo sleep ──────────────────────────────
  let sleepTimer = null;
  let sleeping   = false;

  function sleep() {
    sleeping = true;
    companion.classList.add('sleeping');
    showBubble('Zzz... 💤', 99999);
  }

  function wake() {
    clearTimeout(sleepTimer);
    if (sleeping) {
      sleeping = false;
      companion.classList.remove('sleeping');
      showBubble('¡Estoy aquí! 👀');
    }
    sleepTimer = setTimeout(sleep, 28000);
  }

  wake(); // arranca el temporizador

  // ── Hover: saludo ────────────────────────────
  companion.addEventListener('mouseenter', () => {
    wake();
    companion.classList.add('waving');
    showBubble('¡Hola! 👋  ¿Todo bien?');
  });
  companion.addEventListener('mouseleave', () => {
    companion.classList.remove('waving');
  });

  // ── Click: mensaje random ───────────────────
  const clicks = [
    '¡Suerte en tu proyecto! 🌟',
    'El código es poesía 🖥️',
    '¡No olvides hacer commit! 💾',
    'Camilo lo construyó con ❤️',
    '¿Ya viste los proyectos? 🚀',
  ];
  let clickIdx = 0;
  companion.addEventListener('click', () => {
    showBubble(clicks[clickIdx % clicks.length]);
    clickIdx++;
  });

})();
