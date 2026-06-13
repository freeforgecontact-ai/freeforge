import React, { useState, useRef } from 'react';

/**
 * GreetingCard — concepteur de carte de vœux / invitation, 100 % local & hors-ligne.
 * Champs (occasion, titre, message), couleurs de fond/texte, emoji décoratif,
 * aperçu en direct et export PNG via <canvas> (toBlob -> téléchargement).
 * Aucun réseau, aucune donnée envoyée.
 */

const OCCASIONS = ['Anniversaire', 'Mariage', 'Fête', 'Merci', 'Félicitations', 'Invitation', 'Bonne année', 'Naissance'];
const EMOJIS = ['🎉', '🎂', '💐', '❤️', '🥳', '✨', '🎁', '🌟', '🍰', '🎈', '💌', '🕊️'];
const BGS = ['#1b2a4a', '#7a1f3d', '#1f5a4a', '#5a3a1f', '#3a2a5a', '#0f3b5a'];

export default function GreetingCard({ goBack }) {
  const [occasion, setOccasion] = useState('Anniversaire');
  const [title, setTitle] = useState('Joyeux anniversaire !');
  const [message, setMessage] = useState('Que cette journée t’apporte joie, bonheur et plein de belles surprises. 🎈');
  const [bg, setBg] = useState('#1b2a4a');
  const [fg, setFg] = useState('#ffffff');
  const [emoji, setEmoji] = useState('🎂');
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  // Découpe un texte sur plusieurs lignes selon une largeur max (pixels).
  const wrap = (ctx, text, maxW) => {
    const lines = [];
    text.split('\n').forEach((para) => {
      let line = '';
      para.split(' ').forEach((word) => {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
        else line = test;
      });
      lines.push(line);
    });
    return lines;
  };

  const exportPNG = () => {
    setBusy(true);
    try {
      const W = 1000, H = 700, S = 2; // S = supersampling pour un rendu net
      const c = document.createElement('canvas');
      c.width = W * S; c.height = H * S;
      const ctx = c.getContext('2d');
      ctx.scale(S, S);

      // Fond + léger dégradé
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, bg);
      grad.addColorStop(1, shade(bg, -22));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Cadre intérieur
      ctx.strokeStyle = hexA(fg, 0.45);
      ctx.lineWidth = 3;
      ctx.strokeRect(34, 34, W - 68, H - 68);

      ctx.textAlign = 'center';
      ctx.fillStyle = fg;

      // Emoji décoratif
      ctx.font = '110px serif';
      ctx.fillText(emoji, W / 2, 190);

      // Occasion (sur-titre)
      ctx.font = '600 26px system-ui, sans-serif';
      ctx.fillStyle = hexA(fg, 0.8);
      ctx.fillText((occasion || '').toUpperCase(), W / 2, 250);

      // Titre
      ctx.fillStyle = fg;
      ctx.font = '800 56px Georgia, serif';
      wrap(ctx, title || '', W - 160).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, 330 + i * 64));

      // Message
      ctx.font = '400 30px system-ui, sans-serif';
      ctx.fillStyle = hexA(fg, 0.92);
      const msgLines = wrap(ctx, message || '', W - 200).slice(0, 6);
      const startY = 470;
      msgLines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * 40));

      c.toBlob((blob) => {
        if (!blob) { setBusy(false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carte-${(occasion || 'voeux').toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setBusy(false);
      }, 'image/png');
    } catch (e) { setBusy(false); }
  };

  return (
    <div className="gcard">
      <style>{`
        .gcard{color:#eaf2fb;max-width:1000px;margin:0 auto;font-family:inherit}
        .gcard h1{font-size:1.55rem;margin:0 0 4px}
        .gcard .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .gcard-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .gcard-grid{display:grid;grid-template-columns:340px 1fr;gap:20px;align-items:start}
        .gcard-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .gcard-lbl{font-size:.8rem;color:#9fb6cf;font-weight:600;display:block;margin:14px 0 6px}
        .gcard-lbl:first-child{margin-top:0}
        .gcard-in,.gcard-ta,.gcard-sel{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#eaf2fb;padding:10px 12px;font-size:.92rem;outline:none;font-family:inherit}
        .gcard-in:focus,.gcard-ta:focus{border-color:#5b9dff}
        .gcard-ta{resize:vertical;min-height:80px}
        .gcard-emojis{display:flex;flex-wrap:wrap;gap:6px}
        .gcard-emoji{font-size:1.3rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:9px;width:40px;height:40px;cursor:pointer;line-height:1}
        .gcard-emoji.on{border-color:#ffae3b;background:rgba(255,174,59,.2)}
        .gcard-colors{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .gcard-sw{width:30px;height:30px;border-radius:8px;border:2px solid rgba(255,255,255,.3);cursor:pointer;padding:0}
        .gcard-sw.on{border-color:#fff;box-shadow:0 0 0 2px #ffae3b}
        .gcard-color-in{width:42px;height:34px;border:none;background:none;cursor:pointer;padding:0}
        .gcard-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:11px;padding:13px;font-weight:800;cursor:pointer;font-size:.95rem;width:100%;margin-top:18px}
        .gcard-btn:disabled{opacity:.6;cursor:default}
        .gcard-preview{aspect-ratio:10/7;border-radius:16px;padding:6%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.4);overflow:hidden}
        .gcard-frame{border:2px solid;border-radius:8px;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5%;box-sizing:border-box}
        .gcard-emoji-big{font-size:clamp(2.6rem,8vw,4.4rem);line-height:1;margin-bottom:.3em}
        .gcard-occ{font-size:clamp(.7rem,2.2vw,1rem);letter-spacing:2px;font-weight:700;opacity:.85;margin-bottom:.5em}
        .gcard-title{font-family:Georgia,serif;font-weight:800;font-size:clamp(1.3rem,4.6vw,2.4rem);margin:0 0 .4em;line-height:1.1;word-break:break-word}
        .gcard-msg{font-size:clamp(.85rem,2.6vw,1.25rem);line-height:1.4;opacity:.92;word-break:break-word;white-space:pre-wrap}
        @media(max-width:760px){.gcard-grid{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="gcard-back" onClick={goBack}>← Retour</button>}
      <h1>💌 Carte de vœux & invitation</h1>
      <p className="sub">Conçois ta carte, vois l'aperçu en direct, puis exporte-la en PNG. 100 % hors-ligne.</p>

      <div className="gcard-grid">
        <div className="gcard-pane">
          <label className="gcard-lbl">Occasion</label>
          <select className="gcard-sel" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
            {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <label className="gcard-lbl">Titre</label>
          <input className="gcard-in" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />

          <label className="gcard-lbl">Message</label>
          <textarea className="gcard-ta" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={260} />

          <label className="gcard-lbl">Emoji décoratif</label>
          <div className="gcard-emojis">
            {EMOJIS.map((e) => (
              <button key={e} className={`gcard-emoji ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>

          <label className="gcard-lbl">Couleur de fond</label>
          <div className="gcard-colors">
            {BGS.map((c) => (
              <button key={c} className={`gcard-sw ${bg === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setBg(c)} />
            ))}
            <input className="gcard-color-in" type="color" value={bg} onChange={(e) => setBg(e.target.value)} title="Personnaliser le fond" />
          </div>

          <label className="gcard-lbl">Couleur du texte</label>
          <div className="gcard-colors">
            {['#ffffff', '#ffe9b0', '#ffd0d0', '#cfe2ff', '#1b1300'].map((c) => (
              <button key={c} className={`gcard-sw ${fg === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setFg(c)} />
            ))}
            <input className="gcard-color-in" type="color" value={fg} onChange={(e) => setFg(e.target.value)} title="Personnaliser le texte" />
          </div>

          <button className="gcard-btn" onClick={exportPNG} disabled={busy}>
            {busy ? 'Génération…' : '⬇ Exporter en PNG'}
          </button>
        </div>

        <div className="gcard-preview" ref={previewRef}
             style={{ background: `linear-gradient(160deg, ${bg}, ${shade(bg, -22)})`, color: fg }}>
          <div className="gcard-frame" style={{ borderColor: hexA(fg, 0.45) }}>
            <div className="gcard-emoji-big">{emoji}</div>
            <div className="gcard-occ">{(occasion || '').toUpperCase()}</div>
            <h2 className="gcard-title">{title || 'Votre titre'}</h2>
            <p className="gcard-msg">{message || 'Votre message apparaîtra ici.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- helpers couleur (hors-composant, purement locaux) ---
function clampByte(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function parseHex(hex) {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16) || 0, g: parseInt(h.slice(2, 4), 16) || 0, b: parseInt(h.slice(4, 6), 16) || 0 };
}
function shade(hex, pct) {
  const { r, g, b } = parseHex(hex);
  const f = pct / 100;
  return `rgb(${clampByte(r + r * f)}, ${clampByte(g + g * f)}, ${clampByte(b + b * f)})`;
}
function hexA(hex, a) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
