import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * PhotoCompress — optimiseur de photos pour les RÉSEAUX SOCIAUX (100 % local).
 * Importe une image, choisis un préréglage de plateforme (Instagram carré,
 * Story, Facebook lien, miniature YouTube…) : l'image est recadrée « cover »
 * puis redimensionnée au ratio/format exact via canvas, avec un curseur de
 * qualité JPEG. Aperçu + téléchargement (toBlob). Aucun envoi sur Internet.
 */

const PRESETS = [
  { id: 'ig_square', label: 'Instagram — Carré', w: 1080, h: 1080, icon: '⬛' },
  { id: 'ig_portrait', label: 'Instagram — Portrait', w: 1080, h: 1350, icon: '🖼' },
  { id: 'ig_story', label: 'Story / Reel', w: 1080, h: 1920, icon: '📱' },
  { id: 'fb_link', label: 'Facebook — Lien', w: 1200, h: 630, icon: '🔗' },
  { id: 'fb_cover', label: 'Facebook — Couverture', w: 1640, h: 624, icon: '🏞' },
  { id: 'x_post', label: 'X / Twitter — Post', w: 1600, h: 900, icon: '🐦' },
  { id: 'yt_thumb', label: 'YouTube — Miniature', w: 1280, h: 720, icon: '▶' },
  { id: 'li_post', label: 'LinkedIn — Post', w: 1200, h: 1200, icon: '💼' },
];
const fmtSize = (b) => { if (!b) return '0 Ko'; const k = 1024, u = ['o', 'Ko', 'Mo']; const i = Math.floor(Math.log(b) / Math.log(k)); return (b / Math.pow(k, i)).toFixed(1) + ' ' + u[i]; };

export default function PhotoCompress({ goBack }) {
  const [src, setSrc] = useState(null);        // {img, name, size}
  const [presetId, setPresetId] = useState('ig_square');
  const [quality, setQuality] = useState(85);
  const [preview, setPreview] = useState(null); // dataURL
  const [outSize, setOutSize] = useState(0);
  const fileRef = useRef(null);
  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setSrc({ img, name: file.name, size: file.size }); URL.revokeObjectURL(url); };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  // ---- rendu canvas : recadrage "cover" centré + redimension au format ----
  const render = useCallback(() => {
    if (!src) { setPreview(null); setOutSize(0); return; }
    const { w, h } = preset;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const { naturalWidth: iw, naturalHeight: ih } = src.img;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (w - dw) / 2, dy = (h - dh) / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src.img, dx, dy, dw, dh);
    cv.toBlob((blob) => {
      if (!blob) return;
      setOutSize(blob.size);
      const r = new FileReader();
      r.onload = () => setPreview(r.result);
      r.readAsDataURL(blob);
    }, 'image/jpeg', quality / 100);
  }, [src, preset, quality]);

  useEffect(() => { render(); }, [render]);

  const download = () => {
    if (!src) return;
    const { w, h } = preset;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const { naturalWidth: iw, naturalHeight: ih } = src.img;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src.img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    cv.toBlob((blob) => {
      if (!blob) return;
      const base = src.name.replace(/\.[^.]+$/, '') || 'photo';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${base}_${preset.id}_${w}x${h}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/jpeg', quality / 100);
  };

  const onDrop = (e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0]); };

  return (
    <div className="pcz">
      <style>{`
        .pcz{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .pcz h1{font-size:1.55rem;margin:0 0 4px}
        .pcz .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .pcz-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
        .pcz-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .pcz-btn:hover{filter:brightness(1.06)}
        .pcz-btn:disabled{opacity:.5;cursor:not-allowed}
        .pcz-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .pcz-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
        .pcz-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .pcz-drop{border:2px dashed rgba(91,157,255,.5);border-radius:14px;padding:26px 14px;text-align:center;cursor:pointer;color:#9fb6cf;transition:.15s}
        .pcz-drop:hover{background:rgba(91,157,255,.08);border-color:#5b9dff}
        .pcz-presets{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
        .pcz-pre{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);border-radius:10px;padding:9px 10px;cursor:pointer;font-size:.85rem}
        .pcz-pre.on{background:rgba(91,157,255,.22);border-color:#5b9dff}
        .pcz-pre small{display:block;color:#9fb6cf;font-size:.72rem}
        .pcz-q label{display:flex;justify-content:space-between;font-size:.85rem;font-weight:600;margin-bottom:6px}
        .pcz input[type=range]{accent-color:#ff8a3b;width:100%}
        .pcz-prev{background:rgba(10,22,40,.55);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:12px}
        .pcz-frame{max-width:100%;display:flex;justify-content:center}
        .pcz-frame img{max-width:100%;max-height:380px;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.4)}
        .pcz-meta{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;font-size:.82rem;color:#9fb6cf}
        .pcz-meta b{color:#ffae3b}
        .pcz-empty{color:#9fb6cf;text-align:center;padding:50px 10px;font-size:.9rem}
        @media(max-width:760px){.pcz-grid{grid-template-columns:1fr}.pcz-presets{grid-template-columns:1fr}}
      `}</style>

      <div className="pcz-top">
        {goBack && <button className="pcz-btn ghost" onClick={goBack}>← Retour</button>}
      </div>

      <h1>📸 Photos pour réseaux sociaux</h1>
      <p className="sub">Recadre et compresse au format exact de chaque plateforme. Traitement 100 % local, aucune image envoyée.</p>

      <div className="pcz-grid">
        <div className="pcz-card">
          <div className="pcz-drop" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🖼</div>
            <div style={{ fontWeight: 600, color: '#eaf2fb' }}>{src ? src.name : 'Importer une image'}</div>
            <div style={{ fontSize: '.8rem' }}>Glisse-dépose ou clique pour choisir</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                   onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }} />
          </div>

          <div style={{ fontSize: '.85rem', fontWeight: 600, marginTop: 14 }}>Préréglage de plateforme</div>
          <div className="pcz-presets">
            {PRESETS.map((p) => (
              <div key={p.id} className={`pcz-pre ${p.id === presetId ? 'on' : ''}`} onClick={() => setPresetId(p.id)}>
                <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                <span>{p.label}<small>{p.w} × {p.h}</small></span>
              </div>
            ))}
          </div>

          <div className="pcz-q">
            <label><span>Qualité JPEG</span><span>{quality}%</span></label>
            <input type="range" min="40" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} />
          </div>

          <button className="pcz-btn" style={{ width: '100%', marginTop: 14 }} disabled={!src} onClick={download}>
            ⬇ Télécharger ({preset.w}×{preset.h})
          </button>
        </div>

        <div className="pcz-card">
          {preview ? (
            <div className="pcz-prev">
              <div className="pcz-frame"><img src={preview} alt="aperçu" style={{ aspectRatio: `${preset.w} / ${preset.h}` }} /></div>
              <div className="pcz-meta">
                <span>Format : <b>{preset.w}×{preset.h}</b></span>
                {src && <span>Original : <b>{fmtSize(src.size)}</b></span>}
                <span>Optimisé : <b>{fmtSize(outSize)}</b></span>
              </div>
            </div>
          ) : (
            <div className="pcz-empty">Importe une image pour voir l'aperçu recadré au format choisi.</div>
          )}
        </div>
      </div>
    </div>
  );
}
