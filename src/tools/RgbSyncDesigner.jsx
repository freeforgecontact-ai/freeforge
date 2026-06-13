import React, { useState, useRef, useEffect } from 'react';

const EFFECTS = [
  { id: 'static', label: 'Statique' },
  { id: 'breathing', label: 'Respiration' },
  { id: 'wave', label: 'Vague' },
  { id: 'rainbow', label: 'Arc-en-ciel cyclique' },
];
const KEYS = 14;

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return { r: 255, g: 122, b: 24 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function hsl(h, s, l) { return `hsl(${((h % 360) + 360) % 360},${s}%,${l}%)`; }

export default function RgbSyncDesigner({ goBack }) {
  const [effect, setEffect] = useState('rainbow');
  const [color1, setColor1] = useState('#ff7a18');
  const [color2, setColor2] = useState('#5b9dff');
  const [speed, setSpeed] = useState(50);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ effect, color1, color2, speed });

  useEffect(() => { stateRef.current = { effect, color1, color2, speed }; }, [effect, color1, color2, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let start = performance.now();

    const draw = (now) => {
      const { effect: ef, color1: c1, color2: c2, speed: sp } = stateRef.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const t = (now - start) / 1000 * (0.2 + sp / 25);
      ctx.clearRect(0, 0, w, h);
      const pad = 10, gap = 6;
      const kw = (w - pad * 2 - gap * (KEYS - 1)) / KEYS;
      const kh = Math.min(h - pad * 2, kw * 1.4);
      const y = (h - kh) / 2;
      const a = hexToRgb(c1), b = hexToRgb(c2);

      for (let i = 0; i < KEYS; i++) {
        const x = pad + i * (kw + gap);
        let fill;
        if (ef === 'static') {
          fill = `rgb(${a.r},${a.g},${a.b})`;
        } else if (ef === 'breathing') {
          const p = (Math.sin(t * 1.5) + 1) / 2;
          fill = `rgb(${Math.round(a.r + (b.r - a.r) * p)},${Math.round(a.g + (b.g - a.g) * p)},${Math.round(a.b + (b.b - a.b) * p)})`;
        } else if (ef === 'wave') {
          const p = (Math.sin(t * 2 - i * 0.5) + 1) / 2;
          fill = `rgb(${Math.round(a.r + (b.r - a.r) * p)},${Math.round(a.g + (b.g - a.g) * p)},${Math.round(a.b + (b.b - a.b) * p)})`;
        } else {
          fill = hsl(t * 60 + i * (360 / KEYS), 90, 58);
        }
        ctx.shadowColor = fill; ctx.shadowBlur = 16;
        ctx.fillStyle = fill;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + kw, y, x + kw, y + kh, r);
        ctx.arcTo(x + kw, y + kh, x, y + kh, r);
        ctx.arcTo(x, y + kh, x, y, r);
        ctx.arcTo(x, y, x + kw, y, r);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,.14)';
        ctx.fillRect(x + 3, y + 3, kw - 6, kh * 0.32);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const exportConfig = () => {
    const cfg = {
      tool: 'RgbSyncDesigner', version: 1,
      effect, color1, color2, speed,
      keys: KEYS, exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rgb-effet-${effect}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const dual = effect === 'breathing' || effect === 'wave';
  const single = effect === 'static';

  return (
    <div className="rgb">
      <style>{`
        .rgb{color:#eaf2fb;max-width:920px;margin:0 auto}
        .rgb h1{font-size:1.6rem;margin:0 0 4px}
        .rgb .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .rgb-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .rgb-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .rgb-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .rgb-canvas{width:100%;height:130px;display:block;background:radial-gradient(circle at 50% 40%,rgba(20,40,70,.6),rgba(6,14,28,.9));border-radius:14px;border:1px solid rgba(255,255,255,.1)}
        .rgb-effects{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .rgb-chip{padding:8px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eaf2fb;cursor:pointer;font-size:.85rem}
        .rgb-chip.on{background:rgba(255,174,59,.25);border-color:rgba(255,174,59,.6)}
        .rgb-controls{display:flex;gap:18px;flex-wrap:wrap;align-items:center}
        .rgb-ctl{display:flex;flex-direction:column;gap:6px}
        .rgb-ctl label{font-size:.74rem;color:#9fb6cf;font-weight:600}
        .rgb input[type=color]{width:52px;height:38px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:none;cursor:pointer;padding:2px}
        .rgb input[type=range]{accent-color:#ff8a3b;width:180px}
        @media(max-width:760px){.rgb input[type=range]{width:140px}.rgb-btn{flex:1}}
      `}</style>

      {goBack && <button className="rgb-btn ghost" onClick={goBack} style={{ marginBottom: 14 }}>← Retour</button>}
      <h1>💡 Concepteur d'effet RGB</h1>
      <p className="sub">Conçois l'éclairage de ton clavier — aperçu animé local, aucune donnée envoyée.</p>

      <div className="rgb-pane">
        <canvas ref={canvasRef} className="rgb-canvas" />
      </div>

      <div className="rgb-pane">
        <div className="rgb-effects">
          {EFFECTS.map((e) => (
            <span key={e.id} className={`rgb-chip ${effect === e.id ? 'on' : ''}`} onClick={() => setEffect(e.id)}>{e.label}</span>
          ))}
        </div>

        <div className="rgb-controls">
          {!single ? (
            <>
              <div className="rgb-ctl">
                <label>{dual ? 'Couleur 1' : 'Couleur'}</label>
                <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)}
                       disabled={effect === 'rainbow'} style={{ opacity: effect === 'rainbow' ? 0.4 : 1 }} />
              </div>
              {dual && (
                <div className="rgb-ctl">
                  <label>Couleur 2</label>
                  <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} />
                </div>
              )}
            </>
          ) : (
            <div className="rgb-ctl">
              <label>Couleur</label>
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} />
            </div>
          )}
          <div className="rgb-ctl">
            <label>Vitesse : {speed}%</label>
            <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                   disabled={effect === 'static'} style={{ opacity: effect === 'static' ? 0.4 : 1 }} />
          </div>
          <div className="rgb-ctl" style={{ marginLeft: 'auto', justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button className="rgb-btn" onClick={exportConfig}>⬇ Exporter la config (JSON)</button>
          </div>
        </div>
      </div>
    </div>
  );
}
