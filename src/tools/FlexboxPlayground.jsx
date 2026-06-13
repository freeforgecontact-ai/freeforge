import React, { useState, useMemo } from 'react';

/**
 * FlexboxPlayground — terrain de jeu CSS Flexbox & Grid, 100 % local & hors-ligne.
 * Onglet Flexbox : direction, justify, align, wrap, gap + aperçu en direct.
 * Onglet Grid : template-columns, gap, nb d'éléments + aperçu.
 * Le CSS généré est affiché et copiable. Aucun réseau, aucun serveur.
 */

const FLEX_DIR = ['row', 'row-reverse', 'column', 'column-reverse'];
const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
const ALIGN = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'];
const WRAP = ['nowrap', 'wrap', 'wrap-reverse'];
const GRID_PRESETS = ['repeat(3, 1fr)', 'repeat(4, 1fr)', '1fr 2fr 1fr', '200px 1fr', 'repeat(auto-fill, minmax(90px, 1fr))'];

export default function FlexboxPlayground({ goBack }) {
  const [tab, setTab] = useState('flex');
  const [count, setCount] = useState(5);
  const [copied, setCopied] = useState(false);

  const [dir, setDir] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [wrap, setWrap] = useState('wrap');
  const [fGap, setFGap] = useState(12);

  const [cols, setCols] = useState('repeat(3, 1fr)');
  const [gGap, setGGap] = useState(12);

  const items = useMemo(() => Array.from({ length: count }, (_, i) => i + 1), [count]);

  const css = useMemo(() => {
    if (tab === 'flex') {
      return `.conteneur {\n  display: flex;\n  flex-direction: ${dir};\n  justify-content: ${justify};\n  align-items: ${align};\n  flex-wrap: ${wrap};\n  gap: ${fGap}px;\n}`;
    }
    return `.conteneur {\n  display: grid;\n  grid-template-columns: ${cols};\n  gap: ${gGap}px;\n}`;
  }, [tab, dir, justify, align, wrap, fGap, cols, gGap]);

  const previewStyle = tab === 'flex'
    ? { display: 'flex', flexDirection: dir, justifyContent: justify, alignItems: align, flexWrap: wrap, gap: fGap }
    : { display: 'grid', gridTemplateColumns: cols, gap: gGap };

  const copy = async () => {
    try { await navigator.clipboard.writeText(css); } catch (e) { /* clipboard indispo : on ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };

  const Sel = ({ label, value, set, opts }) => (
    <label className="fpg-field">
      <span>{label}</span>
      <select className="fpg-sel" value={value} onChange={(e) => set(e.target.value)}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );

  return (
    <div className="fpg">
      <style>{`
        .fpg{color:#eaf2fb;max-width:1080px;margin:0 auto}
        .fpg h1{font-size:1.55rem;margin:0 0 4px}
        .fpg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .fpg-tabs{display:flex;gap:8px;margin-bottom:14px}
        .fpg-tab{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:9px 18px;font-weight:700;cursor:pointer;font-size:.9rem}
        .fpg-tab.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .fpg-grid{display:grid;grid-template-columns:300px 1fr;gap:16px}
        .fpg-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}
        .fpg-field{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;font-size:.82rem;color:#9fb6cf}
        .fpg-sel{background:rgba(255,255,255,.95);color:#0a2236;border:1px solid #cfe0f2;border-radius:9px;padding:8px 10px;font-size:.85rem}
        .fpg-in{background:rgba(255,255,255,.95);color:#0a2236;border:1px solid #cfe0f2;border-radius:9px;padding:8px 10px;font-size:.85rem;width:100%;box-sizing:border-box}
        .fpg-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .fpg-row button{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:8px;width:34px;height:34px;font-size:1.1rem;cursor:pointer;font-weight:700}
        .fpg-row button:hover{background:rgba(91,157,255,.25)}
        .fpg-preview{min-height:240px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.03),rgba(255,255,255,.03) 12px,rgba(255,255,255,.06) 12px,rgba(255,255,255,.06) 24px);border:1px dashed rgba(255,255,255,.2);border-radius:12px;padding:12px}
        .fpg-item{background:linear-gradient(135deg,#5b9dff,#0a3559);color:#fff;border-radius:8px;min-width:54px;min-height:48px;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3);padding:10px}
        .fpg-code{position:relative;margin-top:16px}
        .fpg-code pre{background:#071524;color:#bfe0ff;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px;font-size:.85rem;overflow:auto;margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;line-height:1.5}
        .fpg-copy{position:absolute;top:10px;right:10px;background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.78rem}
        .fpg-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .fpg-presets button{background:rgba(91,157,255,.15);color:#cfe0f2;border:1px solid rgba(91,157,255,.35);border-radius:7px;padding:5px 9px;font-size:.74rem;cursor:pointer}
        .fpg-presets button:hover{background:rgba(91,157,255,.3)}
        @media(max-width:760px){.fpg-grid{grid-template-columns:1fr}.fpg h1{font-size:1.3rem}}
      `}</style>

      <h1>🧩 Terrain de jeu Flexbox & Grid</h1>
      <p className="sub">Manipule les propriétés CSS, observe l'aperçu en direct et copie le code généré. 100 % hors-ligne.</p>

      <div className="fpg-tabs">
        <button className={`fpg-tab ${tab === 'flex' ? 'on' : ''}`} onClick={() => setTab('flex')}>Flexbox</button>
        <button className={`fpg-tab ${tab === 'grid' ? 'on' : ''}`} onClick={() => setTab('grid')}>Grid</button>
      </div>

      <div className="fpg-grid">
        <div className="fpg-card">
          {tab === 'flex' ? (
            <>
              <Sel label="flex-direction" value={dir} set={setDir} opts={FLEX_DIR} />
              <Sel label="justify-content" value={justify} set={setJustify} opts={JUSTIFY} />
              <Sel label="align-items" value={align} set={setAlign} opts={ALIGN} />
              <Sel label="flex-wrap" value={wrap} set={setWrap} opts={WRAP} />
              <label className="fpg-field">
                <span>gap : {fGap}px</span>
                <input type="range" min="0" max="40" value={fGap} onChange={(e) => setFGap(Number(e.target.value))} style={{ accentColor: '#ff8a3b' }} />
              </label>
            </>
          ) : (
            <>
              <label className="fpg-field">
                <span>grid-template-columns</span>
                <input className="fpg-in" value={cols} onChange={(e) => setCols(e.target.value)} placeholder="repeat(3, 1fr)" />
              </label>
              <div className="fpg-presets">
                {GRID_PRESETS.map((p) => <button key={p} onClick={() => setCols(p)}>{p}</button>)}
              </div>
              <label className="fpg-field">
                <span>gap : {gGap}px</span>
                <input type="range" min="0" max="40" value={gGap} onChange={(e) => setGGap(Number(e.target.value))} style={{ accentColor: '#ff8a3b' }} />
              </label>
            </>
          )}

          <div className="fpg-row">
            <span style={{ fontSize: '.82rem', color: '#9fb6cf', flex: 1 }}>Éléments : {count}</span>
            <button onClick={() => setCount((c) => Math.max(1, c - 1))} title="Retirer">−</button>
            <button onClick={() => setCount((c) => Math.min(20, c + 1))} title="Ajouter">＋</button>
          </div>
        </div>

        <div className="fpg-card">
          <div className="fpg-preview" style={previewStyle}>
            {items.map((n) => <div key={n} className="fpg-item">{n}</div>)}
          </div>

          <div className="fpg-code">
            <button className="fpg-copy" onClick={copy}>{copied ? '✓ Copié' : 'Copier le CSS'}</button>
            <pre>{css}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
