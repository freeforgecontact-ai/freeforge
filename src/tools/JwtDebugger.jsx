import React, { useState, useMemo } from 'react';

/**
 * JwtDebugger — décodeur JWT 100 % local. Décode header + payload (base64url),
 * affiche les claims avec dates lisibles, signale l'expiration. Bonus : re-signer
 * et vérifier en HS256 via window.crypto.subtle. Aucun réseau.
 */

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.s7nVxQ0kF8vQ4qg1bV1g3Q2bF9oXz';

function b64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  try {
    return decodeURIComponent(Array.prototype.map.call(bin, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) { return bin; }
}
function b64urlEncode(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const TS_CLAIMS = ['exp', 'iat', 'nbf', 'auth_time'];
const fmtTs = (v) => new Date(v * 1000).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'medium' });

export default function JwtDebugger({ goBack }) {
  const [token, setToken] = useState(SAMPLE);
  const [secret, setSecret] = useState('mon-secret');
  const [resigned, setResigned] = useState('');
  const [verif, setVerif] = useState(null);
  const [busy, setBusy] = useState(false);
  const hasCrypto = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;

  const decoded = useMemo(() => {
    const parts = token.trim().split('.');
    if (parts.length < 2) return { error: 'JWT invalide : il faut au moins header.payload.' };
    try {
      const header = JSON.parse(b64urlDecode(parts[0]));
      const payload = JSON.parse(b64urlDecode(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expired = typeof payload.exp === 'number' ? payload.exp < now : null;
      return { header, payload, signature: parts[2] || '', expired };
    } catch (e) { return { error: 'Décodage impossible : ' + e.message }; }
  }, [token]);

  async function hmacSign(message) {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
    return b64urlEncode(new Uint8Array(sig));
  }

  const resign = async () => {
    if (!hasCrypto || decoded.error) return;
    setBusy(true); setResigned(''); setVerif(null);
    try {
      const head = b64urlEncode(new Uint8Array(new TextEncoder().encode(JSON.stringify({ ...decoded.header, alg: 'HS256', typ: 'JWT' }))));
      const body = b64urlEncode(new Uint8Array(new TextEncoder().encode(JSON.stringify(decoded.payload))));
      const sig = await hmacSign(`${head}.${body}`);
      setResigned(`${head}.${body}.${sig}`);
    } catch (e) { setResigned('Erreur : ' + e.message); }
    setBusy(false);
  };

  const verify = async () => {
    if (!hasCrypto || decoded.error) return;
    setBusy(true); setVerif(null);
    try {
      const parts = token.trim().split('.');
      const expected = await hmacSign(`${parts[0]}.${parts[1]}`);
      setVerif(expected === parts[2]);
    } catch (e) { setVerif(false); }
    setBusy(false);
  };

  const copy = (txt) => { try { navigator.clipboard.writeText(txt); } catch (e) { /* ignore */ } };

  return (
    <div className="jwt-wrap">
      <style>{`
        .jwt-wrap{color:#eaf2fb;max-width:960px;margin:0 auto}
        .jwt-wrap h1{font-size:1.6rem;margin:0 0 4px}
        .jwt-sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .jwt-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .jwt-ta{width:100%;box-sizing:border-box;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.97);color:#10243a;padding:11px;resize:vertical;min-height:90px}
        .jwt-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .jwt-block h3{font-size:.95rem;margin:0 0 6px;color:#ffae3b}
        .jwt-pre{background:#0a2540;border:1px solid rgba(91,157,255,.35);border-radius:10px;padding:11px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.82rem;white-space:pre-wrap;word-break:break-all;color:#dcebff;margin:0;max-height:240px;overflow:auto}
        .jwt-claims{list-style:none;padding:0;margin:8px 0 0}
        .jwt-claims li{font-size:.82rem;padding:3px 0;color:#cfe2ff}
        .jwt-claims b{color:#fff}
        .jwt-badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:.82rem;font-weight:700;margin-top:8px}
        .jwt-ok{background:rgba(46,204,113,.2);color:#7ef0a8;border:1px solid rgba(46,204,113,.5)}
        .jwt-ko{background:rgba(255,90,90,.18);color:#ff9d9d;border:1px solid rgba(255,90,90,.5)}
        .jwt-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px}
        .jwt-in{flex:1;min-width:160px;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.95);color:#10243a;font-size:.9rem}
        .jwt-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 15px;font-weight:700;cursor:pointer;font-size:.88rem}
        .jwt-btn.ghost{background:rgba(91,157,255,.2);color:#cfe2ff;border:1px solid rgba(91,157,255,.45)}
        .jwt-err{color:#ff9d9d;font-size:.9rem;padding:8px 0}
        @media(max-width:760px){.jwt-cols{grid-template-columns:1fr}}
      `}</style>

      <h1>🔐 Débogueur JWT</h1>
      <p className="jwt-sub">Décode et vérifie tes JSON Web Tokens localement — rien n'est transmis. Re-signature HS256 via l'API Web Crypto.</p>

      <div className="jwt-pane">
        <label style={{ fontSize: '.8rem', color: '#9fb6cf', fontWeight: 600 }}>Token JWT</label>
        <textarea className="jwt-ta" value={token} onChange={(e) => { setToken(e.target.value); setResigned(''); setVerif(null); }} placeholder="Colle ton JWT ici…" />
      </div>

      {decoded.error ? (
        <div className="jwt-pane"><div className="jwt-err">⚠ {decoded.error}</div></div>
      ) : (
        <div className="jwt-pane">
          <div className="jwt-cols">
            <div className="jwt-block">
              <h3>En-tête (header)</h3>
              <pre className="jwt-pre">{JSON.stringify(decoded.header, null, 2)}</pre>
            </div>
            <div className="jwt-block">
              <h3>Charge utile (payload)</h3>
              <pre className="jwt-pre">{JSON.stringify(decoded.payload, null, 2)}</pre>
              <ul className="jwt-claims">
                {TS_CLAIMS.filter((c) => typeof decoded.payload[c] === 'number').map((c) => (
                  <li key={c}><b>{c}</b> → {fmtTs(decoded.payload[c])}</li>
                ))}
              </ul>
              {decoded.expired === true && <span className="jwt-badge jwt-ko">⛔ Token expiré</span>}
              {decoded.expired === false && <span className="jwt-badge jwt-ok">✓ Token valide (non expiré)</span>}
              {decoded.expired === null && <span className="jwt-badge jwt-ok">Aucune date d'expiration (exp)</span>}
            </div>
          </div>
        </div>
      )}

      <div className="jwt-pane">
        <h3 style={{ fontSize: '.95rem', margin: '0 0 4px', color: '#ffae3b' }}>Signature HS256</h3>
        {!hasCrypto ? (
          <div className="jwt-err">window.crypto.subtle est indisponible dans ce contexte (souvent requis : HTTPS ou localhost). La re-signature et la vérification sont désactivées, mais le décodage fonctionne.</div>
        ) : (
          <>
            <div className="jwt-row">
              <input className="jwt-in" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Secret HMAC" />
              <button className="jwt-btn" disabled={busy} onClick={resign}>Re-signer</button>
              <button className="jwt-btn ghost" disabled={busy} onClick={verify}>Vérifier la signature</button>
            </div>
            {verif !== null && (
              <span className={`jwt-badge ${verif ? 'jwt-ok' : 'jwt-ko'}`}>{verif ? '✓ Signature VALIDE pour ce secret' : '✗ Signature INVALIDE'}</span>
            )}
            {resigned && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '.8rem', color: '#9fb6cf', marginBottom: 4 }}>Nouveau token signé :</div>
                <pre className="jwt-pre">{resigned}</pre>
                <button className="jwt-btn ghost" style={{ marginTop: 8 }} onClick={() => copy(resigned)}>📋 Copier le token</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
