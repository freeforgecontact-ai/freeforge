import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ChromaRemover — détourage par chroma key 100 % local & hors-ligne.
 * Importe une image, choisis une couleur clé (pipette en cliquant sur l'image
 * ou sélecteur) et une tolérance : les pixels proches deviennent transparents.
 * Aperçu sur damier, export PNG transparent. Tout se passe dans le navigateur.
 */

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 255, b: 0 };
};
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

export default function ChromaRemover({ goBack }) {
  const [img, setImg] = useState(null); // HTMLImageElement
  const [key, setKey] = useState('#00ff00');
  const [tol, setTol] = useState(90);
  const [pick, setPick] = useState(false);
  const fileRef = useRef(null);
  const srcCanvas = useRef(null); // image source (jamais modifiée)
  const outCanvas = useRef(null); // rendu transparent affiché

  const onFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); URL.revokeObjectURL(url); };
    im.src = url;
  };

  // prépare le canvas source quand l'image change
  useEffect(() => {
    if (!img || !srcCanvas.current) return;
    const max = 700;
    const ratio = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    srcCanvas.current.width = w; srcCanvas.current.height = h;
    outCanvas.current.width = w; outCanvas.current.height = h;
    srcCanvas.current.getContext('2d').drawImage(img, 0, 0, w, h);
  }, [img]);

  const render = useCallback(() => {
    const s = srcCanvas.current, o = outCanvas.current;
    if (!img || !s || !o) return;
    const sctx = s.getContext('2d');
    const octx = o.getContext('2d');
    const w = s.width, h = s.height;
    const id = sctx.getImageData(0, 0, w, h);
    const d = id.data;
    const { r: kr, g: kg, b: kb } = hexToRgb(key);
    const thr = tol * 3; // distance Manhattan max (0..765)
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.abs(d[i] - kr) + Math.abs(d[i + 1] - kg) + Math.abs(d[i + 2] - kb);
      if (dist <= thr) d[i + 3] = 0;
    }
    octx.clearRect(0, 0, w, h);
    octx.putImageData(id, 0, 0);
  }, [img, key, tol]);

  useEffect(() => { render(); }, [render]);

  const onCanvasClick = (e) => {
    if (!pick || !srcCanvas.current) return;
    const s = srcCanvas.current;
    const rect = s.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (s.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (s.height / rect.height));
    const p = s.getContext('2d').getImageData(x, y, 1, 1).data;
    setKey(toHex(p[0], p[1], p[2]));
    setPick(false);
  };

  const exportPng = () => {
    if (!outCanvas.current) return;
    outCanvas.current.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'detourage.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };

  return (
    <div className="chr">
      <style>{`
        .chr{color:#eaf2fb;max-width:980px;margin:0 auto}
        .chr h1{font-size:1.6rem;margin:0 0 4px}
        .chr .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .chr-top{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .chr-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .chr-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .chr-btn.on{outline:2px solid #5b9dff}
        .chr-drop{border:2px dashed rgba(91,157,255,.45);border-radius:16px;padding:40px 16px;text-align:center;color:#9fb6cf;cursor:pointer;background:rgba(255,255,255,.04)}
        .chr-drop:hover{border-color:#5b9dff;background:rgba(91,157,255,.08)}
        .chr-grid{display:grid;grid-template-columns:1fr 280px;gap:18px;align-items:start}
        .chr-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}
        .chr-stage{border-radius:12px;overflow:hidden;display:flex;justify-content:center;
          background-color:#cfd6df;
          background-image:linear-gradient(45deg,#a9b2bd 25%,transparent 25%),linear-gradient(-45deg,#a9b2bd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#a9b2bd 75%),linear-gradient(-45deg,transparent 75%,#a9b2bd 75%);
          background-size:22px 22px;background-position:0 0,0 11px,11px -11px,-11px 0}
        .chr-canvas{max-width:100%;height:auto;display:block}
        .chr-canvas.pick{cursor:crosshair}
        .chr-lbl{font-size:.82rem;color:#9fb6cf;margin:10px 0 4px;display:flex;justify-content:space-between}
        .chr input[type=range]{accent-color:#ff8a3b;width:100%}
        .chr-key{display:flex;align-items:center;gap:10px;margin-bottom:6px}
        .chr-key input[type=color]{width:46px;height:38px;border:none;background:none;border-radius:8px;cursor:pointer;padding:0}
        .chr-swatch{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem}
        .chr-hint{font-size:.78rem;color:#9fb6cf;margin-top:8px}
        @media(max-width:760px){.chr-grid{grid-template-columns:1fr}}
      `}</style>

      <h1>✂️ Détourage par chroma key</h1>
      <p className="sub">Rends un fond uni transparent et exporte un PNG. 100 % local — rien n'est envoyé sur Internet.</p>

      <div className="chr-top">
        <button className="chr-btn" onClick={() => fileRef.current?.click()}>＋ Importer une image</button>
        {img && <button className="chr-btn" onClick={exportPng}>⬇ Exporter PNG transparent</button>}
        {goBack && <button className="chr-btn ghost" onClick={goBack}>← Retour</button>}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
               onChange={(e) => { onFile(e.target.files[0]); e.target.value = ''; }} />
      </div>

      {/* canvas source toujours monté (caché) pour l'échantillonnage des pixels */}
      <canvas ref={srcCanvas} style={{ display: 'none' }} />

      {!img ? (
        <div className="chr-drop"
             onClick={() => fileRef.current?.click()}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          Glisse-dépose une image (idéalement sur fond uni) ici, ou clique pour explorer.
        </div>
      ) : (
        <div className="chr-grid">
          <div className="chr-pane">
            <div className="chr-stage">
              <canvas ref={outCanvas} className={`chr-canvas ${pick ? 'pick' : ''}`} onClick={onCanvasClick} />
            </div>
            <div className="chr-hint">
              {pick ? 'Clique sur la couleur à rendre transparente.' : 'Aperçu sur damier : les zones grises sont transparentes.'}
            </div>
          </div>

          <div className="chr-pane">
            <div className="chr-lbl"><span>Couleur clé</span></div>
            <div className="chr-key">
              <input type="color" value={key} onChange={(e) => setKey(e.target.value)} />
              <span className="chr-swatch">{key.toUpperCase()}</span>
            </div>
            <button className={`chr-btn ghost ${pick ? 'on' : ''}`} style={{ width: '100%' }}
                    onClick={() => setPick((p) => !p)}>
              {pick ? '🎯 Pipette active…' : '💧 Pipette (cliquer l\'image)'}
            </button>

            <div className="chr-lbl"><span>Tolérance</span><span>{tol}</span></div>
            <input type="range" min="0" max="200" value={tol} onChange={(e) => setTol(Number(e.target.value))} />
            <div className="chr-hint">Augmente la tolérance pour effacer davantage de nuances proches de la couleur clé.</div>
          </div>
        </div>
      )}
    </div>
  );
}
