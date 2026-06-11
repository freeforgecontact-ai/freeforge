import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function JwtDebugger({ goBack }) {
  const [jwtInput, setJwtInput] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signatureHex, setSignatureHex] = useState('');
  const [signatureValid, setSignatureValid] = useState(null); // true, false or null
  const [secretKey, setSecretKey] = useState('secret-key-123');
  const [error, setError] = useState('');

  // Generation state
  const [genHeader, setGenHeader] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [genPayload, setGenPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [generatedToken, setGeneratedToken] = useState('');

  // Base64Url decode helper
  const base64UrlDecode = (str) => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  };

  // Base64Url encode helper
  const base64UrlEncode = (str) => {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  // Parse token
  const handleDecode = (token) => {
    if (!token) {
      setHeader('');
      setPayload('');
      setSignatureHex('');
      setSignatureValid(null);
      setError('');
      return;
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setError('Format JWT invalide (doit comporter exactement 3 parties séparées par des points).');
      setHeader('');
      setPayload('');
      setSignatureHex('');
      return;
    }

    try {
      setError('');
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);

      // format JSON for pretty display
      try {
        setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      } catch (e) {
        setHeader(decodedHeader);
      }

      try {
        setPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
      } catch (e) {
        setPayload(decodedPayload);
      }

      setSignatureHex(parts[2]);
      
      // Auto-validate with current secret
      validateSignature(parts[0], parts[1], parts[2], secretKey);
    } catch (err) {
      setError('Impossible de décoder le jeton (Base64Url invalide ou JSON corrompu).');
    }
  };

  const validateSignature = async (headerB64, payloadB64, signatureB64, key) => {
    try {
      const dataToSign = `${headerB64}.${payloadB64}`;
      const encoder = new TextEncoder();
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );

      const signatureBuffer = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(dataToSign)
      );

      // Convert buffer to Base64Url
      const signedB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signatureBuffer)));
      setSignatureValid(signedB64 === signatureB64);
    } catch (e) {
      console.error(e);
      setSignatureValid(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      // Validate inputs are json
      const parsedHeader = JSON.parse(genHeader);
      const parsedPayload = JSON.parse(genPayload);

      const headerB64 = base64UrlEncode(JSON.stringify(parsedHeader));
      const payloadB64 = base64UrlEncode(JSON.stringify(parsedPayload));
      const dataToSign = `${headerB64}.${payloadB64}`;

      const encoder = new TextEncoder();
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        encoder.encode(dataToSign)
      );

      const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signatureBuffer)));
      setGeneratedToken(`${dataToSign}.${signatureB64}`);
    } catch (err) {
      alert("Erreur de format JSON lors de la génération : " + err.message);
    }
  };

  useEffect(() => {
    handleDecode(jwtInput);
  }, [jwtInput, secretKey]);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔑 JWT Debugger & Signer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Décodez, modifiez, validez et générez localement vos jetons JWT (JSON Web Tokens) de manière sécurisée et privée.
          </p>
        </div>
        <FolderButton toolId="jwt" toolName="JwtDebugger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Left column: Decryption & Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Jeton JWT encodé</h2>
            <textarea
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              className="input-premium"
              placeholder="Collez votre jeton JWT ici (ex. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
              style={{ width: '100%', height: 110, padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            {error && (
              <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: 8 }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Jeton décodé</h2>
            
            {/* Header section */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 800, marginBottom: 4 }}>
                Header (En-tête)
              </div>
              <pre style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', overflowX: 'auto', margin: 0 }}>
                {header || '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'}
              </pre>
            </div>

            {/* Payload section */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 800, marginBottom: 4 }}>
                Payload (Données)
              </div>
              <pre style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', overflowX: 'auto', margin: 0 }}>
                {payload || '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'}
              </pre>
            </div>
          </div>
        </div>

        {/* Right column: Verification and generator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Signature validation */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Clé Secrète de Validation</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input 
                type="text" 
                value={secretKey} 
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Entrez la clé secrète HMAC"
                className="input-premium"
                style={{ width: '100%', padding: 10, borderRadius: 8, fontSize: '0.9rem' }}
              />
              
              {jwtInput && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: signatureValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${signatureValid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: signatureValid ? '#10b981' : '#f87171',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {signatureValid ? (
                    <>✓ Signature du Jeton Valide (HMAC SHA256)</>
                  ) : (
                    <>✗ Signature Invalide ou clé secrète incorrecte</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generator panel */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Générateur de JWT local</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Header JSON :</label>
                <textarea 
                  value={genHeader} 
                  onChange={(e) => setGenHeader(e.target.value)}
                  style={{ width: '100%', height: 120, fontFamily: 'monospace', fontSize: '0.75rem', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payload JSON :</label>
                <textarea 
                  value={genPayload} 
                  onChange={(e) => setGenPayload(e.target.value)}
                  style={{ width: '100%', height: 120, fontFamily: 'monospace', fontSize: '0.75rem', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: 'white' }}
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleCreateToken}
              className="btn-premium btn-primary"
              style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}
            >
              🛠️ Générer et Signer le Jeton
            </button>

            {generatedToken && (
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jeton Généré :</label>
                <textarea 
                  readOnly 
                  value={generatedToken} 
                  onClick={(e) => { e.target.select(); }}
                  style={{ width: '100%', height: 90, fontFamily: 'monospace', fontSize: '0.75rem', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', color: '#8b5cf6', cursor: 'pointer' }}
                  title="Cliquez pour tout sélectionner"
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>* Cliquez sur le champ pour copier ou sélectionner le token.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
