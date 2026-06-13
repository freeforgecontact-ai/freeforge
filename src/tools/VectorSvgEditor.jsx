import React, { useState, useRef } from 'react';

/**
 * VectorSvgEditor — éditeur SVG vectoriel simple.
 * Outils : rectangle, cercle, ligne, et mode tracé (clics successifs pour bâtir
 * une polyligne). Sélection, déplacement (glisser), couleurs remplissage/contour,
 * suppression. Rendu sur un <svg>, export du SVG en fichier (.svg). 100 % local.
 */

let _id = 1;
const VW = 800, VH = 500;

export default function VectorSvgEditor({ goBack }) {
  const [shapes, setShapes] = useState([]);
  const [tool, setTool] = useState('select'); // select|rect|circle|line|path
  const [sel, setSel] = useState(null);
  const [fill, setFill] = useState('#ff7a18');
  const [stroke, setStroke] = useState('#5b9dff');
  const [draft, setDraft] = useState(null); // points en cours pour le tracé
  const svgRef = useRef(null);
  const drag = useRef(null);

  const pt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const c = e.touches ? e.touches[0] : e;
    return {
      x: Math.round((c.clientX - r.left) / r.width * VW),
      y: Math.round((c.clientY - r.top) / r.height * VH),
    };
  };

  const add = (s) => { const id = _id++; setShapes((a) => [...a, { id, ...s }]); setSel(id); };

  const onDown = (e) => {
    const p = pt(e);
    if (tool === 'rect') { add({ t: 'rect', x: p.x - 40, y: p.y - 25, w: 80, h: 50, fill, stroke }); setTool('select'); }
    else if (tool === 'circle') { add({ t: 'circle', cx: p.x, cy: p.y, r: 40, fill, stroke }); setTool('select'); }
    else if (tool === 'line') { add({ t: 'line', x1: p.x - 50, y1: p.y, x2: p.x + 50, y2: p.y, stroke }); setTool('select'); }
    else if (tool === 'path') { setDraft((d) => [...(d || []), p]); }
    else { setSel(null); } // clic dans le vide en mode sélection
  };

  const finishPath = () => {
    if (draft && draft.length >= 2) add({ t: 'path', pts: draft, fill: 'none', stroke });
    setDraft(null);
  };

  const startDrag = (e, id) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setSel(id);
    drag.current = { id, start: pt(e), shape: shapes.find((s) => s.id === id) };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const p = pt(e), { start, shape } = drag.current;
    const dx = p.x - start.x, dy = p.y - start.y;
    setShapes((arr) => arr.map((s) => {
      if (s.id !== shape.id) return s;
      if (s.t === 'rect') return { ...s, x: shape.x + dx, y: shape.y + dy };
      if (s.t === 'circle') return { ...s, cx: shape.cx + dx, cy: shape.cy + dy };
      if (s.t === 'line') return { ...s, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
      if (s.t === 'path') return { ...s, pts: shape.pts.map((q) => ({ x: q.x + dx, y: q.y + dy })) };
      return s;
    }));
  };
  const endDrag = () => { drag.current = null; };

  const applyColor = (key, val) => {
    if (key === 'fill') setFill(val); else setStroke(val);
    if (sel != null) setShapes((a) => a.map((s) => (s.id === sel ? { ...s, [key]: val } : s)));
  };
  const del = () => { if (sel != null) { setShapes((a) => a.filter((s) => s.id !== sel)); setSel(null); } };

  const svgString = () => {
    const body = shapes.map((s) => {
      if (s.t === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="3"/>`;
      if (s.t === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="3"/>`;
      if (s.t === 'line') return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.stroke}" stroke-width="3"/>`;
      if (s.t === 'path') return `<polyline points="${s.pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${s.stroke}" stroke-width="3"/>`;
      return '';
    }).join('\n  ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}">\n  ${body}\n</svg>`;
  };
  const exportSvg = () => {
    const blob = new Blob([svgString()], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'dessin.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const render = (s) => {
    const on = s.id === sel;
    const stk = { strokeWidth: 3, stroke: s.stroke || 'none', onMouseDown: (e) => startDrag(e, s.id), onTouchStart: (e) => startDrag(e, s.id), style: { cursor: tool === 'select' ? 'move' : 'crosshair' } };
    const out = on ? { stroke: '#fff', strokeDasharray: '6 4', strokeWidth: 1.5 } : null;
    if (s.t === 'rect') return <g key={s.id}><rect x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} {...stk} />{out && <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="none" {...out} pointerEvents="none" />}</g>;
    if (s.t === 'circle') return <g key={s.id}><circle cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} {...stk} />{out && <circle cx={s.cx} cy={s.cy} r={s.r} fill="none" {...out} pointerEvents="none" />}</g>;
    if (s.t === 'line') return <line key={s.id} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...stk} stroke={on ? '#fff' : s.stroke} />;
    if (s.t === 'path') return <polyline key={s.id} points={s.pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" {...stk} stroke={on ? '#fff' : s.stroke} />;
    return null;
  };

  const TOOLS = [['select', '🖱️ Sélection'], ['rect', '▭ Rectangle'], ['circle', '⬤ Cercle'], ['line', '／ Ligne'], ['path', '✎ Tracé']];

  return (
    <div className="vse">
      <style>{`
        .vse{color:#eaf2fb;max-width:980px;margin:0 auto}
        .vse h1{font-size:1.55rem;margin:0 0 4px}
        .vse .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .vse-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
        .vse-btn{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:9px 12px;font-weight:600;cursor:pointer;font-size:.85rem}
        .vse-btn.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .vse-btn.go{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .vse-field{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#9fb6cf}
        .vse-stage{border:1px solid rgba(255,255,255,.14);border-radius:14px;overflow:hidden;background:#0a1628}
        .vse-stage svg{display:block;width:100%;height:auto;background:#0e1d36;touch-action:none}
        .vse-hint{color:#9fb6cf;font-size:.82rem;margin:8px 0 0}
      `}</style>

      <h1>✏️ Éditeur SVG vectoriel</h1>
      <p className="sub">Ajoute des formes, déplace-les, change les couleurs, puis exporte un vrai fichier SVG. 100 % local.</p>

      <div className="vse-row">
        {TOOLS.map(([k, lbl]) => (
          <button key={k} className={`vse-btn ${tool === k ? 'on' : ''}`}
                  onClick={() => { if (tool === 'path' && k !== 'path') finishPath(); setTool(k); }}>{lbl}</button>
        ))}
      </div>

      <div className="vse-row">
        <label className="vse-field">Remplissage <input type="color" value={fill} onChange={(e) => applyColor('fill', e.target.value)} /></label>
        <label className="vse-field">Contour <input type="color" value={stroke} onChange={(e) => applyColor('stroke', e.target.value)} /></label>
        <button className="vse-btn" onClick={del} disabled={sel == null}>🗑 Supprimer</button>
        {tool === 'path' && <button className="vse-btn" onClick={finishPath}>✓ Terminer le tracé</button>}
        <button className="vse-btn" onClick={() => { setShapes([]); setSel(null); setDraft(null); }}>Tout effacer</button>
        <button className="vse-btn go" onClick={exportSvg}>⬇ Export SVG</button>
      </div>

      <div className="vse-stage">
        <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`}
             onMouseDown={onDown} onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag}
             onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={endDrag}>
          {shapes.map(render)}
          {draft && draft.length > 0 && (
            <>
              <polyline points={draft.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke} strokeWidth="3" strokeDasharray="5 4" pointerEvents="none" />
              {draft.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ffae3b" pointerEvents="none" />)}
            </>
          )}
        </svg>
      </div>
      <p className="vse-hint">{tool === 'path' ? 'Mode tracé : clique pour poser des points, puis « Terminer le tracé ».' : 'Choisis un outil et clique sur la zone. En mode sélection, glisse une forme pour la déplacer.'}</p>
      {goBack && <div className="vse-row" style={{ marginTop: 12 }}><button className="vse-btn" onClick={goBack}>← Retour</button></div>}
    </div>
  );
}
