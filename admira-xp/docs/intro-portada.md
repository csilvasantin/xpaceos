# Intro en vídeo de la portada · Homepage video intro

Estado: publicado en xpaceos.com el 17-oct-2026 (sello `v.17.10.2026.r1`); versión en inglés el mismo día (sello `v.17.10.2026.r2.18:17`). Autor: NeoMacStudio · MacStudio.

## Español

Al entrar en la portada de xpaceos.com sale a pantalla completa el vídeo «Todo en orden» (15 segundos, sin sonido): dos minutos antes de abrir fallan pantallas, música, aroma y wifi; pasa XpaceOS y todo queda en verde; cierra con el logo y la frase de la portada.

- **Idioma:** sale en el idioma de la portada (`XpaceLang`: `?lang=`, después la preferencia guardada, y si no, español). En inglés es el mismo vídeo con el texto traducido y los mismos tiempos («All in order»); el cierre usa la frase de la portada en inglés (`hero.title`): «Save money by supervising the space's IoT.»
- **Cuándo sale:** la primera vez en cada sesión del navegador (`sessionStorage`, clave `xpaceos_intro_a`, la misma para los dos idiomas).
- **Cuándo no sale:** con «reducir movimiento» en el sistema, en un idioma sin vídeo o con `?intro=0`.
- **Forzarla:** `https://www.xpaceos.com/?intro=1` (español) o `https://www.xpaceos.com/?lang=en&intro=1` (inglés), para enseñarla aunque ya se haya visto.
- **Cerrar:** botón «Saltar intro ✕», tecla Esc, o sola al terminar. Si el vídeo no arranca en 4 segundos (red lenta, reproducción automática bloqueada), se quita sola.
- **Ficheros:** `assets/intro-portada.js` (lógica y estilo) y los vídeos de `assets/video/`:
  - español: `intro-xpaceos-a-1080.mp4` (1920 × 1080, 7,97 MB) e `intro-xpaceos-a-720.mp4` (1280 × 720, 5,16 MB);
  - inglés: `intro-xpaceos-a-en-1080.mp4` (1920 × 1080, 7,76 MB) e `intro-xpaceos-a-en-720.mp4` (1280 × 720, 5,06 MB).
  - Desde 1600 píxeles reales de ancho se sirve la de 1080p.
- **Pruebas:** `tests/intro-portada.test.mjs`.
- **Cómo se hizo el vídeo:** maqueta animada en HTML, capturada fotograma a fotograma con Chrome sin ventana (30 fps) y codificada en H.264 con AVFoundation en el Mac Studio. La versión en inglés sale de la misma maqueta con `?lang=en`. No cambia el uso del producto: la ayuda, el tutorial y el MCP no cambian.
- **Pendiente:** música (por decidir); llevarla a admira.studio si gusta.

## English

The xpaceos.com homepage opens with the full-screen video «All in order» («Todo en orden», 15 seconds, no sound): two minutes before opening, screens, music, scent and wifi fail; XpaceOS sweeps through and everything turns green; it ends with the logo and the homepage claim.

- **Language:** the video follows the homepage language (`XpaceLang`: `?lang=`, then the stored preference, else Spanish). The English cut is the same animation with translated copy and identical timing; the end card uses the English homepage claim (`hero.title`): «Save money by supervising the space's IoT.»
- **When it plays:** once per browser session (`sessionStorage`, key `xpaceos_intro_a`, shared by both languages).
- **When it does not:** with reduced motion enabled, in a language without a video, or with `?intro=0`.
- **Force it:** `https://www.xpaceos.com/?intro=1` (Spanish) or `https://www.xpaceos.com/?lang=en&intro=1` (English).
- **Close:** «Skip intro ✕» button, Esc key, or automatically at the end. If the video has not started after 4 seconds, it removes itself.
- **Files:** `assets/intro-portada.js` and, in `assets/video/`, `intro-xpaceos-a-1080.mp4` / `intro-xpaceos-a-720.mp4` (Spanish) and `intro-xpaceos-a-en-1080.mp4` / `intro-xpaceos-a-en-720.mp4` (English), 1920 × 1080 and 1280 × 720. The 1080p file is served from 1600 physical pixels wide.
- **Tests:** `tests/intro-portada.test.mjs`.
- Product usage does not change: help, tutorial and MCP are unchanged.
- **Pending:** music (to be decided); port to admira.studio if approved.
