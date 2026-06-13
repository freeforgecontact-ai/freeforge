import React, { useState } from 'react';

/**
 * TypographyPairer — assortisseur de typographies 100 % local & hors-ligne.
 * Uniquement des polices système / web-safe (aucun téléchargement, aucune
 * connexion) : paires titre + corps préréglées, aperçu d'un échantillon réel,
 * réglages de taille / graisse / interligne, et le CSS font-family à copier.
 */

const PAIRS = [
  { name: 'Élégant classique', heading: 'Georgia, serif', body: 'Verdana, Geneva, sans-serif' },
  { name: 'Magazine', heading: '"Times New Roman", Times, serif', body: 'Arial, Helvetica, sans-serif' },
  { name: 'Moderne épuré', heading: '"Trebuchet MS", Tahoma, sans-serif', body: 'Georgia, serif' },
  { name: 'Éditorial', heading: 'Palatino, "Palatino Linotype", serif', body: '"Trebuchet MS", sans-serif' },
  { name: 'Humaniste', heading: 'Garamond, Georgia, serif', body: 'Verdana, sans-serif' },
  { name: 'Technique', heading: 'Verdana, Geneva, sans-serif', body: '"Courier New", Courier, monospace' },
  { name: 'Système', heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' },
  { name: 'Sobre serif', heading: 'Garamond, serif', body: '"Times New Roman", Times, serif' },
];

const SAMPLE = "Le vif zéphyr jubile sur les kumquats du clown gracieux. Ce paragraphe sert à juger le confort de lecture, l'équilibre des contre-formes et la couleur générale du texte sur plusieurs lignes successives.";

export default function TypographyPairer({ goBack }) {
  const [idx, setIdx] = useState(0);
  const [titleSize, setTitleSize] = useState(34);
  const [bodySize, setBodySize] = useState(16);
  const [titleWeight, setTitleWeight] = useState(700);
  const [bodyWeight, setBodyWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [copied, setCopied] = useState(false);

  const pair = PAIRS[idx];
  const css = `/* ${pair.name} */
h1, h2, h3 {
  font-family: ${pair.heading};
  font-weight: ${titleWeight};
}
body, p {
  font-family: ${pair.body};
  font-weight: ${bodyWeight};
  font-size: ${bodySize}px;
  line-height: ${lineHeight};
}`;

  const copy = () => {
    navigator.clipboard?.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    }).catch(() => {});
  };

  return (
    <div className="typ">
      <style>{`
        .typ{color:#eaf2fb;max-width:980px;margin:0 auto}
        .typ h1.t{font-size:1.6rem;margin:0 0 4px}
        .typ .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .typ-top{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .typ-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .typ-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .typ-grid{display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start}
        .typ-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px}
        .typ-pairs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
        .typ-pill{background:rgba(255,255,255,.07);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:7px 13px;cursor:pointer;font-size:.83rem}
        .typ-pill.on{background:rgba(91,157,255,.28);border-color:#5b9dff;font-weight:700}
        .typ-card{background:#fbfdff;color:#16202e;border-radius:12px;padding:22px}
        .typ-card p{margin:0;color:#33414f}
        .typ-lbl{font-size:.82rem;color:#9fb6cf;margin:10px 0 4px;display:flex;justify-content:space-between}
        .typ input[type=range]{accent-color:#ff8a3b;width:100%}
        .typ-code{background:#0a1628;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.78rem;color:#cfe3ff;white-space:pre-wrap;line-height:1.5;margin-top:6px}
        .typ-name{font-size:.78rem;color:#9fb6cf;margin-bottom:10px}
        @media(max-width:760px){.typ-grid{grid-template-columns:1fr}}
      `}</style>

      <h1 className="t">🔤 Assortisseur de typographies</h1>
      <p className="sub">Polices système & web-safe uniquement — 100 % hors-ligne, rien à télécharger.</p>

      <div className="typ-top">
        {goBack && <button className="typ-btn ghost" onClick={goBack}>← Retour</button>}
        <button className="typ-btn" onClick={() => setIdx((i) => (i + 1) % PAIRS.length)}>↻ Paire suivante</button>
      </div>

      <div className="typ-pairs">
        {PAIRS.map((p, i) => (
          <button key={p.name} className={`typ-pill ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)}>{p.name}</button>
        ))}
      </div>

      <div className="typ-grid">
        <div className="typ-pane">
          <div className="typ-name">Titre : {pair.heading} &nbsp;•&nbsp; Corps : {pair.body}</div>
          <div className="typ-card">
            <div style={{ fontFamily: pair.heading, fontWeight: titleWeight, fontSize: titleSize, lineHeight: 1.2, marginBottom: 14 }}>
              Une harmonie typographique
            </div>
            <p style={{ fontFamily: pair.body, fontWeight: bodyWeight, fontSize: bodySize, lineHeight }}>
              {SAMPLE}
            </p>
          </div>
        </div>

        <div className="typ-pane">
          <div className="typ-lbl"><span>Taille titre</span><span>{titleSize}px</span></div>
          <input type="range" min="20" max="56" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} />

          <div className="typ-lbl"><span>Graisse titre</span><span>{titleWeight}</span></div>
          <input type="range" min="400" max="900" step="100" value={titleWeight} onChange={(e) => setTitleWeight(Number(e.target.value))} />

          <div className="typ-lbl"><span>Taille corps</span><span>{bodySize}px</span></div>
          <input type="range" min="12" max="22" value={bodySize} onChange={(e) => setBodySize(Number(e.target.value))} />

          <div className="typ-lbl"><span>Graisse corps</span><span>{bodyWeight}</span></div>
          <input type="range" min="300" max="700" step="100" value={bodyWeight} onChange={(e) => setBodyWeight(Number(e.target.value))} />

          <div className="typ-lbl"><span>Interligne</span><span>{lineHeight.toFixed(2)}</span></div>
          <input type="range" min="1" max="2.2" step="0.05" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} />
        </div>
      </div>

      <div className="typ-lbl" style={{ maxWidth: 'unset' }}><span>CSS (font-family)</span></div>
      <div className="typ-code">{css}</div>
      <button className="typ-btn" style={{ marginTop: 10 }} onClick={copy}>{copied ? '✓ Copié !' : '📋 Copier le CSS'}</button>
    </div>
  );
}
