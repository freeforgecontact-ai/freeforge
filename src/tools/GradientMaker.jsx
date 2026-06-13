import React, { useState } from 'react';

/**
 * GradientMaker — créateur de dégradés CSS 100 % local & hors-ligne.
 * Type linéaire (avec angle réglable) ou radial, arrêts de couleur multiples
 * (ajout/suppression, couleur + position), aperçu grand format en direct et
 * code CSS prêt à copier. Bouton « aléatoire » pour s'inspirer.
 */

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const randHex = () =>
  '#' + Array.from({ length: 3 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

export default function GradientMaker({ goBack }) {
  const [type, setType] = useState('linear'); // 'linear' | 'radial'
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState([
    { id: uid(), color: '#ff7a18', pos: 0 },
    { id: uid(), color: '#5b9dff', pos: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const ordered = [...stops].sort((a, b) => a.pos - b.pos);
  const stopsStr = ordered.map((s) => `${s.color} ${s.pos}%`).join(', ');
  const css = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stopsStr})`
    : `radial-gradient(circle, ${stopsStr})`;

  const update = (id, patch) => setStops((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addStop = () => setStops((arr) => [...arr, { id: uid(), color: randHex(), pos: 50 }]);
  const removeStop = (id) => setStops((arr) => (arr.length > 2 ? arr.filter((s) => s.id !== id) : arr));

  const randomize = () => {
    const n = 2 + Math.floor(Math.random() * 3);
    const next = Array.from({ length: n }, (_, i) => ({
      id: uid(),
      color: randHex(),
      pos: Math.round((i / (n - 1)) * 100),
    }));
    setStops(next);
    setType(Math.random() < 0.5 ? 'linear' : 'radial');
    setAngle(Math.floor(Math.random() * 360));
  };

  const copy = () => {
    navigator.clipboard?.writeText(`background: ${css};`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    }).catch(() => {});
  };

  return (
    <div className="gmk">
      <style>{`
        .gmk{color:#eaf2fb;max-width:980px;margin:0 auto}
        .gmk h1{font-size:1.6rem;margin:0 0 4px}
        .gmk .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .gmk-top{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .gmk-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .gmk-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .gmk-grid{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
        .gmk-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}
        .gmk-preview{height:300px;border-radius:14px;border:1px solid rgba(255,255,255,.16)}
        .gmk-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .gmk-seg{display:flex;gap:6px;margin-bottom:12px}
        .gmk-seg button{flex:1;background:rgba(255,255,255,.07);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:9px;padding:8px;cursor:pointer;font-size:.85rem}
        .gmk-seg button.on{background:rgba(91,157,255,.28);border-color:#5b9dff;font-weight:700}
        .gmk-lbl{font-size:.82rem;color:#9fb6cf;margin:6px 0 4px}
        .gmk input[type=range]{accent-color:#ff8a3b;width:100%}
        .gmk input[type=color]{width:38px;height:34px;border:none;background:none;border-radius:8px;cursor:pointer;padding:0}
        .gmk-stop{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;margin-bottom:8px}
        .gmk-pos{flex:1}
        .gmk-num{font-size:.78rem;color:#9fb6cf;min-width:38px;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace}
        .gmk-del{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#ff9a9a;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:.9rem}
        .gmk-del:disabled{opacity:.3;cursor:not-allowed;color:#9fb6cf}
        .gmk-code{background:#0a1628;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.82rem;color:#cfe3ff;word-break:break-all;white-space:pre-wrap}
        @media(max-width:760px){.gmk-grid{grid-template-columns:1fr}.gmk-preview{height:220px}}
      `}</style>

      <h1>🌈 Créateur de dégradés CSS</h1>
      <p className="sub">Compose ton dégradé et copie le CSS. 100 % local — aucune connexion requise.</p>

      <div className="gmk-top">
        <button className="gmk-btn" onClick={randomize}>🎲 Aléatoire</button>
        <button className="gmk-btn ghost" onClick={addStop}>＋ Ajouter une couleur</button>
        {goBack && <button className="gmk-btn ghost" onClick={goBack}>← Retour</button>}
      </div>

      <div className="gmk-grid">
        <div className="gmk-pane">
          <div className="gmk-preview" style={{ background: css }} />
          <div className="gmk-lbl">CSS généré</div>
          <div className="gmk-code">background: {css};</div>
          <button className="gmk-btn" style={{ marginTop: 10 }} onClick={copy}>
            {copied ? '✓ Copié !' : '📋 Copier le CSS'}
          </button>
        </div>

        <div className="gmk-pane">
          <div className="gmk-seg">
            <button className={type === 'linear' ? 'on' : ''} onClick={() => setType('linear')}>Linéaire</button>
            <button className={type === 'radial' ? 'on' : ''} onClick={() => setType('radial')}>Radial</button>
          </div>

          {type === 'linear' && (
            <>
              <div className="gmk-lbl">Angle : {angle}°</div>
              <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
            </>
          )}

          <div className="gmk-lbl" style={{ marginTop: 10 }}>Arrêts de couleur</div>
          {ordered.map((s) => (
            <div key={s.id} className="gmk-stop">
              <input type="color" value={s.color} onChange={(e) => update(s.id, { color: e.target.value })} />
              <input className="gmk-pos" type="range" min="0" max="100" value={s.pos}
                     onChange={(e) => update(s.id, { pos: Number(e.target.value) })} />
              <span className="gmk-num">{s.pos}%</span>
              <button className="gmk-del" disabled={stops.length <= 2}
                      onClick={() => removeStop(s.id)} title="Supprimer">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
