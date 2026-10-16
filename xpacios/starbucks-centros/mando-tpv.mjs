// El mando del TPV del local (Carlos, 16-oct-2026: «haz lo mismo en xpaceos»). Los mismos controles que el mando
// del gemelo de Paseo de Gràcia (Anterior, Escuchar, Siguiente, Lanzar pista) y el mismo foco. La playlist del
// local se edita en admira.store, donde está /admira-xp/api/context-playlist y la sesión de Admira: xpaceos.com es
// estático, así que aquí el mando enlaza el mismo visor en admira.store.
// Foco (Carlos, 16-oct-2026: «pon un botón que sea foco y ponga el tpv centrado en el fondo en primer plano, como
// hacemos con el kiosko… un botón pequeño a la izquierda de Hilo musical · con el nombre del centro»): ◎ lleva la
// vista al TPV y aparta el mando a un lado para verlo; otra vez, vuelve donde estaba.
export const EDITOR = 'https://www.admira.store';

export function enlaceEdicion(loc = globalThis.location) {
  try { return EDITOR + loc.pathname + loc.search; } catch { return EDITOR + '/xpacios/starbucks-centros/'; }
}

export function crearMandoTPV({ doc = document, musica, win = globalThis, alEnfocar = null } = {}) {
  let modal = null, titulo = null, foco = null, enFoco = false, partes = null;
  const hacer = (tag, cls, texto) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (texto) e.textContent = texto; return e; };
  function ponerFoco(on) {
    enFoco = !!on && !!alEnfocar;
    if (modal) modal.classList.toggle('sc-mando--foco', enFoco);
    if (foco) { foco.setAttribute('aria-pressed', String(enFoco)); foco.title = enFoco ? 'Volver a la vista de antes' : 'Foco: el TPV en el centro, de cerca'; }
  }
  function pintar(e = musica.state()) {
    if (!partes) return;
    const pistas = musica.getTracks(), suena = e.started && !e.muted && !e.suppressed;
    partes.actual.textContent = e.title || 'Esperando playlist';
    partes.escuchar.textContent = suena ? 'Silenciar' : 'Escuchar'; partes.escuchar.setAttribute('aria-pressed', String(suena));
    const s = Math.max(0, Math.floor(e.position || 0));
    partes.estado.textContent = (suena ? 'Sonando en el gemelo' : 'Pulsa Escuchar para reanudar') + ' · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' (tiempo web)';
    const firma = JSON.stringify(pistas.map(t => [t.url, t.title]));
    if (firma !== partes.firma) {
      partes.firma = firma;
      partes.lista.replaceChildren(...pistas.map((t, i) => { const o = hacer('option', '', (i + 1) + '. ' + t.title); o.value = t.url; return o; }));
    }
    if (e.url && pistas.some(t => t.url === e.url) && doc.activeElement !== partes.lista) partes.lista.value = e.url;
    for (const b of [partes.anterior, partes.escuchar, partes.siguiente, partes.lanzar, partes.lista]) b.disabled = !pistas.length;
    partes.editar.href = enlaceEdicion(win.location);
  }
  function montar() {
    if (modal) return;
    modal = doc.createElement('dialog'); modal.className = 'sc-mando'; modal.setAttribute('aria-label', 'Mando del hilo musical');
    modal.innerHTML = '<div class="sc-mando-caja"><header><button class="sc-mando-foco" type="button" aria-label="Foco: el TPV en el centro, de cerca" aria-pressed="false">◎</button><strong></strong><button class="sc-mando-x" type="button" aria-label="Cerrar">✕</button></header><div class="sc-mando-hueco"></div></div>';
    titulo = modal.querySelector('strong'); foco = modal.querySelector('.sc-mando-foco');
    foco.hidden = !alEnfocar;
    foco.addEventListener('click', () => { const on = !enFoco; ponerFoco(on); alEnfocar(on); });
    const det = hacer('details', 'music-remote'); det.open = true;
    const resumen = hacer('summary', '', 'PLEGAR MANDO INTERACTIVO');
    det.addEventListener('toggle', () => { resumen.textContent = det.open ? 'PLEGAR MANDO INTERACTIVO' : 'DESPLEGAR MANDO INTERACTIVO'; });
    const cuerpo = hacer('div', 'music-remote-body'), controles = hacer('div', 'music-remote-controls');
    partes = { actual: hacer('p'), estado: hacer('p'), anterior: hacer('button', '', 'Anterior'), escuchar: hacer('button', '', 'Escuchar'), siguiente: hacer('button', '', 'Siguiente'), lanzar: hacer('button', '', 'Lanzar pista'), lista: hacer('select'), editar: hacer('a', '', 'Editar en admira.store ↗'), firma: '' };
    for (const b of [partes.anterior, partes.escuchar, partes.siguiente, partes.lanzar]) b.type = 'button';
    partes.estado.setAttribute('role', 'status'); partes.lista.setAttribute('aria-label', 'Playlist del hilo musical');
    partes.editar.target = '_blank'; partes.editar.rel = 'noopener';
    const nota = hacer('p', 'sc-mando-editar', 'La playlist de este local se edita en admira.store, con sesión de Admira. ');
    nota.append(partes.editar);
    controles.append(partes.anterior, partes.escuchar, partes.siguiente);
    cuerpo.append(hacer('p', '', 'Controles del gemelo · reloj web'), partes.actual, controles, partes.lista, partes.lanzar, partes.estado, nota);
    det.append(resumen, cuerpo); modal.querySelector('.sc-mando-hueco').append(det);
    const jugar = f => { try { Promise.resolve(f()).catch(e => { partes.estado.textContent = e.message; }); } catch (e) { partes.estado.textContent = e.message; } };
    partes.anterior.addEventListener('click', () => jugar(() => { const p = musica.getTracks(), i = p.findIndex(t => t.url === musica.state().url); if (p.length) return musica.jump(p[(i + p.length - 1) % p.length].url); }));
    partes.siguiente.addEventListener('click', () => jugar(() => musica.next()));
    partes.escuchar.addEventListener('click', () => jugar(() => musica.toggle()));
    partes.lanzar.addEventListener('click', () => jugar(() => musica.jump(partes.lista.value)));
    modal.querySelector('.sc-mando-x').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
    modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
    doc.body.append(modal);
    musica.subscribe(pintar); win.setInterval(() => { if (modal.open) pintar(); }, 500);
  }
  function abrir(local = '') {
    montar();
    titulo.textContent = '♪ Hilo musical' + (local ? ' · ' + local : ''); ponerFoco(false); pintar();
    try { if (!modal.open) modal.showModal(); } catch { modal.setAttribute('open', ''); }
    return true;
  }
  // Al cerrar, la vista se queda donde esté (como el foco del quiosco).
  function cerrar() { if (!modal) return; ponerFoco(false); try { if (modal.open) modal.close(); } catch { modal.removeAttribute('open'); } }
  return { abrir, cerrar, get abierto() { return !!(modal && modal.open); }, get enFoco() { return enFoco; }, get nodo() { return modal; } };
}
