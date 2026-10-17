# Intro en vídeo de la portada · Homepage video intro

Estado: publicado en xpaceos.com el 17-oct-2026 (sello `v.17.10.2026.r1`). Autor: NeoMacStudio · MacStudio.

## Español

Al entrar en la portada de xpaceos.com sale a pantalla completa el vídeo «Todo en orden» (15 segundos, sin sonido): dos minutos antes de abrir fallan pantallas, música, aroma y wifi; pasa XpaceOS y todo queda en verde; cierra con el logo y la frase de la portada.

- **Cuándo sale:** la primera vez en cada sesión del navegador (`sessionStorage`, clave `xpaceos_intro_a`), con la portada en español.
- **Cuándo no sale:** con «reducir movimiento» en el sistema, con la portada en inglés (el vídeo está en español) o con `?intro=0`.
- **Forzarla:** `https://www.xpaceos.com/?intro=1` (para enseñarla aunque ya se haya visto).
- **Cerrar:** botón «Saltar intro ✕», tecla Esc, o sola al terminar. Si el vídeo no arranca en 4 segundos (red lenta, reproducción automática bloqueada), se quita sola.
- **Ficheros:** `assets/intro-portada.js` (lógica y estilo), `assets/video/intro-xpaceos-a-1080.mp4` (1920 × 1080, unos 8 MB) y `assets/video/intro-xpaceos-a-720.mp4` (1280 × 720, unos 5 MB). Desde 1600 píxeles reales de ancho se sirve la de 1080p.
- **Pruebas:** `tests/intro-portada.test.mjs`.
- **Cómo se hizo el vídeo:** maqueta animada en HTML, capturada fotograma a fotograma con Chrome sin ventana (30 fps) y codificada en H.264 con AVFoundation en el Mac Studio. No cambia el uso del producto: la ayuda, el tutorial y el MCP no cambian.
- **Pendiente:** versión en inglés; música (por decidir); llevarla a admira.studio si gusta.

## English

The xpaceos.com homepage opens with the full-screen video «Todo en orden» (15 seconds, no sound): two minutes before opening, screens, music, scent and wifi fail; XpaceOS sweeps through and everything turns green; it ends with the logo and the homepage claim.

- **When it plays:** once per browser session (`sessionStorage`, key `xpaceos_intro_a`), with the homepage in Spanish.
- **When it does not:** with reduced motion enabled, with the homepage in English (the video is in Spanish), or with `?intro=0`.
- **Force it:** `https://www.xpaceos.com/?intro=1`.
- **Close:** «Skip intro ✕» button, Esc key, or automatically at the end. If the video has not started after 4 seconds, it removes itself.
- **Files:** `assets/intro-portada.js`, `assets/video/intro-xpaceos-a-1080.mp4` (1920 × 1080) and `assets/video/intro-xpaceos-a-720.mp4` (1280 × 720). The 1080p file is served from 1600 physical pixels wide.
- **Tests:** `tests/intro-portada.test.mjs`.
- Product usage does not change: help, tutorial and MCP are unchanged.
- **Pending:** English version; music (to be decided); port to admira.studio if approved.
