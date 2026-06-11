import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function MockApiServer({ goBack }) {
  const [routes, setRoutes] = useState([
    { id: '1', method: 'GET', path: '/users', status: 200, body: '[\n  { \"id\": 1, \"name\": \"Alice\" },\n  { \"id\": 2, \"name\": \"Bob\" }\n]' },
    { id: '2', method: 'POST', path: '/login', status: 200, body: '{\n  \"status\": \"success\",\n  \"token\": \"mocked-jwt-token-xyz\"\n}' }
  ]);

  const [activeRouteId, setActiveRouteId] = useState('1');
  const [path, setPath] = useState('/users');
  const [method, setMethod] = useState('GET');
  const [status, setStatus] = useState(200);
  const [body, setBody] = useState('[\n  { \"id\": 1, \"name\": \"Alice\" },\n  { \"id\": 2, \"name\": \"Bob\" }\n]');

  const handleSelectRoute = (route) => {
    setActiveRouteId(route.id);
    setPath(route.path);
    setMethod(route.method);
    setStatus(route.status);
    setBody(route.body);
  };

  const handleSaveRoute = () => {
    try {
      // Validate JSON body format
      JSON.parse(body);
      
      setRoutes(prev => prev.map(r => {
        if (r.id === activeRouteId) {
          return { ...r, method, path, status, body };
        }
        return r;
      }));
      alert('Route sauvegardée avec succès !');
    } catch (e) {
      alert('Format de corps JSON invalide : ' + e.message);
    }
  };

  const handleAddRoute = () => {
    const newId = Date.now().toString();
    const newRoute = {
      id: newId,
      method: 'GET',
      path: '/new-route',
      status: 200,
      body: '{\n  "message": "Nouvelle route mockée"\n}'
    };
    setRoutes(prev => [...prev, newRoute]);
    handleSelectRoute(newRoute);
  };

  const handleDeleteRoute = (id) => {
    if (routes.length <= 1) {
      alert("Vous devez conserver au moins une route.");
      return;
    }
    const filtered = routes.filter(r => r.id !== id);
    setRoutes(filtered);
    handleSelectRoute(filtered[0]);
  };

  const generateServiceWorker = () => {
    let routesMapping = routes.map(r => {
      return `  {
    method: '${r.method}',
    path: '${r.path}',
    status: ${r.status},
    body: ${r.body.trim().replace(/\n/g, '\n    ')}
  }`;
    }).join(',\n');

    return `// Service Worker Mock API généré par FreeForge
const MOCK_ROUTES = [
${routesMapping}
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const match = MOCK_ROUTES.find(r => 
    r.method === event.request.method && 
    url.pathname.endsWith(r.path)
  );

  if (match) {
    event.respondWith(
      new Response(JSON.stringify(match.body), {
        status: match.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    );
  }
});`;
  };

  const handleDownloadSW = () => {
    const swCode = generateServiceWorker();
    const blob = new Blob([swCode], { type: 'application/javascript;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mock-service-worker.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeRoute = routes.find(r => r.id === activeRouteId) || routes[0];

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🌐 Concepteur de Serveur API Mock (Service Worker)
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Concevez graphiquement des routes d'API REST locales et exportez un Service Worker pour intercepter vos requêtes côté client.
          </p>
        </div>
        <FolderButton toolId="mock_api" toolName="MockApiServer" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Left column: Routes list */}
        <div className="glass-panel" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>Routes mockées</h2>
            <button onClick={handleAddRoute} className="btn-premium btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6 }}>
              + Ajouter
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 350 }}>
            {routes.map(r => (
              <div 
                key={r.id}
                onClick={() => handleSelectRoute(r)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: `1px solid ${r.id === activeRouteId ? '#10b981' : 'var(--border-light)'}`,
                  backgroundColor: r.id === activeRouteId ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 'bold',
                    backgroundColor: r.method === 'GET' ? '#10b981' : r.method === 'POST' ? '#3b82f6' : '#f59e0b',
                    color: 'black'
                  }}>
                    {r.method}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                    {r.path}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteRoute(r.id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: Editor and Code generator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Route Config */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Configuration de la route</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Méthode :</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-premium" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chemin de la route :</label>
                <input 
                  type="text" 
                  value={path} 
                  onChange={(e) => setPath(e.target.value)} 
                  className="input-premium" 
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace' }}
                  placeholder="/api/route"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Statut HTTP :</label>
                <input 
                  type="number" 
                  value={status} 
                  onChange={(e) => setStatus(parseInt(e.target.value) || 200)} 
                  className="input-premium" 
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Corps de réponse (JSON) :</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ width: '100%', height: 120, fontFamily: 'monospace', fontSize: '0.8rem', padding: 10, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', color: '#10b981' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveRoute} className="btn-premium btn-primary" style={{ padding: '10px 16px', borderRadius: 8, fontWeight: 'bold' }}>
                💾 Enregistrer la route
              </button>
            </div>
          </div>

          {/* Code Export panel */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Exporter le Service Worker Mock</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Intégrez ce script Service Worker dans votre projet frontend pour simuler l'ensemble de ces routes d'API 100% hors-ligne dans votre navigateur.
            </p>
            <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', overflowX: 'auto', maxRank: '200px' }}>
              {generateServiceWorker()}
            </pre>
            <button onClick={handleDownloadSW} className="btn-premium btn-secondary" style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>
              📥 Télécharger mock-service-worker.js
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
