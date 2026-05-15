/**
 * ticker.js
 * Banda de tecnologías — marquee horizontal
 *
 * ¿Qué hace?
 * - Lee el array TECH_STACK
 * - Genera los elementos HTML dinámicamente
 * - Duplica la lista para que el scroll sea infinito y sin saltos
 *
 * Para agregar o quitar tecnologías:
 *   Edita el array TECH_STACK
 */

function initTicker() {

  // ── LISTA DE TECNOLOGÍAS ──────────────────────────────────
  // ← EDITAR: agrega o quita tecnologías según tu stack real
  const TECH_STACK = [
    'Python',
    'Django',
    'Flask',
    'React',
    'JavaScript',
    'HTML5 / CSS3',
    'Bootstrap',
    'MySQL',
    'Pandas',
    'Power BI',
    'Excel Avanzado',
    'Git / GitHub',
    'Matplotlib',
    'REST APIs',
    'Jupyter Notebook',
    'Data Analysis',
  ];

  const track = document.getElementById('ticker-track');

  if (!track) return; // Salir si el elemento no existe

  // Duplicar la lista: al terminar la primera copia,
  // la segunda ya está visible → loop perfecto sin salto
  const doubledList = [...TECH_STACK, ...TECH_STACK];

  // Crear un <span> por cada tecnología y añadirlo al track
  doubledList.forEach((tech) => {
    const span = document.createElement('span');
    span.className   = 'ticker-item';
    span.textContent = tech;
    track.appendChild(span);
  });
}
