(function () {
  var VIDEO = 'https://api.admira.store/stock/asset/1790609061411-86drpb';
  var AUDIO = 'https://api.admira.store/stock/asset/1790608402098-xubtdh';
  var OS = ['Windows', 'Linux', 'macOS', 'Android', 'iOS'];
  var PIEZAS = {
    menu: ['Menú del día', 'Café y bollería'],
    promo: ['Tu pausa', 'La segunda bebida invita'],
    video: ['Tu pausa', 'Pieza de Stock en la cartelera'],
    taza: ['Tu taza', 'Pide en la barra'],
    vitrina: ['Vitrina', 'Bollería del día'],
    cartel: ['Cartel de sala', 'Tu rincón, tu lugar'],
    entra: ['Bienvenida', 'Hay mesa libre']
  };
  var state = {
    paso: 1,
    os: '',
    probados: [],
    players: [],
    player: null,
    tier: 'good',
    pieza: 'menu',
    visitas: 0,
    objeto: '',
    registro: []
  };
  var $ = function (id) { return document.getElementById(id); };
  var video = $('video');
  var audio = $('audio');
  video.src = VIDEO;
  audio.src = AUDIO;

  function madrid(d) {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'medium'
    }).format(d || new Date());
  }

  function horaEn(zona) {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(new Date());
  }

  function anotar(que) {
    state.registro.unshift(madrid() + ' · ' + que);
    $('registro').innerHTML = state.registro.slice(0, 8).map(function (r) {
      return '<li>' + r.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</li>';
    }).join('');
  }

  function pintarAlta() {
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.hidden = Number(p.getAttribute('data-panel')) !== state.paso;
    });
    document.querySelectorAll('#steps li').forEach(function (li) {
      li.classList.toggle('on', Number(li.getAttribute('data-step')) === state.paso);
    });
    $('atras').disabled = state.paso === 1;
    $('seguir').hidden = state.paso === 4;
    $('abrir').hidden = state.paso !== 4;
    $('so').value = state.os || 'macOS';
  }

  function elegirOs(nombre) {
    state.os = nombre;
    if (state.probados.indexOf(nombre) < 0) state.probados.push(nombre);
    document.querySelectorAll('#sistemas button').forEach(function (b) {
      b.classList.toggle('on', state.probados.indexOf(b.getAttribute('data-os')) >= 0);
    });
    $('os-estado').textContent = 'Listo en ' + nombre + '. Probados: ' + state.probados.join(', ') + '.';
  }

  function reloj() {
    var zona = /m[eé]xico/i.test($('ubicacion').value) ? 'America/Mexico_City' : 'Europe/Madrid';
    var ahora = horaEn(zona);
    var dentro = ahora >= $('arranque').value;
    $('reloj').textContent = $('ubicacion').value + ' · ' + ahora + ' · ' + (dentro ? 'en horario' : 'programado, aún no arranca');
  }

  function aplicarPlayer(row) {
    state.player = row;
    if (row.so) state.os = row.so;
    $('tipo').value = row.tipo || $('tipo').value;
    $('resolucion').value = row.resolucion || $('resolucion').value;
    $('formato').value = row.formato || $('formato').value;
    $('reproduccion').value = row.reproduccion || $('reproduccion').value;
    $('ubicacion').value = row.ubicacion || $('ubicacion').value;
    $('idioma').value = row.idioma || 'es';
    $('arranque').value = row.arranque || $('arranque').value;
    $('so').value = state.os;
  }

  function pintarTabla(rows) {
    var body = $('excel-tabla').querySelector('tbody');
    body.innerHTML = rows.map(function (r) {
      return '<tr><td>' + r.nombre + '</td><td>' + r.tipo + '</td><td>' + r.so + '</td><td>' + r.formato + '</td><td>' + r.arranque + '</td><td>' + (r.marca || '') + '</td></tr>';
    }).join('');
    $('excel-tabla').hidden = rows.length === 0;
  }

  async function leerXlsx(buf) {
    var files = await unzip(buf);
    var xml = files['xl/worksheets/sheet1.xml'] || '';
    var rows = [];
    xml.replace(/<row\b[\s\S]*?<\/row>/g, function (row) {
      var cells = [];
      row.replace(/<c\b[\s\S]*?<\/c>/g, function (cell) {
        var m = cell.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        cells.push(m ? m[1] : '');
      });
      if (cells.length) rows.push(cells);
    });
    var head = rows[0] || [];
    return rows.slice(1).filter(function (r) { return r[0]; }).map(function (r) {
      var o = {};
      head.forEach(function (key, i) { o[key] = r[i] || ''; });
      return o;
    });
  }

  async function unzip(buf) {
    var view = new DataView(buf);
    var files = {};
    var o = 0;
    var dec = new TextDecoder();
    while (o + 30 < buf.byteLength && view.getUint32(o, true) === 0x04034b50) {
      var method = view.getUint16(o + 8, true);
      var size = view.getUint32(o + 18, true);
      var nameLen = view.getUint16(o + 26, true);
      var extra = view.getUint16(o + 28, true);
      var name = dec.decode(new Uint8Array(buf, o + 30, nameLen));
      var start = o + 30 + nameLen + extra;
      var comp = new Uint8Array(buf, start, size);
      var raw = comp;
      if (method === 8) {
        var stream = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        raw = new Uint8Array(await new Response(stream).arrayBuffer());
      }
      files[name] = dec.decode(raw);
      o = start + size;
    }
    return files;
  }

  function fichaActual() {
    return state.player || {
      nombre: 'Pizarra de barra',
      tipo: $('tipo').value,
      so: state.os || $('so').value,
      resolucion: $('resolucion').value,
      formato: $('formato').value,
      reproduccion: $('reproduccion').value,
      ubicacion: $('ubicacion').value,
      idioma: $('idioma').value,
      arranque: $('arranque').value,
      marca: 'EJEMPLO'
    };
  }

  function pintarEscena() {
    var f = fichaActual();
    var pieza = PIEZAS[state.pieza] || PIEZAS.menu;
    document.body.dataset.tier = state.tier;
    document.body.dataset.video = (state.tier === 'best' || state.pieza === 'video') ? 'on' : 'off';
    document.body.dataset.gente = state.visitas > 0 ? 'on' : 'off';
    $('player-nombre').textContent = f.nombre;
    $('player-ficha').textContent = [f.tipo, f.so, f.resolucion, f.formato, f.reproduccion, f.ubicacion, f.idioma, 'desde ' + f.arranque, f.marca || 'EJEMPLO'].join(' · ');
    $('cartel-titulo').textContent = pieza[0];
    $('cartel-detalle').textContent = pieza[1];
    $('modo-hud').textContent = state.tier === 'good' ? 'Good' : state.tier === 'better' ? 'Better' : 'Best';
    $('gente-hud').textContent = state.visitas ? state.visitas + ' personas en sala' : 'Sala en calma';
    $('visitas').textContent = state.visitas + ' en sala';
    document.querySelectorAll('#modos button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tier') === state.tier);
    });
    document.querySelectorAll('#cartelera button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-pieza') === state.pieza);
    });
    document.querySelectorAll('.hot').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-objeto') === state.objeto);
    });
    if (document.body.dataset.video === 'on') video.play().catch(function () {});
    else video.pause();
  }

  function abrir() {
    $('alta').hidden = true;
    $('split').hidden = false;
    document.body.dataset.view = 'split';
    pintarEscena();
    anotar('Alta abierta · ' + fichaActual().nombre + ' · ' + (state.os || fichaActual().so));
  }

  $('sistemas').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (b) elegirOs(b.getAttribute('data-os'));
  });
  $('seguir').onclick = function () {
    if (state.paso === 1 && !state.os) elegirOs('macOS');
    state.paso = Math.min(4, state.paso + 1);
    pintarAlta();
    if (state.paso === 3) reloj();
  };
  $('atras').onclick = function () {
    state.paso = Math.max(1, state.paso - 1);
    pintarAlta();
  };
  $('ubicacion').addEventListener('input', reloj);
  $('arranque').addEventListener('input', reloj);
  $('excel').addEventListener('change', function () {
    var file = $('excel').files[0];
    if (!file) return;
    file.arrayBuffer().then(leerXlsx).then(function (rows) {
      state.players = rows;
      if (rows[0]) aplicarPlayer(rows[0]);
      pintarTabla(rows);
      $('excel-estado').textContent = rows.length + ' reproductores importados. La primera fila queda como reproductor de la sala.';
    }).catch(function () {
      $('excel-estado').textContent = 'No pude leer ese Excel.';
    });
  });
  $('abrir').onclick = abrir;
  $('volver').onclick = function () {
    $('split').hidden = true;
    $('alta').hidden = false;
    document.body.dataset.view = 'alta';
    pintarAlta();
  };
  $('modos').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    state.tier = b.getAttribute('data-tier');
    pintarEscena();
    anotar('Modo ' + $('modo-hud').textContent);
  });
  $('cartelera').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    state.pieza = b.getAttribute('data-pieza');
    state.objeto = '';
    document.querySelectorAll('#cartelera button').forEach(function (x) { x.classList.toggle('on', x === b); });
    pintarEscena();
    anotar('Cartelera · ' + $('cartel-titulo').textContent);
  });
  $('hilo').onclick = function () {
    audio.play().then(function () {
      anotar('Hilo Tu pausa · 1790608402098-xubtdh');
    }).catch(function () {
      anotar('El hilo no arrancó en este navegador');
    });
  };
  $('locucion').onclick = function () {
    state.pieza = 'cartel';
    state.objeto = 'cartel';
    pintarEscena();
    anotar('Locución de sala · texto de ejemplo, sin audio nuevo');
  };
  $('entra').onclick = function () {
    state.visitas += 1;
    state.pieza = 'entra';
    state.objeto = '';
    pintarEscena();
    anotar('Entra gente · visita ' + state.visitas + ' · cartelera de bienvenida');
  };
  document.body.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-objeto]');
    if (!b || b.closest('#objetos') && false) return;
    if (!b.closest('#objetos') && !b.classList.contains('hot')) return;
    state.objeto = b.getAttribute('data-objeto');
    state.pieza = state.objeto;
    pintarEscena();
    anotar('Objeto · ' + state.objeto);
  });

  OS.forEach(function (nombre) {
    if (!document.querySelector('#sistemas [data-os="' + nombre + '"]')) return;
  });

  if (new URLSearchParams(location.search).get('split') === '1') {
    state.os = 'macOS';
    state.probados = OS.slice();
    abrir();
  } else {
    pintarAlta();
  }
  $('brand').onclick = function () {
    var on = document.body.dataset.brand !== 'alsea';
    document.body.dataset.brand = on ? 'alsea' : 'xpace';
    $('brand').setAttribute('aria-pressed', String(on));
    $('brand').textContent = on ? 'Metaestilo Alsea' : 'Estilo XpaceOS';
    anotar(on ? 'Metaestilo Alsea' : 'Estilo XpaceOS');
  };
})();
