/**
 * spacedog.js — Perrito espacial compañero
 * Corre por el borde inferior de la pantalla.
 * Modo autónomo (rebota) + persigue el cursor cuando se acerca.
 * Al "alcanzar" el cursor se sienta y mueve la cola rápido.
 */
(function () {

  // ════════════════════════════════════════
  //  DOM — crear perro y burbuja
  // ════════════════════════════════════════
  const dog = document.createElement('div');
  dog.id = 'space-dog';
  dog.setAttribute('aria-hidden', 'true');

  // SVG del perro (cara a la derecha por defecto)
  // El flip izquierda/derecha se hace con CSS scaleX(-1)
  dog.innerHTML = `
<svg id="dog-svg" viewBox="0 0 130 88"
     xmlns="http://www.w3.org/2000/svg" width="130" height="88">

  <!-- Sombra suelo -->
  <ellipse cx="64" cy="86" rx="47" ry="4" fill="rgba(0,0,0,0.10)"/>

  <!-- Cola: g exterior pone el origen en la base de la cola;
       g interior (#dog-tail) es el que rotamos con JS         -->
  <g transform="translate(19,53)">
    <g id="dog-tail">
      <path d="M 0 0 Q -16 -14 -9 -30"
            stroke="#c8b89a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <!-- Pelito de la punta -->
      <ellipse cx="-9" cy="-31" rx="5" ry="4"
               fill="#d8c8a4" transform="rotate(20,-9,-31)"/>
    </g>
  </g>

  <!-- Patas traseras (detrás del cuerpo) -->
  <g id="leg-bl">
    <rect x="19" y="60" width="12" height="21" rx="6" fill="#d0d4df"/>
    <ellipse cx="25" cy="82" rx="9" ry="3.5" fill="#b8bdd0"/>
  </g>
  <g id="leg-br">
    <rect x="35" y="60" width="12" height="21" rx="6" fill="#d0d4df"/>
    <ellipse cx="41" cy="82" rx="9" ry="3.5" fill="#b8bdd0"/>
  </g>

  <!-- Cuerpo -->
  <ellipse cx="60" cy="52" rx="36" ry="21" fill="#eceff4"/>
  <!-- Detalle corporal sutil -->
  <ellipse cx="60" cy="50" rx="29" ry="14" fill="none"
           stroke="rgba(232,162,48,0.20)" stroke-width="1.5"/>

  <!-- Patas delanteras (delante del cuerpo) -->
  <g id="leg-fl">
    <rect x="73" y="62" width="12" height="20" rx="6" fill="#dde0ec"/>
    <ellipse cx="79" cy="83" rx="9" ry="3.5" fill="#c5c9dc"/>
  </g>
  <g id="leg-fr">
    <rect x="88" y="62" width="12" height="20" rx="6" fill="#dde0ec"/>
    <ellipse cx="94" cy="83" rx="9" ry="3.5" fill="#c5c9dc"/>
  </g>

  <!-- Cuello -->
  <ellipse cx="91" cy="54" rx="15" ry="12" fill="#eceff4"/>

  <!-- Collar ámbar -->
  <rect x="80" y="59" width="22" height="6" rx="3" fill="#e8a230"/>
  <circle cx="91" cy="65" r="2.5" fill="#c07a14"/>

  <!-- Casco (esfera principal) -->
  <circle cx="97" cy="35" r="26" fill="#eceff4" stroke="#cfd5e3" stroke-width="1.5"/>
  <!-- Aro de unión casco-cuello -->
  <ellipse cx="97" cy="58" rx="19" ry="5.5" fill="none" stroke="#b0b8cc" stroke-width="2.5"/>

  <!-- Orejas -->
  <ellipse cx="77" cy="13" rx="9" ry="13" fill="#d8dce8" transform="rotate(-18,77,13)"/>
  <ellipse cx="113" cy="14" rx="9" ry="13" fill="#d8dce8" transform="rotate(18,113,14)"/>

  <!-- Visor oscuro -->
  <ellipse cx="100" cy="38" rx="17" ry="13" fill="#0d1117"/>
  <!-- Reflejo visor -->
  <ellipse cx="89" cy="28" rx="7" ry="4"
           fill="rgba(255,255,255,0.10)" transform="rotate(-25,89,28)"/>

  <!-- Ojos ámbar (brillan detrás del visor) -->
  <circle cx="93" cy="38" r="5"   fill="#e8a230"/>
  <circle cx="107" cy="38" r="5"  fill="#e8a230"/>
  <circle cx="93" cy="38" r="2.5" fill="#ffe090"/>
  <circle cx="107" cy="38" r="2.5" fill="#ffe090"/>

  <!-- Nariz -->
  <ellipse cx="120" cy="44" rx="5"   ry="3.5" fill="#1a1025"/>
  <ellipse cx="118" cy="42.5" rx="2" ry="1.4" fill="rgba(255,255,255,0.18)"/>

  <!-- Antena -->
  <line x1="107" y1="10" x2="114" y2="1"
        stroke="#b0b8cc" stroke-width="2" stroke-linecap="round"/>
  <circle cx="114" cy="0" r="3.5" fill="#e8a230"/>
  <circle cx="114" cy="0" r="1.8" fill="#ffe090"/>

</svg>`;

  // Burbuja separada del div del perro para evitar problemas con scaleX flip
  const bubble = document.createElement('div');
  bubble.id        = 'dog-bubble';
  bubble.className = 'dog-bubble hidden';
  bubble.innerHTML = '<span id="dog-bubble-text"></span>';

  document.body.appendChild(dog);
  document.body.appendChild(bubble);

  // ════════════════════════════════════════
  //  CSS (inyectado una sola vez)
  // ════════════════════════════════════════
  const css = document.createElement('style');
  css.textContent = `
  #space-dog {
    position:     fixed;
    bottom:       -4px;
    z-index:      9997;
    cursor:       pointer;
    user-select:  none;
    will-change:  left;
  }
  #dog-svg {
    display:    block;
    filter:     drop-shadow(0 3px 12px rgba(232,162,48,0.18));
    transition: filter 0.3s;
  }
  #space-dog:hover #dog-svg {
    filter: drop-shadow(0 4px 22px rgba(232,162,48,0.46));
  }

  /* ── Burbuja ── */
  .dog-bubble {
    position:     fixed;
    background:   rgba(8,8,14,0.93);
    border:       1px solid rgba(232,162,48,0.45);
    border-radius:12px;
    padding:      7px 13px;
    font-family:  var(--font-mono, monospace);
    font-size:    11px;
    color:        #f0e8d8;
    white-space:  nowrap;
    pointer-events: none;
    opacity:      1;
    transition:   opacity 0.3s ease, transform 0.3s ease;
    z-index:      10000;
  }
  .dog-bubble::after {
    content:''; position:absolute; bottom:-6px; left:50%;
    transform:translateX(-50%);
    border:6px solid transparent;
    border-top-color:rgba(232,162,48,0.45); border-bottom:0;
  }
  .dog-bubble.hidden { opacity:0; transform:translateY(5px); }

  /* ── Animaciones de patas (translateY — sin problemas de transform-origin) ── */
  @keyframes legA { 0%,100%{transform:translateY(0)}     50%{transform:translateY(-11px)} }
  @keyframes legB { 0%,100%{transform:translateY(-11px)} 50%{transform:translateY(0)}     }
  @keyframes bodyBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }

  /* Running (velocidad normal) */
  #space-dog.running #leg-bl  { animation: legB 0.30s ease-in-out infinite; }
  #space-dog.running #leg-br  { animation: legA 0.30s ease-in-out infinite; }
  #space-dog.running #leg-fl  { animation: legA 0.30s ease-in-out infinite; }
  #space-dog.running #leg-fr  { animation: legB 0.30s ease-in-out infinite; }
  #space-dog.running  #dog-svg { animation: bodyBob 0.30s ease-in-out infinite; }

  /* Chasing (más rápido) */
  #space-dog.chasing #leg-bl  { animation: legB 0.20s ease-in-out infinite; }
  #space-dog.chasing #leg-br  { animation: legA 0.20s ease-in-out infinite; }
  #space-dog.chasing #leg-fl  { animation: legA 0.20s ease-in-out infinite; }
  #space-dog.chasing #leg-fr  { animation: legB 0.20s ease-in-out infinite; }
  #space-dog.chasing #dog-svg { animation: bodyBob 0.20s ease-in-out infinite; }

  @media (max-width: 768px) { #space-dog, .dog-bubble { display: none; } }
  `;
  document.head.appendChild(css);

  // ════════════════════════════════════════
  //  Referencias a elementos SVG
  // ════════════════════════════════════════
  const tailEl    = document.getElementById('dog-tail');
  const bubbleTxt = document.getElementById('dog-bubble-text');

  // ════════════════════════════════════════
  //  Estado de movimiento
  // ════════════════════════════════════════
  const DOG_W       = 130;
  const MARGIN_L    = 12;
  const MARGIN_R    = 205;    // deja espacio al astronauta (esquina inferior-derecha)
  const CHASE_RANGE = 350;    // px desde el centro del perro: empezar a perseguir
  const CATCH_RANGE = 90;     // px desde el centro: "atrapó" el cursor → sentarse

  let dogX        = MARGIN_L + 100;
  let dogVX       = 2.2;
  let facingRight = true;
  let state       = '';
  let cursorX     = -9999;
  let bubbleTimer = null;
  let time        = 0;        // tiempo acumulado para la cola (JS-driven)

  // ── Mensajes ─────────────────────────────
  const sitMsgs  = ['¡Woof! 🐾', '¡Rásca aquí! 🐕', '*pant pant* 😮‍💨',
                    '¡Qué rico! 😄', '¡Hola! 🚀', '¡Mi astronauta! 🧑‍🚀'];
  const runMsgs  = ['¡Espérame! 💨', '¡Soy muy rápido! 🏃',
                    '¡Woof woof! 🐾', '¡Voy! ✨'];
  const catchMsg = '¡Te atrapé! 🐾';
  let msgIdx = 0;

  function showBubble(text, ms = 2600) {
    bubbleTxt.textContent = text;
    bubble.classList.remove('hidden');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), ms);
  }

  function setState(s) {
    if (state === s) return;
    state = s;
    dog.classList.remove('running', 'chasing', 'sitting');
    dog.classList.add(s);
  }

  // Posiciona la burbuja centrada sobre el perro (en coords del viewport)
  function updateBubblePos() {
    const bW   = bubble.offsetWidth || 120;
    const cx   = dogX + DOG_W / 2;
    const left = Math.max(8, Math.min(window.innerWidth - bW - 8, cx - bW / 2));
    bubble.style.left   = left + 'px';
    bubble.style.bottom = '94px';
  }

  // ── Eventos ──────────────────────────────
  document.addEventListener('mousemove', e => { cursorX = e.clientX; });

  dog.addEventListener('click', () => showBubble(sitMsgs[msgIdx++ % sitMsgs.length]));

  // Ladra espontáneamente mientras corre
  setInterval(() => {
    if (state === 'running') {
      showBubble(runMsgs[Math.floor(Math.random() * runMsgs.length)], 2000);
    }
  }, 10000 + Math.random() * 5000);

  // ════════════════════════════════════════
  //  Loop principal
  // ════════════════════════════════════════
  function tick() {
    requestAnimationFrame(tick);
    time += 0.016;

    const maxX      = window.innerWidth - DOG_W - MARGIN_R;
    const dogCenter = dogX + DOG_W / 2;
    const dist      = cursorX - dogCenter;
    const absDist   = Math.abs(dist);

    // ── Máquina de estados ─────────────────
    if (cursorX > 0 && absDist < CATCH_RANGE) {
      // Alcanzó el cursor → sentarse
      if (state !== 'sitting') { setState('sitting'); showBubble(catchMsg, 2800); }
      dogVX = 0;

    } else if (cursorX > 0 && absDist < CHASE_RANGE) {
      // Perseguir cursor
      setState('chasing');
      const dir = dist > 0 ? 1 : -1;
      facingRight = dir > 0;
      dogVX = dir * 4.4;
      dogX  = Math.max(MARGIN_L, Math.min(maxX, dogX + dogVX));

    } else {
      // Movimiento autónomo (rebote en los bordes)
      setState('running');
      if (dogVX === 0) dogVX = facingRight ? 2.2 : -2.2;
      dogX += dogVX;
      if (dogX <= MARGIN_L)  { dogX = MARGIN_L; dogVX =  2.2; facingRight = true;  }
      else if (dogX >= maxX) { dogX = maxX;      dogVX = -2.2; facingRight = false; }
    }

    // ── Cola: animación vía atributo SVG (sin transform-origin issues) ──
    let tailAmp   = state === 'sitting' ? 30 : 20;
    let tailSpeed = state === 'sitting' ? 7  : state === 'chasing' ? 4.5 : 2.5;
    const tailAngle = Math.sin(time * tailSpeed) * tailAmp;
    tailEl.setAttribute('transform', `rotate(${tailAngle})`);

    // ── Posición y flip ────────────────────
    dog.style.left      = dogX + 'px';
    dog.style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';

    updateBubblePos();
  }

  // ── Arranque ──────────────────────────────
  setState('running');
  requestAnimationFrame(tick);
  setTimeout(() => showBubble('¡Woof! 🐾', 2500), 3200);

})();
