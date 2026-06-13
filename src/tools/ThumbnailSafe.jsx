import React, { useState, useRef, useEffect } from 'react';

/**
 * ThumbnailSafe — visualiseur de zones sûres pour vignettes (16:9).
 * Importe une image (ou choisis un fond uni), superpose les guides « titre sûr »,
 * la zone du badge de durée et les zones de texte recommandées. Ajoute un titre
 * d'aperçu et exporte le tout en PNG. 100 % local, aucun réseau.
 */

const W = 1280, H = 720; // base 16:9

const PLATFORMS = {
  youtube: {
    label: 'YouTube',
    titleSafe: 0.05,           // marge intérieure « titre sûr »
    badge: { w: 0.10, h: 0.085 }, // badge durée (coin bas-droit), proportion
    textZone: { x: 0.04, y: 0.52, w: 0.62, h: 0.40 },
  },
  reseaux: {
    label: 'Réseaux',
    titleSafe: 0.08,
    badge: { w: 0.0, h: 0.0 },
    textZone: { x: 0.06, y: 0.10, w: 0.88, h: 0.46 },
  },
};

export default function ThumbnailSafe({ goBack }) {
  const [img, setImg] = useState(null);     // HTMLImageElement
  const [bg, setBg] = useState('#13294b');  // fond uni si pas d'image
  const [platform, setPlatform] = useState('youtube');
  const [title, setTitle] = useState('TON TITRE ICI');
  const [showGuides, setShowGuides] = useState(true);
  const [titleColor, setTitleColor] = useState('#ffffff');
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const loadFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); };
    im.src = url;
  };

  const draw = (withGuides) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    cv.width = W; cv.height = H;
    // fond
    if (img) {
      const r = Math.max(W / img.width, H / img.height);
      const dw = img.width * r, dh = img.height * r;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    }
    // titre d'aperçu
    if (title.trim()) {
      ctx.font = '900 92px Arial, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(0,0,0,.85)';
      ctx.fillStyle = titleColor;
      const x = W * 0.05, y = H * 0.92;
      ctx.strokeText(title, x, y);
      ctx.fillText(title, x, y);
    }
    if (!withGuides) return;
    const p = PLATFORMS[platform];
    // marge titre sûr
    const m = p.titleSafe;
    ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.strokeStyle = 'rgba(91,157,255,.95)';
    ctx.strokeRect(W * m, H * m, W * (1 - 2 * m), H * (1 - 2 * m));
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(91,157,255,.95)';
    ctx.font = '600 22px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('Zone « titre sûr »', W * m + 8, H * m + 8);
    // badge durée
    if (p.badge.w > 0) {
      const bw = W * p.badge.w, bh = H * p.badge.h;
      const bx = W - bw - W * 0.018, by = H - bh - H * 0.03;
      ctx.fillStyle = 'rgba(255,122,24,.30)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#ff7a18'; ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#ffae3b';
      ctx.font = '600 20px Arial';
      ctx.fillText('badge durée', bx + 6, by + 6);
    }
    // zone texte recommandée
    const t = p.textZone;
    ctx.fillStyle = 'rgba(255,174,59,.14)';
    ctx.fillRect(W * t.x, H * t.y, W * t.w, H * t.h);
    ctx.strokeStyle = 'rgba(255,174,59,.85)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(W * t.x, H * t.y, W * t.w, H * t.h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,174,59,.95)';
    ctx.font = '600 22px Arial';
    ctx.fillText('Zone de texte recommandée', W * t.x + 8, H * t.y + 8);
  };

  useEffect(() => { draw(showGuides); }, [img, bg, platform, title, showGuides, titleColor]);

  const exportPNG = (withGuides) => {
    draw(withGuides);
    const cv = canvasRef.current;
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vignette-${platform}${withGuides ? '-guides' : ''}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      draw(showGuides);
    }, 'image/png');
  };

  return (
    <div className="tsafe">
      <style>{`
        .tsafe{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .tsafe h1{font-size:1.55rem;margin:0 0 4px}
        .tsafe .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .tsafe-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
        .tsafe-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .tsafe-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .tsafe-btn.on{outline:2px solid #5b9dff}
        .tsafe-field{display:flex;flex-direction:column;gap:4px;font-size:.8rem;color:#9fb6cf}
        .tsafe input[type=text]{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:8px;padding:9px 11px;font-size:.95rem;min-width:220px}
        .tsafe-prev{border:1px solid rgba(255,255,255,.14);border-radius:14px;overflow:hidden;background:#0a1628}
        .tsafe-prev canvas{display:block;width:100%;height:auto}
        .tsafe-toggle{display:flex;align-items:center;gap:8px;font-size:.9rem;cursor:pointer}
        @media(max-width:760px){.tsafe input[type=text]{min-width:140px}}
      `}</style>

      <h1>🖼️ Zones sûres de vignette</h1>
      <p className="sub">Importe une image 16:9 (ou un fond uni), visualise les guides, ajoute un titre et exporte en PNG. 100 % local.</p>

      <div className="tsafe-row">
        <button className="tsafe-btn" onClick={() => fileRef.current?.click()}>＋ Importer une image</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
               onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }} />
        {img && <button className="tsafe-btn ghost" onClick={() => setImg(null)}>Retirer l'image</button>}
        {!img && (
          <label className="tsafe-field">Fond uni
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
          </label>
        )}
        {Object.entries(PLATFORMS).map(([k, v]) => (
          <button key={k} className={`tsafe-btn ghost ${platform === k ? 'on' : ''}`} onClick={() => setPlatform(k)}>{v.label}</button>
        ))}
      </div>

      <div className="tsafe-row">
        <label className="tsafe-field">Titre d'aperçu
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Texte du titre" />
        </label>
        <label className="tsafe-field">Couleur titre
          <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
        </label>
        <label className="tsafe-toggle">
          <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} /> Afficher les guides
        </label>
      </div>

      <div className="tsafe-prev">
        <canvas ref={canvasRef} />
      </div>

      <div className="tsafe-row" style={{ marginTop: 14 }}>
        <button className="tsafe-btn" onClick={() => exportPNG(false)}>⬇ Export PNG (sans guides)</button>
        <button className="tsafe-btn ghost" onClick={() => exportPNG(true)}>⬇ Export PNG (avec guides)</button>
        {goBack && <button className="tsafe-btn ghost" onClick={goBack}>← Retour</button>}
      </div>
    </div>
  );
}
