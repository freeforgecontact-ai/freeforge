import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * MindMap — concepteur de carte mentale vectorielle, 100 % local & hors-ligne.
 * Ajoute des nœuds, relie parent -> enfant, déplace-les au glisser (souris/tactile)
 * sur un <svg>. Liens courbes, export SVG, mémorisation dans le navigateur.
 * Aucune connexion réseau, aucune donnée envoyée.
 */

const LS_KEY = 'mindmap_local_v1';
const PALETTE = ['#ff7a18', '#ffae3b', '#5b9dff', '#37c98a', '#c77dff', '#ff6b9d'];
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default function MindMap() {
  const [nodes, setNodes] = useState([]); // {id,text,x,y,color}
  const [links, setLinks] = useState([]); // {from,to}
  const [sel, setSel] = useState(null);    // id sélectionné (pour relier/éditer)
  const [linkMode, setLinkMode] = useState(false);
  const svgRef = useRef(null);
  const drag = useRef(null); // {id,dx,dy}

  // ---- persistance ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.nodes)) setNodes(d.nodes);
        if (Array.isArray(d.links)) setLinks(d.links);
      } else {
        setNodes([{ id: uid(), text: 'Idée centrale', x: 380, y: 230, color: PALETTE[2] }]);
      }
    } catch (e) {
      setNodes([{ id: uid(), text: 'Idée centrale', x: 380, y: 230, color: PALETTE[2] }]);
    }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ nodes, links })); } catch (e) { /* quota : ignore */ }
  }, [nodes, links]);

  const pt = (e) => {
    const svg = svgRef.current;
    const r = svg.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    const vb = 800 / r.width; // viewBox 800 large -> coords logiques
    return { x: (src.clientX - r.left) * vb, y: (src.clientY - r.top) * (520 / r.height) };
  };

  const addNode = () => {
    const n = { id: uid(), text: 'Nouveau nœud', x: 120 + Math.random() * 480, y: 80 + Math.random() * 320, color: PALETTE[nodes.length % PALETTE.length] };
    setNodes((p) => [...p, n]);
    if (sel && linkMode) setLinks((l) => [...l, { from: sel, to: n.id }]);
    setSel(n.id);
  };

  const onNodeDown = (e, id) => {
    e.stopPropagation();
    if (linkMode) {
      if (sel && sel !== id && !links.some((l) => (l.from === sel && l.to === id) || (l.from === id && l.to === sel))) {
        setLinks((l) => [...l, { from: sel, to: id }]);
        setSel(null);
      } else setSel(id);
      return;
    }
    setSel(id);
    const p = pt(e);
    const n = nodes.find((x) => x.id === id);
    drag.current = { id, dx: p.x - n.x, dy: p.y - n.y };
  };

  const onMove = useCallback((e) => {
    if (!drag.current) return;
    if (e.cancelable) e.preventDefault();
    const p = pt(e);
    setNodes((prev) => prev.map((n) => n.id === drag.current.id
      ? { ...n, x: Math.max(20, Math.min(780, p.x - drag.current.dx)), y: Math.max(20, Math.min(500, p.y - drag.current.dy)) }
      : n));
  }, []);
  const onUp = useCallback(() => { drag.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  const rename = (id) => {
    const n = nodes.find((x) => x.id === id);
    const t = prompt('Texte du nœud :', n ? n.text : '');
    if (t != null) setNodes((p) => p.map((x) => x.id === id ? { ...x, text: t.trim() || x.text } : x));
  };
  const cycleColor = (id) => setNodes((p) => p.map((x) => {
    if (x.id !== id) return x;
    const i = (PALETTE.indexOf(x.color) + 1) % PALETTE.length;
    return { ...x, color: PALETTE[i] };
  }));
  const delNode = (id) => {
    setNodes((p) => p.filter((x) => x.id !== id));
    setLinks((l) => l.filter((x) => x.from !== id && x.to !== id));
    if (sel === id) setSel(null);
  };
  const reset = () => {
    if (!confirm('Effacer toute la carte ?')) return;
    setNodes([{ id: uid(), text: 'Idée centrale', x: 380, y: 230, color: PALETTE[2] }]);
    setLinks([]); setSel(null);
  };

  const exportSVG = () => {
    const w = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const curves = links.map((l) => {
      const a = nodes.find((n) => n.id === l.from), b = nodes.find((n) => n.id === l.to);
      if (!a || !b) return '';
      const mx = (a.x + b.x) / 2;
      return `<path d="M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}" stroke="#5b9dff" stroke-width="2.5" fill="none" opacity="0.7"/>`;
    }).join('');
    const boxes = nodes.map((n) => {
      const wd = Math.max(70, n.text.length * 8 + 24);
      return `<g><rect x="${n.x - wd / 2}" y="${n.y - 17}" width="${wd}" height="34" rx="9" fill="${n.color}"/>` +
        `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#1b1300">${w(n.text)}</text></g>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520"><rect width="800" height="520" fill="#0a1628"/>${curves}${boxes}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'carte-mentale.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="mmap">
      <style>{`
        .mmap{color:#eaf2fb;max-width:920px;margin:0 auto}
        .mmap h1{font-size:1.55rem;margin:0 0 4px}
        .mmap .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .mmap-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
        .mmap-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.88rem}
        .mmap-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .mmap-btn.on{background:rgba(91,157,255,.3);color:#eaf2fb;border:1px solid rgba(91,157,255,.6)}
        .mmap-stage{background:#0a1628;border:1px solid rgba(255,255,255,.14);border-radius:16px;overflow:hidden;touch-action:none}
        .mmap-stage svg{display:block;width:100%;height:auto}
        .mmap-node{cursor:grab}
        .mmap-node:active{cursor:grabbing}
        .mmap-node rect{stroke:rgba(255,255,255,.25);stroke-width:1}
        .mmap-node.sel rect{stroke:#fff;stroke-width:2.5}
        .mmap-node text{user-select:none;pointer-events:none}
        .mmap-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:.85rem;color:#9fb6cf;align-items:center}
        .mmap-mini{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:8px;padding:6px 11px;cursor:pointer;font-size:.82rem}
        .mmap-mini:hover{background:rgba(255,255,255,.16)}
        .mmap-mini:disabled{opacity:.4;cursor:not-allowed}
        .mmap .hint{color:#9fb6cf;font-size:.82rem;margin:10px 0 0}
        @media(max-width:760px){.mmap-bar{gap:8px}.mmap-btn{padding:9px 12px;font-size:.84rem}}
      `}</style>

      <h1>🧠 Carte mentale</h1>
      <p className="sub">Ajoute des nœuds, relie-les, glisse-les. Export SVG. 100 % local — rien n'est envoyé sur Internet.</p>

      <div className="mmap-bar">
        <button className="mmap-btn" onClick={addNode}>＋ Nœud</button>
        <button className={`mmap-btn ${linkMode ? 'on' : ''}`} onClick={() => { setLinkMode((m) => !m); setSel(null); }}>
          {linkMode ? '🔗 Mode lien : ON' : '🔗 Relier'}
        </button>
        <button className="mmap-btn ghost" onClick={exportSVG}>⬇ Exporter SVG</button>
        <button className="mmap-btn ghost" onClick={reset}>🗑 Tout effacer</button>
      </div>

      <div className="mmap-stage">
        <svg ref={svgRef} viewBox="0 0 800 520" onMouseDown={() => { if (!linkMode) setSel(null); }}>
          {links.map((l, i) => {
            const a = nodes.find((n) => n.id === l.from), b = nodes.find((n) => n.id === l.to);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            return <path key={i} d={`M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`}
                         stroke="#5b9dff" strokeWidth="2.5" fill="none" opacity="0.7" />;
          })}
          {nodes.map((n) => {
            const wd = Math.max(70, n.text.length * 8 + 24);
            return (
              <g key={n.id} className={`mmap-node ${sel === n.id ? 'sel' : ''}`}
                 onMouseDown={(e) => onNodeDown(e, n.id)} onTouchStart={(e) => onNodeDown(e, n.id)}
                 onDoubleClick={() => rename(n.id)}>
                <rect x={n.x - wd / 2} y={n.y - 17} width={wd} height={34} rx={9} fill={n.color} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1b1300">{n.text}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mmap-tools">
        {sel ? (
          <>
            <span>Nœud sélectionné :</span>
            <button className="mmap-mini" onClick={() => rename(sel)}>✏ Renommer</button>
            <button className="mmap-mini" onClick={() => cycleColor(sel)}>🎨 Couleur</button>
            <button className="mmap-mini" onClick={() => delNode(sel)}>🗑 Supprimer</button>
          </>
        ) : <span>{linkMode ? 'Clique un nœud puis un autre pour les relier.' : 'Clique un nœud pour le sélectionner. Double-clic = renommer.'}</span>}
      </div>
      <p className="hint">Glisse les nœuds pour les déplacer (souris ou tactile). {nodes.length} nœud(s), {links.length} lien(s).</p>
    </div>
  );
}
