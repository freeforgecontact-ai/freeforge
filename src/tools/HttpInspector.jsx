import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function HttpInspector({ goBack }) {
  const [targetUrl, setTargetUrl] = useState('https://github.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Simulated results for offline/fallback mode
  const getMockData = (url) => {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('github')) {
      return {
        redirectChain: [url],
        finalUrl: 'https://github.com',
        statusCode: 200,
        headers: {
          'content-security-policy': "default-src 'none'; base-uri 'self'; block-all-mixed-content;",
          'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
          'x-frame-options': 'deny',
          'x-content-type-options': 'nosniff',
          'access-control-allow-origin': '*',
          'server': 'GitHub.com',
          'date': new Date().toUTCString()
        }
      };
    }
    if (cleanUrl.includes('http://')) {
      // Simulate insecure site redirecting to https
      const httpsUrl = url.replace('http://', 'https://');
      return {
        redirectChain: [url, httpsUrl],
        finalUrl: httpsUrl,
        statusCode: 200,
        headers: {
          'strict-transport-security': 'max-age=600',
          'x-frame-options': 'sameorigin',
          'x-content-type-options': 'nosniff',
          'access-control-allow-origin': '*',
          'date': new Date().toUTCString()
        }
      };
    }
    return {
      redirectChain: [url],
      finalUrl: url,
      statusCode: 200,
      headers: {
        'x-frame-options': 'sameorigin',
        'content-type': 'text/html; charset=UTF-8',
        'date': new Date().toUTCString()
      }
    };
  };

  const handleInspect = async () => {
    if (!targetUrl) return;
    setIsProcessing(true);
    setResults(null);
    setIsOffline(false);

    try {
      const res = await fetch(`/api/inspect-url?targetUrl=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) {
        throw new Error('Server offline or request blocked');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.warn("Backend not running or CORS blocked. Falling back to offline sandbox simulator.");
      setIsOffline(true);
      setResults(getMockData(targetUrl));
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to categorize security headers
  const getSecurityHeaderScore = (headers) => {
    if (!headers) return { score: 0, label: 'Danger', color: '#ef4444' };
    let score = 0;
    const h = Object.keys(headers).reduce((acc, k) => {
      acc[k.toLowerCase()] = headers[k];
      return acc;
    }, {});

    if (h['content-security-policy']) score++;
    if (h['strict-transport-security']) score++;
    if (h['x-frame-options']) score++;
    if (h['x-content-type-options']) score++;

    const levels = [
      { score: 0, label: 'Non protégé 🔴', color: '#ef4444' },
      { score: 1, label: 'Protection Faible 🟠', color: '#f97316' },
      { score: 2, label: 'Protection Moyenne 🟡', color: '#eab308' },
      { score: 3, label: 'Protection Forte 🟢', color: '#10b981' },
      { score: 4, label: 'Protection Maximale 🚀', color: '#3b82f6' }
    ];
    return levels[score];
  };

  const securityRating = getSecurityHeaderScore(results?.headers);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Inspecteur de Redirections & En-têtes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analysez la chaîne complète de redirection d'un site et vérifiez ses en-têtes de sécurité.</p>
        </div>
        <FolderButton toolId="http_inspector" toolName="Inspecteur HTTP" />
      </div>

      <div className="grid-2">
        {/* Left Column: Input URL */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Saisir l'adresse URL</h2>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="url" 
              value={targetUrl} 
              onChange={(e) => setTargetUrl(e.target.value)}
              className="input-premium"
              placeholder="https://example.com"
              style={{ flex: 1 }}
            />
            <button onClick={handleInspect} className="btn-premium btn-primary" style={{ padding: '10px 16px' }} disabled={isProcessing}>
              {isProcessing ? 'Analyse...' : '🔍 Inspecter'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Exemples de test :</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTargetUrl('https://github.com')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', color: 'white', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>GitHub</button>
              <button onClick={() => setTargetUrl('http://github.com')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', color: 'white', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>http:// (Redirection)</button>
            </div>
          </div>

          {isOffline && (
            <div style={{ padding: 12, backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: 8, fontSize: '0.8rem', color: '#fb923c' }}>
              ℹ️ Mode Sandbox : Serveur local introuvable. Affichage de données simulées.
            </div>
          )}
        </div>

        {/* Right Column: Redirection chain and security results */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Résultats de l'analyse</h2>
          
          {results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Redirection Chain */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Chaîne de redirection ({results.redirectChain.length} étapes) :</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {results.redirectChain.map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{idx + 1}.</span>
                      <span style={{ fontFamily: 'monospace', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{url}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Code Statut Final :</span>
                <span style={{ fontWeight: 600, color: results.statusCode === 200 ? '#34d399' : '#f87171' }}>{results.statusCode} OK</span>
              </div>

              {/* Security Rating */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Niveau de protection des en-têtes :</span>
                <span style={{ fontWeight: 600, color: securityRating.color }}>{securityRating.label}</span>
              </div>

              {/* Headers List */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>En-têtes HTTP de sécurité détectés :</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {Object.keys(results.headers).map(key => {
                    const lowKey = key.toLowerCase();
                    const isSec = ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'access-control-allow-origin'].includes(lowKey);
                    
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, backgroundColor: isSec ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)', border: isSec ? '1px solid rgba(16,185,129,0.15)' : '1px solid var(--border-light)', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ color: isSec ? '#34d399' : 'var(--text-muted)', fontWeight: 'bold' }}>{key}</span>
                        <span style={{ color: 'white', wordBreak: 'break-all' }}>{results.headers[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Lancez une inspection pour obtenir les redirections et en-têtes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
