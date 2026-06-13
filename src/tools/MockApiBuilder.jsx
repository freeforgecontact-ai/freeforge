import React, { useState, useMemo } from 'react';

/**
 * MockApiBuilder — concepteur d'API mock 100 % local. Définis des routes
 * (méthode, chemin, statut, corps JSON) puis génère et télécharge un Service
 * Worker qui intercepte ces routes et renvoie les réponses mock. Aucun réseau.
 */

const LS_KEY = 'mockapi_routes_v1';
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const DEFAULT_ROUTES = [
  { id: uid(), method: 'GET', path: '/api/users', status: 200, body: '[{ "id": 1, "name": "Jane" }]' },
  { id: uid(), method: 'POST', path: '/api/login', status: 201, body: '{ "token": "mock-123" }' },
];

function generateSW(routes) {
  const valid = routes.map((r) => {
    let parsed = null;
    try { parsed = JSON.parse(r.body || 'null'); } catch (e) { parsed = r.body; }
    return { method: r.method, path: r.path, status: Number(r.status) || 200, body: parsed };
  });
  const table = JSON.stringify(valid, null, 2);
  return `// Service Worker mock généré par FreeForge — MockApiBuilder.
// Installation : place ce fichier à la racine de ton site, puis enregistre-le :
//   navigator.serviceWorker.register('/mock-sw.js');
// Recharge ensuite la page pour activer l'interception.

const MOCK_ROUTES = ${table};

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const route = MOCK_ROUTES.find(
    (r) => r.method === req.method && r.path === url.pathname
  );
  if (!route) return; // laisse passer les requêtes non mockées

  const payload = typeof route.body === 'string'
    ? route.body
    : JSON.stringify(route.body);

  event.respondWith(
    new Response(payload, {
      status: route.status,
      headers: {
        'Content-Type': 'application/json',
        'X-Mocked-By': 'FreeForge-MockApiBuilder'
      }
    })
  );
});
`;
}

export default function MockApiBuilder({ goBack }) {
  const [routes, setRoutes] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); if (Array.isArray(d) && d.length) return d; }
    } catch (e) { /* ignore */ }
    return DEFAULT_ROUTES;
  });
  const [copied, setCopied] = useState(false);

  const persist = (next) => {
    setRoutes(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  };
  const update = (id, field, value) => persist(routes.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRoute = () => persist([...routes, { id: uid(), method: 'GET', path: '/api/nouveau', status: 200, body: '{}' }]);
  const removeRoute = (id) => persist(routes.filter((r) => r.id !== id));

  const jsonErrors = useMemo(() => {
    const e = {};
    routes.forEach((r) => { try { JSON.parse(r.body || 'null'); } catch (err) { e[r.id] = err.message; } });
    return e;
  }, [routes]);

  const code = useMemo(() => generateSW(routes), [routes]);

  const copy = () => { try { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { /* ignore */ } };
  const download = () => {
    try {
      const blob = new Blob([code], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'mock-sw.js'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="mock-wrap">
      <style>{`
        .mock-wrap{color:#eaf2fb;max-width:980px;margin:0 auto}
        .mock-wrap h1{font-size:1.6rem;margin:0 0 4px}
        .mock-sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .mock-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .mock-route{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;margin-bottom:12px}
        .mock-top{display:grid;grid-template-columns:110px 1fr 90px auto;gap:8px;align-items:center}
        .mock-top select,.mock-top input{box-sizing:border-box;padding:9px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.96);color:#10243a;font-size:.88rem;width:100%}
        .mock-del{background:rgba(255,90,90,.18);border:1px solid rgba(255,90,90,.5);color:#ff9d9d;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:.85rem}
        .mock-blbl{display:block;font-size:.74rem;color:#9fb6cf;margin:10px 0 4px;font-weight:600}
        .mock-body{width:100%;box-sizing:border-box;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.82rem;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.96);color:#10243a;padding:9px;resize:vertical;min-height:60px}
        .mock-body.bad{border-color:#ff5a5a;background:#fff0f0}
        .mock-jerr{color:#ff9d9d;font-size:.76rem;margin-top:4px}
        .mock-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .mock-btn.ghost{background:rgba(91,157,255,.2);color:#cfe2ff;border:1px solid rgba(91,157,255,.45)}
        .mock-row{display:flex;gap:10px;flex-wrap:wrap}
        .mock-code{background:#071a2e;border:1px solid rgba(91,157,255,.35);border-radius:10px;padding:12px;font-family:ui-monospace,monospace;font-size:.78rem;white-space:pre;overflow:auto;color:#bfe0ff;margin:0;max-height:340px;line-height:1.5}
        .mock-note{font-size:.82rem;color:#9fb6cf;margin-bottom:10px}
        .mock-note b{color:#ffae3b}
        @media(max-width:760px){.mock-top{grid-template-columns:1fr 1fr}.mock-top input,.mock-top select{font-size:.82rem}}
      `}</style>

      <h1>🧪 Concepteur d'API mock</h1>
      <p className="mock-sub">Définis tes routes, puis génère un Service Worker qui les simule. Tout se passe dans ton navigateur — aucun serveur.</p>

      <div className="mock-pane">
        {routes.map((r) => (
          <div key={r.id} className="mock-route">
            <div className="mock-top">
              <select value={r.method} onChange={(e) => update(r.id, 'method', e.target.value)}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input value={r.path} onChange={(e) => update(r.id, 'path', e.target.value)} placeholder="/api/chemin" />
              <input type="number" value={r.status} onChange={(e) => update(r.id, 'status', e.target.value)} placeholder="200" />
              <button className="mock-del" onClick={() => removeRoute(r.id)} title="Supprimer">✕</button>
            </div>
            <label className="mock-blbl">Corps JSON de la réponse</label>
            <textarea
              className={`mock-body ${jsonErrors[r.id] ? 'bad' : ''}`}
              value={r.body}
              onChange={(e) => update(r.id, 'body', e.target.value)}
              spellCheck={false}
            />
            {jsonErrors[r.id] && <div className="mock-jerr">⚠ JSON invalide : {jsonErrors[r.id]}</div>}
          </div>
        ))}
        <button className="mock-btn ghost" onClick={addRoute}>＋ Ajouter une route</button>
      </div>

      <div className="mock-pane">
        <div className="mock-note">
          <b>Aperçu du Service Worker</b> — enregistre-le côté client avec <code>navigator.serviceWorker.register('/mock-sw.js')</code>.
        </div>
        <pre className="mock-code">{code}</pre>
        <div className="mock-row" style={{ marginTop: 12 }}>
          <button className="mock-btn" onClick={download}>⬇ Télécharger mock-sw.js</button>
          <button className="mock-btn ghost" onClick={copy}>{copied ? '✓ Copié' : '📋 Copier le code'}</button>
        </div>
      </div>
    </div>
  );
}
