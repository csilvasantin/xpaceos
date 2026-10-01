// Perímetro de seguridad de los presites de XpaceOS y admira.store.
//
// Por qué (Carlos, 1-oct-2026, misión DCL-bdd079ab114d86b789f6ca65): los dos
// presites tienen que quedar tras un login de Google y solo puede entrar quien
// tenga permiso, gestionado desde AdmiraNeXT. Es server-side (Cloudflare Pages
// Functions): sin sesión, el HTML no sale del servidor. Un script en la página
// solo disimula, porque el contenido ya viajó al navegador.
//
// admira.store es un ESPEJO de xpaceos.com (sync-desde-xpaceos.sh copia todo
// menos CNAME y .github), así que este mismo fichero llega a las dos webs. Por
// eso la web se reconoce por el HOST y cada una pide su propia casilla en la
// lista de AdmiraNeXT (admira-whitelist /access?site=xpaceos|admira-store).
//
// Sin base de datos: la sesión es una cookie firmada (HMAC) de 24 h y el
// permiso se pregunta a la lista en cada visita, con 60 s de memoria por
// isolate. Quitar la casilla en AdmiraNeXT corta el acceso en un minuto.
//
// Base: el perímetro de pixeria.com (functions/_auth.js), que ya funciona.

const CLIENT_ID = '861856772040-e1ri6kpu6maagtb6crdfbb923hsaalgb.apps.googleusercontent.com';
// dominio propio: LaLiga bloquea workers.dev en horas de fútbol, FLT-1633
const ACCESS_URL = 'https://whitelist.admira.store/access';
const SESSION_COOKIE = '__Host-perimetro_session';
const NONCE_COOKIE = '__Host-perimetro_nonce';
const RETURN_COOKIE = '__Host-perimetro_return';
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const CHALLENGE_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_MS = 60 * 1000;
const OWNER_FALLBACK = new Set(['csilva@admira.com', 'csilvasantin@gmail.com']);
const encoder = new TextEncoder();

// Una entrada por web. `hosts` son los dominios públicos (el primero es el
// canónico); `pagesProject` permite probar en <proyecto>.pages.dev y en sus
// despliegues de vista previa antes de mover el DNS.
export const SITES = {
  xpaceos: {
    name:'XpaceOS', hosts:['www.xpaceos.com', 'xpaceos.com'], pagesProject:'xpaceos',
    accent:'#00e5ff', background:'#03080c'
  },
  'admira-store': {
    name:'admira.store', hosts:['www.admira.store', 'admira.store'], pagesProject:'admira-store',
    accent:'#ff6a3d', background:'#0c0604'
  }
};

// Rutas que usan OTROS sin login (Carlos, 1-oct-2026): el gemelo va incrustado
// en clearchannel.tv, admira.tv y los decks; los Xpacios y el MCP los abren
// players, decks y agentes. Cerrarlas rompería esos iframes y enlaces.
export const PUBLIC_PREFIXES = ['/admira-xp', '/xpacios', '/mcp'];

export function siteForHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  for (const [id, site] of Object.entries(SITES)) {
    if (site.hosts.includes(host)) return {id, ...site};
    const pages = `${site.pagesProject}.pages.dev`;
    if (host === pages || host.endsWith('.' + pages)) return {id, ...site};
  }
  return null;
}

export function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

// Documento = lo que sirve una página: raíz, carpeta, .html o ruta sin
// extensión. Los assets (.js, .css, .png, .glb, .json…) pasan sin perímetro:
// los necesitan las rutas públicas y no son páginas que se puedan leer.
export function isDocumentPath(pathname) {
  if (pathname.endsWith('/')) return true;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (!last.includes('.')) return true;
  return last.endsWith('.html') || last.endsWith('.htm');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64url(value) {
  const raw = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw + '='.repeat((4 - raw.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function sameValue(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function cookieJar(request) {
  const jar = {};
  (request.headers.get('Cookie') || '').split(/;\s*/).forEach((part) => {
    const separator = part.indexOf('=');
    if (separator > 0) jar[part.slice(0, separator)] = part.slice(separator + 1);
  });
  return jar;
}

function cookiesNamed(request, name) {
  return (request.headers.get('Cookie') || '').split(/;\s*/).flatMap((part) => {
    const separator = part.indexOf('=');
    return separator > 0 && part.slice(0, separator) === name ? [part.slice(separator + 1)] : [];
  });
}

function normalEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function safeReturnTo(value) {
  let candidate = String(value || '/');
  try { candidate = decodeURIComponent(candidate); } catch (_) { return '/'; }
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.length > 1024 || /[\\\u0000-\u001f\u007f]/.test(candidate)) return '/';
  if (candidate.startsWith('/auth/')) return '/';
  return candidate;
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

// Permiso por web en la lista de AdmiraNeXT. Memoria corta por isolate para no
// preguntar en cada asset; los owners entran aunque la lista no responda, para
// que un corte no deje a Carlos fuera de su propia web.
const ACCESS_CACHE = new Map();
export async function emailAllowed(env, siteId, email, fetchImpl = fetch, now = Date.now()) {
  const normalized = normalEmail(email);
  if (!normalized) return false;
  const key = siteId + '|' + normalized;
  const cached = ACCESS_CACHE.get(key);
  if (cached && cached.until > now) return cached.allowed;
  try {
    if (!env.WHITELIST_SITE_TOKEN) throw new Error('sin token de la lista');
    const query = `?site=${encodeURIComponent(siteId)}&email=${encodeURIComponent(normalized)}`;
    const response = await fetchImpl(ACCESS_URL + query, {
      headers:{Accept:'application/json', 'X-Whitelist-Token':env.WHITELIST_SITE_TOKEN}
    });
    if (!response.ok) throw new Error('lista no disponible');
    const payload = await response.json();
    const allowed = payload.ok === true && payload.allowed === true;
    ACCESS_CACHE.set(key, {allowed, until:now + ACCESS_TTL_MS});
    return allowed;
  } catch (_) {
    return OWNER_FALLBACK.has(normalized);
  }
}

export async function verifyGoogleCredential(credential, fetchImpl = fetch) {
  if (!credential || credential.length > 6000) return null;
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
    if (header.alg !== 'RS256' || !header.kid || !payload.sub) return null;
    const certificates = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs', {
      headers:{Accept:'application/json'},
      cf:{cacheTtl:21600, cacheEverything:true}
    });
    if (!certificates.ok) return null;
    const jwks = await certificates.json();
    const jwk = Array.isArray(jwks.keys) && jwks.keys.find((item) =>
      item.kid === header.kid && item.kty === 'RSA' && item.alg === 'RS256'
    );
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, decodeBase64url(parts[2]), encoder.encode(parts[0] + '.' + parts[1])
    );
    const email = normalEmail(payload.email);
    const now = Math.floor(Date.now() / 1000);
    const issuerValid = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    const googleAuthoritative = email.endsWith('@gmail.com') || (emailVerified && typeof payload.hd === 'string' && payload.hd.length > 0);
    if (!validSignature || payload.aud !== CLIENT_ID || !issuerValid || !emailVerified || !googleAuthoritative || Number(payload.exp) <= now) return null;
    return {email, sub:String(payload.sub), nonce:String(payload.nonce || '')};
  } catch (_) {
    return null;
  }
}

async function createSessionToken(env, site, identity) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(encoder.encode(JSON.stringify({
    v:1, aud:site.id, email:identity.email, sub:identity.sub, iat:now, exp:now + SESSION_TTL_SECONDS
  })));
  return `${payload}.${await hmac(env.PERIMETRO_SIGNING_KEY, `perimetro:${payload}`)}`;
}

export async function readSession(request, env, site, fetchImpl = fetch) {
  try {
    if (!env.PERIMETRO_SIGNING_KEY) return null;
    const token = cookieJar(request)[SESSION_COOKIE];
    if (!token || token.length > 4096) return null;
    const separator = token.lastIndexOf('.');
    if (separator < 1) return null;
    const payloadPart = token.slice(0, separator);
    if (!sameValue(token.slice(separator + 1), await hmac(env.PERIMETRO_SIGNING_KEY, `perimetro:${payloadPart}`))) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(payloadPart)));
    const now = Math.floor(Date.now() / 1000);
    // aud = la web: una sesión de xpaceos no abre admira.store aunque compartan clave.
    if (payload.v !== 1 || payload.aud !== site.id || Number(payload.exp) <= now || Number(payload.iat) > now + 60) return null;
    const email = normalEmail(payload.email);
    if (!email || !(await emailAllowed(env, site.id, email, fetchImpl))) return null;
    return {email};
  } catch (_) {
    return null;
  }
}

function loginCsrfValid(request, formToken) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== 'null' && origin !== 'https://accounts.google.com' && origin !== new URL(request.url).origin) return false;
  const officialCookies = cookiesNamed(request, 'g_csrf_token').filter((value) => value.length >= 32);
  const field = String(formToken || '');
  return !(officialCookies.length && (field.length < 32 || !officialCookies.some((value) => sameValue(value, field))));
}

function secureHeaders() {
  return {
    'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store',
    'x-robots-tag':'noindex, nofollow',
    'referrer-policy':'strict-origin-when-cross-origin',
    'content-security-policy':"default-src 'none'; script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; style-src 'unsafe-inline' https://accounts.google.com/gsi/style; img-src data: https://*.googleusercontent.com; connect-src https://accounts.google.com/gsi/; form-action 'self' https://accounts.google.com; frame-ancestors 'none'; base-uri 'none'"
  };
}

function loginPage(site, origin, nonce, error) {
  const accent = site.accent;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(site.name)} · Acceso</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 30%,#14202a,${site.background} 70%);color:#e9f1f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.box{width:100%;max-width:430px;padding:36px 30px;border:1px solid ${accent}55;border-radius:16px;background:#070c10e6;box-shadow:0 25px 80px #000b;text-align:center}.mark{color:${accent};font:700 12px ui-monospace,monospace;letter-spacing:.24em;text-transform:uppercase}h1{margin:16px 0 8px;font-size:26px}p{margin:0 0 24px;color:#9fb1bb;line-height:1.55}.picker{display:flex;justify-content:center;min-height:44px;max-width:100%;overflow:hidden}.error{margin-top:18px;color:#ff8f7a;font:600 13px ui-monospace,monospace;line-height:1.5}.foot{margin-top:24px;color:#5d707b;font:11px ui-monospace,monospace}@media (max-width:430px){body{padding:16px}.box{padding:28px 18px}}</style></head><body><main class="box"><div class="mark">${escapeHtml(site.name)} · perímetro de seguridad</div><h1>Acceso con Google</h1><p>Esta web es privada. Entra con tu cuenta de Google; si tienes permiso en AdmiraNeXT, la sesión dura 24 horas en este navegador.</p><div id="g_id_onload" data-client_id="${CLIENT_ID}" data-login_uri="${escapeHtml(origin)}/auth/callback" data-nonce="${escapeHtml(nonce)}" data-ux_mode="redirect" data-auto_prompt="false"></div><div class="picker"><div class="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="continue_with" data-size="large" data-ux_mode="redirect"></div></div>${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}<div class="foot">Permisos: AdmiraNeXT · admira.live/usuarios</div></main><script src="https://accounts.google.com/gsi/client" async defer></script></body></html>`;
}

function loginResponse(site, origin, returnTo, error = '', status = 401) {
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const response = new Response(loginPage(site, origin, nonce, error), {status, headers:secureHeaders()});
  // SameSite=None: Google vuelve con un POST desde accounts.google.com y una
  // cookie Lax no viajaría en esa petición entre sitios.
  response.headers.append('Set-Cookie', `${NONCE_COOKIE}=${nonce}; Path=/; Max-Age=${CHALLENGE_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`);
  response.headers.append('Set-Cookie', `${RETURN_COOKIE}=${encodeURIComponent(safeReturnTo(returnTo))}; Path=/; Max-Age=${CHALLENGE_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`);
  return response;
}

function redirect(location, extraCookies = []) {
  const response = new Response(null, {status:302, headers:{location, 'cache-control':'no-store', 'referrer-policy':'no-referrer'}});
  extraCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
  return response;
}

// Rutas /auth/* del perímetro. Devuelve null si la petición no es suya.
export async function handleAuth(request, env, site, fetchImpl = fetch) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/auth/')) return null;

  if (url.pathname === '/auth/login' && request.method === 'GET') {
    // Las cookies __Host- son del host exacto: el login vive en el canónico.
    if (site.hosts.includes(url.hostname) && url.hostname !== site.hosts[0]) {
      return redirect(`https://${site.hosts[0]}${url.pathname}${url.search}`);
    }
    const returnTo = safeReturnTo(url.searchParams.get('return_to') || '/');
    if (await readSession(request, env, site, fetchImpl)) return redirect(returnTo);
    return loginResponse(site, url.origin, returnTo);
  }

  if (url.pathname === '/auth/callback' && request.method === 'POST') {
    const jar = cookieJar(request);
    const clear = [
      `${NONCE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`,
      `${RETURN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`
    ];
    let form;
    try { form = await request.formData(); } catch (_) { form = new FormData(); }
    const identity = await verifyGoogleCredential(String(form.get('credential') || ''), fetchImpl);
    if (!identity || !loginCsrfValid(request, form.get('g_csrf_token')) || !sameValue(identity.nonce, jar[NONCE_COOKIE])) {
      const failed = loginResponse(site, url.origin, '/', 'No se pudo verificar el acceso. Vuelve a intentarlo.', 401);
      return failed;
    }
    if (!(await emailAllowed(env, site.id, identity.email, fetchImpl))) {
      return loginResponse(site, url.origin, '/', `${identity.email} no tiene permiso para ${site.name}. Pídelo a un superusuario de AdmiraNeXT.`, 403);
    }
    const returnTo = safeReturnTo(jar[RETURN_COOKIE] || '/');
    const token = await createSessionToken(env, site, identity);
    return redirect(returnTo, [
      `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
      ...clear,
      'g_csrf_token=; Path=/; Max-Age=0; Secure; SameSite=Lax'
    ]);
  }

  if (url.pathname === '/auth/session' && request.method === 'GET') {
    const session = await readSession(request, env, site, fetchImpl);
    return Response.json(session ? {ok:true, email:session.email, site:site.id} : {ok:false}, {
      status:session ? 200 : 401, headers:{'cache-control':'no-store'}
    });
  }

  if (url.pathname === '/auth/logout' && (request.method === 'GET' || request.method === 'POST')) {
    return new Response(null, {status:303, headers:{
      location:'/auth/login', 'cache-control':'no-store',
      'set-cookie':`${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
    }});
  }

  return new Response('Not found', {status:404, headers:{'cache-control':'no-store'}});
}

// Punto de entrada del middleware de Pages.
export async function perimetro(context, fetchImpl = fetch) {
  const {request, env} = context;
  const url = new URL(request.url);
  const site = siteForHost(url.hostname);
  // Un host que no es de ninguna web conocida no se sirve: así no hay alias
  // olvidado por el que colarse sin perímetro.
  if (!site) return new Response('Host no reconocido', {status:421, headers:{'cache-control':'no-store'}});

  const authResponse = await handleAuth(request, env, site, fetchImpl);
  if (authResponse) return authResponse;

  // Manda la RUTA, no lo que diga el cliente: con Accept:*/* un bot se llevaba
  // la página entera en Pixeria hasta el 1-sep-2026 (FLT-1484).
  const wantsDocument = isDocumentPath(url.pathname) ||
    request.headers.get('Sec-Fetch-Dest') === 'document' ||
    (request.headers.get('Accept') || '').includes('text/html');
  if (!wantsDocument || isPublicPath(url.pathname)) return context.next();
  if (await readSession(request, env, site, fetchImpl)) {
    const response = await context.next();
    const guarded = new Response(response.body, response);
    guarded.headers.set('cache-control', 'private, no-store');
    guarded.headers.set('x-robots-tag', 'noindex, nofollow');
    return guarded;
  }

  const returnTo = safeReturnTo(url.pathname + url.search);
  const loginHost = site.hosts.includes(url.hostname) ? site.hosts[0] : url.hostname;
  return redirect(`https://${loginHost}/auth/login?return_to=${encodeURIComponent(returnTo)}`, []);
}
