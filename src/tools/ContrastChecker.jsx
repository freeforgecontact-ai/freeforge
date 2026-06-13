import React, { useState, useMemo } from 'react';

/**
 * ContrastChecker — vérificateur de contraste & accessibilité (A11y), 100 % local.
 * Calcule le ratio de contraste WCAG 2.1, indique réussite/échec AA & AAA pour
 * texte normal et grand. Aperçu en direct + simulation de daltonisme via filtres
 * SVG feColorMatrix. Aucun réseau, aucun serveur.
 */

const clean = (h) => {
  let s = (h || '').trim().replace(/^#/, '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
};
const toRgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const lum = (hex) => {
  const a = toRgb(hex).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const ratio = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const CB = [
  { id: 'none', label: 'Vision normale' },
  { id: 'prot', label: 'Protanopie (rouge)' },
  { id: 'deut', label: 'Deutéranopie (vert)' },
  { id: 'trit', label: 'Tritanopie (bleu)' },
];

export default function ContrastChecker({ goBack }) {
  const [fg, setFg] = useState('#1b2a3a');
  const [bg, setBg] = useState('#ffd34d');
  const [fgHex, setFgHex] = useState('#1b2a3a');
  const [bgHex, setBgHex] = useState('#ffd34d');
  const [cb, setCb] = useState('none');

  const setColor = (raw, setMain, setText) => {
    setText(raw);
    const c = clean(raw);
    if (c) setMain(c);
  };

  const r = useMemo(() => ratio(fg, bg), [fg, bg]);
  const rTxt = r.toFixed(2);
  const pass = (limit) => r >= limit;

  const Badge = ({ ok, children }) => (
    <span className="cc-badge" style={{ background: ok ? 'rgba(72,213,151,.2)' : 'rgba(255,122,138,.2)', color: ok ? '#48d597' : '#ff8a8a', borderColor: ok ? 'rgba(72,213,151,.5)' : 'rgba(255,122,138,.5)' }}>
      {ok ? '✓ Réussi' : '✕ Échec'} — {children}
    </span>
  );

  const grade = r >= 7 ? 'Excellent (AAA)' : r >= 4.5 ? 'Bon (AA)' : r >= 3 ? 'Limite (grand texte)' : 'Insuffisant';

  return (
    <div className="cc">
      <style>{`
        .cc{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .cc h1{font-size:1.55rem;margin:0 0 4px}
        .cc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .cc-grid{display:grid;grid-template-columns:320px 1fr;gap:16px}
        .cc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .cc-field{margin-bottom:16px}
        .cc-field>span{display:block;font-size:.82rem;color:#9fb6cf;margin-bottom:6px}
        .cc-pick{display:flex;gap:8px;align-items:center}
        .cc-pick input[type=color]{width:48px;height:42px;border:none;border-radius:9px;background:none;cursor:pointer;padding:0}
        .cc-hex{flex:1;background:rgba(255,255,255,.95);color:#0a2236;border:1px solid #cfe0f2;border-radius:9px;padding:9px 11px;font-size:.9rem;font-family:ui-monospace,Consolas,monospace}
        .cc-ratio{text-align:center;padding:14px;border-radius:12px;background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.3);margin-bottom:14px}
        .cc-ratio .big{font-size:2.4rem;font-weight:800;color:#fff;line-height:1}
        .cc-ratio .g{font-size:.85rem;color:#cfe0f2;margin-top:4px}
        .cc-badges{display:flex;flex-direction:column;gap:8px}
        .cc-badge{display:inline-block;padding:8px 11px;border-radius:9px;font-size:.82rem;font-weight:600;border:1px solid}
        .cc-sample{border-radius:12px;padding:22px;margin-bottom:12px;border:1px solid rgba(255,255,255,.15)}
        .cc-sample h3{margin:0 0 8px;font-size:1.45rem}
        .cc-sample p{margin:0;font-size:1rem;line-height:1.5}
        .cc-sample small{font-size:.78rem;opacity:.85}
        .cc-cbtabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
        .cc-cbtabs button{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 11px;font-size:.78rem;cursor:pointer}
        .cc-cbtabs button.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;font-weight:700}
        .cc-note{font-size:.78rem;color:#9fb6cf;margin-top:8px;line-height:1.4}
        @media(max-width:760px){.cc-grid{grid-template-columns:1fr}.cc h1{font-size:1.3rem}}
      `}</style>

      {/* Filtres SVG de simulation du daltonisme (matrices standard) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="cc-prot"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" /></filter>
          <filter id="cc-deut"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" /></filter>
          <filter id="cc-trit"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" /></filter>
        </defs>
      </svg>

      <h1>🎨 Vérificateur de contraste (A11y)</h1>
      <p className="sub">Ratio de contraste WCAG 2.1, conformité AA/AAA et simulation de daltonisme. 100 % hors-ligne.</p>

      <div className="cc-grid">
        <div className="cc-card">
          <div className="cc-field">
            <span>Couleur du texte</span>
            <div className="cc-pick">
              <input type="color" value={fg} onChange={(e) => { setFg(e.target.value); setFgHex(e.target.value); }} />
              <input className="cc-hex" value={fgHex} onChange={(e) => setColor(e.target.value, setFg, setFgHex)} />
            </div>
          </div>
          <div className="cc-field">
            <span>Couleur du fond</span>
            <div className="cc-pick">
              <input type="color" value={bg} onChange={(e) => { setBg(e.target.value); setBgHex(e.target.value); }} />
              <input className="cc-hex" value={bgHex} onChange={(e) => setColor(e.target.value, setBg, setBgHex)} />
            </div>
          </div>

          <div className="cc-ratio">
            <div className="big">{rTxt}<span style={{ fontSize: '1rem', fontWeight: 600 }}>:1</span></div>
            <div className="g">{grade}</div>
          </div>

          <div className="cc-badges">
            <Badge ok={pass(4.5)}>AA · texte normal (≥ 4.5)</Badge>
            <Badge ok={pass(3)}>AA · grand texte (≥ 3)</Badge>
            <Badge ok={pass(7)}>AAA · texte normal (≥ 7)</Badge>
            <Badge ok={pass(4.5)}>AAA · grand texte (≥ 4.5)</Badge>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-cbtabs">
            {CB.map((c) => (
              <button key={c.id} className={cb === c.id ? 'on' : ''} onClick={() => setCb(c.id)}>{c.label}</button>
            ))}
          </div>

          <div className="cc-sample" style={{ background: bg, color: fg, filter: cb === 'none' ? 'none' : `url(#cc-${cb})` }}>
            <h3>Grand titre d'exemple</h3>
            <p>Voici un paragraphe de texte normal pour juger la lisibilité réelle de cette combinaison de couleurs sur votre interface.</p>
            <p style={{ marginTop: 10 }}><small>Petit texte secondaire (légende, mention légale, métadonnées).</small></p>
            <button style={{ marginTop: 12, background: fg, color: bg, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'default' }}>
              Bouton d'exemple
            </button>
          </div>

          <p className="cc-note">
            <strong>Repères WCAG :</strong> texte normal &lt; 18,66 px (ou &lt; 24 px si non gras). Grand texte ≥ 24 px,
            ou ≥ 18,66 px en gras. La simulation de daltonisme applique une matrice colorimétrique standard via
            <code> feColorMatrix</code> — un aperçu indicatif, pas un diagnostic médical.
          </p>
        </div>
      </div>
    </div>
  );
}
