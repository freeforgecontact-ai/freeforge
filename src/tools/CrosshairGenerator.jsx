import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * CrosshairGenerator — concepteur de viseur (réticule) FPS, 100 % local.
 * Aperçu live dessiné sur <canvas> par-dessus un fond sombre type jeu.
 * Préréglages style Valorant / CS. Export PNG du réticule (canvas.toBlob).
 */

const PRESETS = {
  'Valorant-like': { shape: 'cross', thickness: 2, length: 6, gap: 4, color: '#00ff7f', outline: true, opacity: 1, dot: false, dotSize: 2 },
  'CS-like': { shape: 'cross', thickness: 1, length: 7, gap: 5, color: '#00ff00', outline: true, opacity: 0.85, dot: false, dotSize: 2 },
  'Point seul': { shape: 'dot', thickness: 2, length: 6, gap: 4, color: '#ff2d55', outline: true, opacity: 1, dot: true, dotSize: 4 },
  'Cercle': { shape: 'circle', thickness: 2, length: 12, gap: 0, color: '#ffd60a', outline: true, opacity: 0.9, dot: true, dotSize: 2 },
};

export default function CrosshairGenerator({ goBack }) {
  const [cfg, setCfg] = useState(PRESETS['Valorant-like']);
  const canvasRef = useRef(null);
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const draw = useCallback((ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    // fond "jeu"
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#2a3340'); g.addColorStop(1, '#11151c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = 0; x < cw; x += 28) ctx.fillRect(x, 0, 1, ch);
    for (let y = 0; y < ch; y += 28) ctx.fillRect(0, y, cw, 1);

    const cx = Math.round(cw / 2), cy = Math.round(ch / 2);
    const { shape, thickness: t, length: len, gap, color, outline, opacity, dot, dotSize } = cfg;
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'butt';

    const stroke = (drawFn) => {
      if (outline) { ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = t + 2; drawFn(ctx); }
      ctx.strokeStyle = color; ctx.lineWidth = t; drawFn(ctx);
    };
    const lines = () => {
      const draws = (c) => {
        c.beginPath();
        c.moveTo(cx, cy - gap); c.lineTo(cx, cy - gap - len);
        c.moveTo(cx, cy + gap); c.lineTo(cx, cy + gap + len);
        c.moveTo(cx - gap, cy); c.lineTo(cx - gap - len, cy);
        c.moveTo(cx + gap, cy); c.lineTo(cx + gap + len, cy);
        c.stroke();
      };
      stroke(draws);
    };
    const ring = () => {
      const draws = (c) => { c.beginPath(); c.arc(cx, cy, len, 0, Math.PI * 2); c.stroke(); };
      stroke(draws);
    };

    if (shape === 'cross' || shape === 'combo') lines();
    if (shape === 'circle' || shape === 'combo') ring();

    if (dot || shape === 'dot') {
      if (outline) { ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.beginPath(); ctx.arc(cx, cy, dotSize + 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, dotSize, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [cfg]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    draw(cv.getContext('2d'), cv.width, cv.height);
  }, [draw]);

  const exportPNG = () => {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    draw(cv.getContext('2d'), 128, 128);
    cv.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'reticule.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, 'image/png');
  };

  return (
    <div className="cg">
      <style>{`
        .cg{color:#eaf2fb;max-width:980px;margin:0 auto}
        .cg h1{font-size:1.5rem;margin:0 0 4px}
        .cg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .cg-grid{display:grid;grid-template-columns:340px 1fr;gap:18px}
        .cg-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .cg-row{margin-bottom:14px}
        .cg-row label{display:block;font-size:.82rem;color:#bcd0e8;margin-bottom:6px}
        .cg-row .val{float:right;color:#ffae3b;font-weight:700}
        .cg input[type=range]{accent-color:#ff8a3b;width:100%}
        .cg select,.cg input[type=color]{width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#eaf2fb;padding:8px}
        .cg input[type=color]{height:40px;padding:3px;cursor:pointer}
        .cg-presets{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
        .cg-chip{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:7px 12px;font-size:.82rem;cursor:pointer}
        .cg-chip:hover{background:rgba(91,157,255,.25);border-color:rgba(91,157,255,.5)}
        .cg-toggle{display:flex;align-items:center;gap:10px;font-size:.88rem;cursor:pointer;user-select:none}
        .cg-toggle input{width:18px;height:18px;accent-color:#ff8a3b}
        .cg-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.92rem}
        .cg-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .cg-canvas-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
        .cg canvas{border-radius:14px;border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 30px rgba(0,0,0,.4);width:100%;max-width:380px;image-rendering:pixelated}
        @media(max-width:760px){.cg-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {goBack && <button className="cg-btn ghost" onClick={goBack}>← Retour</button>}
        <h1>🎯 Concepteur de réticule FPS</h1>
      </div>
      <p className="sub">Crée ton viseur, aperçu en direct, puis exporte un PNG. 100 % local, rien n'est envoyé.</p>

      <div className="cg-grid">
        <div className="cg-pane">
          <div className="cg-presets">
            {Object.keys(PRESETS).map((n) => (
              <button key={n} className="cg-chip" onClick={() => setCfg(PRESETS[n])}>{n}</button>
            ))}
          </div>

          <div className="cg-row">
            <label>Forme</label>
            <select value={cfg.shape} onChange={(e) => set('shape', e.target.value)}>
              <option value="cross">Croix</option>
              <option value="dot">Point</option>
              <option value="circle">Cercle</option>
              <option value="combo">Combiné (croix + cercle)</option>
            </select>
          </div>
          <div className="cg-row">
            <label>Épaisseur <span className="val">{cfg.thickness}px</span></label>
            <input type="range" min="1" max="8" value={cfg.thickness} onChange={(e) => set('thickness', +e.target.value)} />
          </div>
          <div className="cg-row">
            <label>{cfg.shape === 'circle' || cfg.shape === 'combo' ? 'Rayon / longueur' : 'Longueur'} <span className="val">{cfg.length}px</span></label>
            <input type="range" min="1" max="40" value={cfg.length} onChange={(e) => set('length', +e.target.value)} />
          </div>
          <div className="cg-row">
            <label>Espacement (gap) <span className="val">{cfg.gap}px</span></label>
            <input type="range" min="0" max="30" value={cfg.gap} onChange={(e) => set('gap', +e.target.value)} />
          </div>
          <div className="cg-row">
            <label>Opacité <span className="val">{Math.round(cfg.opacity * 100)}%</span></label>
            <input type="range" min="0.1" max="1" step="0.05" value={cfg.opacity} onChange={(e) => set('opacity', +e.target.value)} />
          </div>
          <div className="cg-row">
            <label>Couleur</label>
            <input type="color" value={cfg.color} onChange={(e) => set('color', e.target.value)} />
          </div>
          <div className="cg-row">
            <label className="cg-toggle"><input type="checkbox" checked={cfg.outline} onChange={(e) => set('outline', e.target.checked)} /> Contour noir</label>
          </div>
          <div className="cg-row">
            <label className="cg-toggle"><input type="checkbox" checked={cfg.dot} onChange={(e) => set('dot', e.target.checked)} /> Point central</label>
          </div>
          {(cfg.dot || cfg.shape === 'dot') && (
            <div className="cg-row">
              <label>Taille du point <span className="val">{cfg.dotSize}px</span></label>
              <input type="range" min="1" max="10" value={cfg.dotSize} onChange={(e) => set('dotSize', +e.target.value)} />
            </div>
          )}
        </div>

        <div className="cg-pane cg-canvas-wrap">
          <canvas ref={canvasRef} width="380" height="300" />
          <button className="cg-btn" onClick={exportPNG}>⬇ Exporter en PNG (128×128)</button>
        </div>
      </div>
    </div>
  );
}
