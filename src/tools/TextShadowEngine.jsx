import React, { useState, useMemo } from 'react';

/**
 * TextShadowEngine — générateur d'ombres de texte CSS.
 * Empile plusieurs couches d'ombre (décalage x/y, flou, couleur), génère
 * automatiquement un effet 3D (N couches en escalier), aperçu en direct sur
 * un texte éditable avec fond réglable, et fournit le CSS text-shadow copiable.
 * 100 % local, aucun réseau.
 */

let _uid = 1;
const mkLayer = (o = {}) => ({ id: _uid++, x: 2, y: 2, blur: 4, color: '#000000', ...o });

export default function TextShadowEngine({ goBack }) {
  const [text, setText] = useState('Texte d\'exemple');
  const [layers, setLayers] = useState([mkLayer({ x: 0, y: 0, blur: 8, color: '#ff7a18' })]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [bg, setBg] = useState('#0a1628');
  const [size, setSize] = useState(72);
  const [copied, setCopied] = useState(false);

  const css = useMemo(
    () => layers.map((l) => `${l.x}px ${l.y}px ${l.blur}px ${l.color}`).join(', '),
    [layers]
  );

  const update = (id, patch) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLayer = () => setLayers((ls) => [...ls, mkLayer()]);
  const removeLayer = (id) => setLayers((ls) => ls.filter((l) => l.id !== id));

  const make3D = () => {
    const n = 8, base = '#c24a00', dir = 1;
    const next = [];
    for (let i = 1; i <= n; i++) next.push(mkLayer({ x: i * dir, y: i * dir, blur: 0, color: base }));
    next.push(mkLayer({ x: n + 2, y: n + 2, blur: 10, color: 'rgba(0,0,0,.55)' }));
    setLayers(next);
  };

  const copy = async () => {
    const full = `text-shadow: ${css};`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = full; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="tse">
      <style>{`
        .tse{color:#eaf2fb;max-width:980px;margin:0 auto}
        .tse h1{font-size:1.55rem;margin:0 0 4px}
        .tse .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .tse-prev{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:34px 18px;text-align:center;margin-bottom:16px;overflow:hidden}
        .tse-prev .t{font-weight:900;line-height:1.15;word-break:break-word;outline:none}
        .tse-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px}
        .tse-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
        .tse-field{display:flex;flex-direction:column;gap:4px;font-size:.8rem;color:#9fb6cf}
        .tse input[type=text]{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:8px;padding:9px 11px;font-size:.95rem;min-width:200px}
        .tse input[type=range]{accent-color:#ff8a3b}
        .tse-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .tse-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .tse-layer{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
        .tse-layer .ctl{display:flex;flex-direction:column;gap:2px;font-size:.74rem;color:#9fb6cf;min-width:90px}
        .tse-layer .ctl span b{color:#eaf2fb}
        .tse-x{margin-left:auto;background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1.1rem}
        .tse-code{background:#06101f;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem;color:#bfe0ff;white-space:pre-wrap;word-break:break-all;margin-bottom:10px}
        @media(max-width:760px){.tse-layer .ctl{min-width:72px}.tse input[type=text]{min-width:140px}}
      `}</style>

      <h1>🔡 Générateur d'ombres de texte</h1>
      <p className="sub">Empile des couches d'ombre, génère un effet 3D, aperçu en direct et CSS prêt à copier. 100 % local.</p>

      <div className="tse-prev" style={{ background: bg }}>
        <div className="t" contentEditable suppressContentEditableWarning
             onInput={(e) => setText(e.currentTarget.textContent)}
             style={{ fontSize: `${size}px`, color: textColor, textShadow: css }}>
          {text}
        </div>
      </div>

      <div className="tse-row">
        <label className="tse-field">Texte
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="tse-field">Couleur texte
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
        </label>
        <label className="tse-field">Fond
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>
        <label className="tse-field">Taille : <b style={{ color: '#eaf2fb' }}>{size}px</b>
          <input type="range" min="24" max="160" value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>
      </div>

      <div className="tse-row">
        <button className="tse-btn" onClick={addLayer}>＋ Ajouter une couche</button>
        <button className="tse-btn ghost" onClick={make3D}>🧊 Effet 3D auto</button>
        <button className="tse-btn ghost" onClick={() => setLayers([mkLayer()])}>↺ Réinitialiser</button>
      </div>

      <div className="tse-grid">
        {layers.map((l, i) => (
          <div key={l.id} className="tse-layer">
            <strong style={{ minWidth: 70 }}>Couche {i + 1}</strong>
            <label className="ctl"><span>X : <b>{l.x}px</b></span>
              <input type="range" min="-40" max="40" value={l.x} onChange={(e) => update(l.id, { x: +e.target.value })} /></label>
            <label className="ctl"><span>Y : <b>{l.y}px</b></span>
              <input type="range" min="-40" max="40" value={l.y} onChange={(e) => update(l.id, { y: +e.target.value })} /></label>
            <label className="ctl"><span>Flou : <b>{l.blur}px</b></span>
              <input type="range" min="0" max="60" value={l.blur} onChange={(e) => update(l.id, { blur: +e.target.value })} /></label>
            <label className="ctl"><span>Couleur</span>
              <input type="color" value={l.color.startsWith('#') ? l.color : '#000000'} onChange={(e) => update(l.id, { color: e.target.value })} /></label>
            {layers.length > 1 && <button className="tse-x" title="Supprimer" onClick={() => removeLayer(l.id)}>✕</button>}
          </div>
        ))}
      </div>

      <div className="tse-code">text-shadow: {css};</div>
      <div className="tse-row">
        <button className="tse-btn" onClick={copy}>{copied ? '✓ Copié !' : '📋 Copier le CSS'}</button>
        {goBack && <button className="tse-btn ghost" onClick={goBack}>← Retour</button>}
      </div>
    </div>
  );
}
