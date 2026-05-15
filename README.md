# Camilo Calderón — Portfolio

Sitio web personal. Sin frameworks, sin dependencias. HTML + CSS + JS puro.

---

## Estructura del proyecto

```
portfolio/
│
├── index.html              ← Estructura y contenido (solo HTML)
│
├── css/
│   ├── base.css            ← Variables, reset, botones, tipografía
│   ├── layout.css          ← Nav, hero, grids de secciones, responsive
│   ├── components.css      ← Skill cards, project cards
│   └── animations.css      ← Cursor, reveal al scroll, barras
│
├── js/
│   ├── cursor.js           ← Cursor personalizado con efecto magnético
│   ├── nav.js              ← Navbar compacta al scroll + menú mobile
│   ├── ticker.js           ← Banda de tecnologías animada
│   ├── animations.js       ← Reveal al scroll, contadores, barras
│   └── typed.js            ← Efecto de escritura en el hero
│
└── assets/
    ├── foto.jpg            ← Tu foto (reemplazar)
    └── cv-camilo-calderon.pdf  ← Tu CV (reemplazar)
```

---

## Abrir en VS Code (Windows)

1. **Desbloquear el ZIP antes de descomprimir:**
   - Click derecho en `portfolio.zip` → Propiedades
   - Marca la casilla **Desbloquear** → Aplicar → Aceptar
   - Ahora click derecho → **Extraer todo...**

2. **Abrir en VS Code:**
   - Abre VS Code
   - `Archivo` → `Abrir carpeta...` → selecciona la carpeta `portfolio`

3. **Ver en vivo con Live Server:**
   - Instala la extensión **Live Server** (`Ctrl+Shift+X` → busca "Live Server")
   - Click derecho en `index.html` → **Open with Live Server**
   - El navegador se recarga automático al guardar cualquier archivo

---

## Qué modificar y dónde

### Datos personales → `index.html`
Busca con `Ctrl+H` (buscar y reemplazar):

| Busca                              | Reemplaza con             |
|------------------------------------|---------------------------|
| `camilo@email.com`                 | Tu email real             |
| `https://github.com/camilocalderon`| Tu URL de GitHub          |
| `https://linkedin.com/in/camilocalderon` | Tu URL de LinkedIn  |
| `[Empresa / Institución]`          | Nombre de tu empresa      |
| `[Universidad · Bogotá, Colombia]` | Tu universidad real       |

### Tu foto
- Coloca tu foto en `assets/foto.jpg`
- En `index.html` busca el comentario `REEMPLAZA ESTO CON TU FOTO`
- Descomenta la línea `<img src="assets/foto.jpg" alt="Camilo Calderón">`
- Borra el `<div class="about-photo-placeholder">...</div>`

### Estadísticas del hero
Busca en `index.html`:
```html
<div class="hstat-n" data-count="3">0</div>   ← años
<div class="hstat-n" data-count="6">0</div>   ← proyectos
<div class="hstat-n" data-count="10">0</div>  ← tecnologías
```
Cambia los números en `data-count`.

### Proyectos
Cada proyecto en `index.html` está comentado así:
```html
<!-- ── PROYECTO 1: DATA PIPELINE ── -->
```
Edita el título, descripción, stack y los links de GitHub/Demo.

### Roles del efecto typed
Abre `js/typed.js` y edita el array `ROLES`:
```js
const ROLES = [
  'Full Stack Developer.',
  'Data Analyst.',
  // agrega o quita los que quieras
];
```

### Tecnologías del ticker
Abre `js/ticker.js` y edita el array `TICKER_ITEMS`:
```js
const TICKER_ITEMS = [
  'React', 'Django', 'Python',
  // agrega o quita tecnologías
];
```

### Barras de habilidad
En `index.html`, en la sección `#skills`, cada barra tiene:
```html
<div class="bar-fill" style="width:88%"></div>
<span class="bar-pct">88%</span>
```
Cambia el porcentaje en `width` y en el `span`. Deben coincidir.

### Colores (paleta completa)
Abre `css/base.css` y edita las variables en `:root`:
```css
--amber:   #e8a230;   /* acento principal */
--amber2:  #c4821a;   /* acento secundario */
--bg:      #141210;   /* fondo principal */
```

---

## Deploy gratuito

### Netlify (más fácil — drag & drop)
1. Ve a [netlify.com](https://netlify.com) y crea cuenta gratis
2. En el dashboard arrastra la carpeta `portfolio/` completa
3. Listo. URL automática tipo `random-name.netlify.app`
4. En Site Settings puedes cambiar el nombre del subdominio

### GitHub Pages
```bash
git init
git add .
git commit -m "init: portfolio v1"
git remote add origin https://github.com/TU_USUARIO/portfolio.git
git push -u origin main
```
En GitHub: Settings → Pages → Source: `main` → Save
URL: `https://tu-usuario.github.io/portfolio`

### Dominio personalizado recomendado
`camilocalderon.dev` — disponible en Namecheap ~$10/año

---

## Checklist antes de publicar

- [ ] Foto real en `assets/foto.jpg`
- [ ] CV actualizado en `assets/cv-camilo-calderon.pdf`
- [ ] Email real en `index.html` y sección contacto
- [ ] GitHub y LinkedIn con URLs reales
- [ ] Universidad y empresa rellenados
- [ ] Proyectos apuntando a repos reales
- [ ] Links "Demo →" funcionando o eliminados
- [ ] Números del hero ajustados
- [ ] Meta description actualizada (línea ~8 del `<head>`)
