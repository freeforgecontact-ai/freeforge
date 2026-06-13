import React, { useState, useRef, useCallback } from 'react';

/**
 * PaletteExtractor — extracteur de palette de couleurs 100 % local & hors-ligne.
 * Importe une image, la dessine sur un <canvas>, échantillonne les pixels et
 * quantifie les couleurs (regroupement par cubes) pour dégager les teintes
 * dominantes. Aucune connexion : tout le traitement se fait dans le navigateur.
 */

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();

export default function PaletteExtractor({ goBack }) {
  const [preview, setPreview] = useState(null);
  const [palette, setPalette] = useState([]);
  const [count, setCount] = useState(7);
  const [copied, setCopied] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const extract = useCallback((src, k) => {
    setBusy(true);
    const img = new Image();
    img.onload = () => {
      const max = 220;
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Quantification par cubes (bucket 32 -> 8 niveaux/canal), pondérée par fréquence.
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 125) continue; // ignore les pixels trop transparents
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        let e = buckets.get(key);
        if (!e) { e = { r: 0, g: 0, b: 0, n: 0 }; buckets.set(key, e); }
        e.r += r; e.g += g; e.b += b; e.n += 1;
      }
      const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
      const out = [];
      for (const c of sorted) {
        const r = Math.round(c.r / c.n), g = Math.round(c.g / c.n), b = Math.round(c.b / c.n);
        // évite les teintes quasi identiques déjà retenues
        if (out.some((o) => Math.abs(o.r - r) + Math.abs(o.g - g) + Math.abs(o.b - b) < 32)) continue;
        out.push({ r, g, b, hex: toHex(r, g, b) });
        if (out.length >= k) break;
      }
      setPalette(out);
      setBusy(false);
    };
    img.onerror = () => setBusy(false);
    img.src = src;
  }, []);

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    extract(url, count);
  };

  const copy = (hex) => {
    navigator.clipboard?.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1100);
    }).catch(() => {});
  };

  return (
    <div className="pex">
      <style>{`
        .pex{color:#eaf2fb;max-width:960px;margin:0 auto}
        .pex h1{font-size:1.6rem;margin:0 0 4px}
        .pex .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .pex-top{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
        .pex-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .pex-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .pex-drop{border:2px dashed rgba(91,157,255,.45);border-radius:16px;padding:34px 16px;text-align:center;color:#9fb6cf;cursor:pointer;background:rgba(255,255,255,.04)}
        .pex-drop:hover{border-color:#5b9dff;background:rgba(91,157,255,.08)}
        .pex-grid{display:grid;grid-template-columns:300px 1fr;gap:18px}
        .pex-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}
        .pex-img{width:100%;border-radius:12px;display:block;border:1px solid rgba(255,255,255,.14)}
        .pex-range{display:flex;align-items:center;gap:10px;font-size:.85rem;color:#9fb6cf;margin-top:12px}
        .pex input[type=range]{accent-color:#ff8a3b;flex:1}
        .pex-swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
        .pex-sw{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04)}
        .pex-chip{height:84px}
        .pex-meta{padding:9px 10px;display:flex;flex-direction:column;gap:4px}
        .pex-hex{font-weight:700;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.95rem;display:flex;align-items:center;justify-content:space-between;gap:6px}
        .pex-rgb{color:#9fb6cf;font-size:.78rem;font-family:ui-monospace,Menlo,Consolas,monospace}
        .pex-cp{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#eaf2fb;border-radius:7px;padding:3px 8px;font-size:.72rem;cursor:pointer}
        .pex-cp:hover{background:rgba(91,157,255,.3)}
        .pex-empty{text-align:center;color:#9fb6cf;padding:50px 10px;font-size:.92rem}
        @media(max-width:760px){.pex-grid{grid-template-columns:1fr}}
      `}</style>

      <h1>🎨 Extracteur de palette</h1>
      <p className="sub">Importe une image et obtiens ses couleurs dominantes. 100 % local — rien n'est envoyé sur Internet.</p>

      <div className="pex-top">
        <button className="pex-btn" onClick={() => fileRef.current?.click()}>＋ Importer une image</button>
        {goBack && <button className="pex-btn ghost" onClick={goBack}>← Retour</button>}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
               onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} />
      </div>

      {!preview ? (
        <div className="pex-drop"
             onClick={() => fileRef.current?.click()}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          Glisse-dépose une image ici, ou clique pour explorer tes fichiers.
        </div>
      ) : (
        <div className="pex-grid">
          <div className="pex-pane">
            <img className="pex-img" src={preview} alt="aperçu" />
            <div className="pex-range">
              <span>Couleurs : {count}</span>
              <input type="range" min="3" max="10" value={count}
                     onChange={(e) => { const k = Number(e.target.value); setCount(k); extract(preview, k); }} />
            </div>
          </div>

          <div className="pex-pane">
            {busy ? (
              <div className="pex-empty">Analyse des pixels…</div>
            ) : palette.length === 0 ? (
              <div className="pex-empty">Aucune couleur détectée.</div>
            ) : (
              <div className="pex-swatches">
                {palette.map((c) => (
                  <div key={c.hex} className="pex-sw">
                    <div className="pex-chip" style={{ background: c.hex }} />
                    <div className="pex-meta">
                      <div className="pex-hex">
                        <span>{c.hex}</span>
                        <button className="pex-cp" onClick={() => copy(c.hex)}>{copied === c.hex ? '✓' : 'Copier'}</button>
                      </div>
                      <div className="pex-rgb">rgb({c.r}, {c.g}, {c.b})</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
