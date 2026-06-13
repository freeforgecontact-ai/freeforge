import React, { useState, useEffect, useRef } from 'react';

/**
 * EmergencyCard — générateur de fiche d'urgence médicale 100 % local.
 * Saisis tes infos vitales (nom, groupe sanguin, allergies, médicaments,
 * conditions, contacts) et obtiens une carte format portefeuille à imprimer
 * (window.print, contrôles masqués à l'impression) ou à exporter en PNG.
 * Données mémorisées uniquement dans ce navigateur. Aucun envoi réseau.
 */

const LS_KEY = 'ff_emergency_card_v1';
const BLANK = {
  name: '', birth: '', blood: '', allergies: '', meds: '',
  conditions: '', contact1: '', contact2: '', doctor: '', notes: '',
};

export default function EmergencyCard({ goBack }) {
  const [f, setF] = useState(BLANK);
  const cardRef = useRef(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setF({ ...BLANK, ...JSON.parse(raw) }); } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(f)); } catch (e) { /* ignore */ }
  }, [f]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const clearAll = () => { if (window.confirm('Effacer toute la fiche ?')) setF(BLANK); };

  const exportPNG = () => {
    const card = cardRef.current;
    if (!card) return;
    const W = 1012, H = 638; // ~85.6×54mm @300dpi (format carte de crédit)
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    // fond
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b91c1c'; ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Arial'; ctx.textBaseline = 'middle';
    ctx.fillText('✚  URGENCE MÉDICALE', 28, 50);

    const line = (label, val, y, color = '#111827') => {
      ctx.font = 'bold 24px Arial'; ctx.fillStyle = '#b91c1c';
      ctx.textBaseline = 'top'; ctx.fillText(label, 28, y);
      ctx.font = '26px Arial'; ctx.fillStyle = color;
      const text = (val || '—');
      // retour à la ligne simple
      const maxW = W - 56; let yy = y + 28; let words = text.split(' '); let cur = '';
      words.forEach((w) => {
        const t = cur ? cur + ' ' + w : w;
        if (ctx.measureText(t).width > maxW) { ctx.fillText(cur, 28, yy); yy += 30; cur = w; }
        else cur = t;
      });
      ctx.fillText(cur, 28, yy);
      return yy + 40;
    };

    let y = 120;
    ctx.font = 'bold 34px Arial'; ctx.fillStyle = '#111827'; ctx.fillText(f.name || 'Nom Prénom', 28, y); y += 48;
    if (f.birth) { ctx.font = '22px Arial'; ctx.fillStyle = '#374151'; ctx.fillText('Naissance : ' + f.birth, 28, y); y += 34; }
    y = line('GROUPE SANGUIN', f.blood, y, '#b91c1c');
    y = line('ALLERGIES', f.allergies, y);
    y = line('MÉDICAMENTS', f.meds, y);
    y = line('CONDITIONS', f.conditions, y);
    y = line('CONTACTS URGENCE', [f.contact1, f.contact2].filter(Boolean).join('  •  '), y);
    if (f.doctor) y = line('MÉDECIN', f.doctor, y);

    const url = cv.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = 'fiche_urgence.png'; a.click();
  };

  const rows = [
    ['Groupe sanguin', f.blood], ['Allergies', f.allergies], ['Médicaments', f.meds],
    ['Conditions médicales', f.conditions], ['Contacts d\'urgence', [f.contact1, f.contact2].filter(Boolean).join(' • ')],
    ['Médecin traitant', f.doctor], ['Notes', f.notes],
  ];

  return (
    <div className="emc">
      <style>{`
        .emc{color:#eaf2fb;max-width:980px;margin:0 auto}
        .emc h1{font-size:1.55rem;margin:0 0 4px}
        .emc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .emc-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
        .emc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .emc-field{margin-bottom:11px}
        .emc-field label{display:block;font-size:.82rem;color:#9fb6cf;margin-bottom:4px}
        .emc input,.emc textarea{width:100%;background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:10px;padding:9px 11px;font-size:.9rem;box-sizing:border-box;font-family:inherit}
        .emc input:focus,.emc textarea:focus{outline:none;border-color:#5b9dff}
        .emc textarea{resize:vertical;min-height:48px}
        .emc-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .emc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .emc-btn:hover{filter:brightness(1.06)}
        .emc-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .emc-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
        .emc-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
        /* ----- carte aperçu (imprimable) ----- */
        .emc-print{background:#fff;color:#111827;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.2);width:100%;max-width:430px}
        .emc-print .hd{background:#b91c1c;color:#fff;padding:10px 14px;font-weight:800;letter-spacing:.5px;font-size:1rem;display:flex;align-items:center;gap:8px}
        .emc-print .bd{padding:12px 14px}
        .emc-print .nm{font-size:1.2rem;font-weight:800;margin-bottom:2px}
        .emc-print .bt{color:#374151;font-size:.8rem;margin-bottom:8px}
        .emc-print .r{display:flex;gap:8px;padding:5px 0;border-top:1px solid #f0d3d3;font-size:.85rem}
        .emc-print .r b{color:#b91c1c;flex:0 0 38%;font-size:.78rem;text-transform:uppercase;letter-spacing:.3px}
        .emc-print .r span{flex:1;word-break:break-word}
        @media(max-width:760px){.emc-grid{grid-template-columns:1fr}}
        @media print{
          body *{visibility:hidden!important}
          .emc-print,.emc-print *{visibility:visible!important}
          .emc-print{position:absolute;left:0;top:0;max-width:none;width:340px;box-shadow:none;border:1px solid #b91c1c}
          .emc-noprint{display:none!important}
        }
      `}</style>

      <div className="emc-top emc-noprint">
        {goBack && <button className="emc-btn ghost" onClick={goBack}>← Retour</button>}
        <button className="emc-btn ghost" style={{ marginLeft: 'auto' }} onClick={clearAll}>Effacer</button>
      </div>

      <h1 className="emc-noprint">✚ Fiche d'urgence médicale</h1>
      <p className="sub emc-noprint">Garde l'essentiel sur toi : imprime au format portefeuille ou exporte en PNG. Tout reste sur ton appareil.</p>

      <div className="emc-grid">
        <div className="emc-card emc-noprint">
          <div className="emc-two">
            <div className="emc-field"><label>Nom complet</label><input value={f.name} onChange={set('name')} placeholder="Marie Dupont" /></div>
            <div className="emc-field"><label>Date de naissance</label><input value={f.birth} onChange={set('birth')} placeholder="1990-04-15" /></div>
          </div>
          <div className="emc-field"><label>Groupe sanguin</label><input value={f.blood} onChange={set('blood')} placeholder="O+ / A− …" /></div>
          <div className="emc-field"><label>Allergies</label><textarea value={f.allergies} onChange={set('allergies')} placeholder="Pénicilline, arachides…" /></div>
          <div className="emc-field"><label>Médicaments en cours</label><textarea value={f.meds} onChange={set('meds')} placeholder="Insuline, anticoagulants…" /></div>
          <div className="emc-field"><label>Conditions médicales</label><textarea value={f.conditions} onChange={set('conditions')} placeholder="Diabète type 1, asthme…" /></div>
          <div className="emc-two">
            <div className="emc-field"><label>Contact d'urgence 1</label><input value={f.contact1} onChange={set('contact1')} placeholder="Paul +1 514 000 0000" /></div>
            <div className="emc-field"><label>Contact d'urgence 2</label><input value={f.contact2} onChange={set('contact2')} placeholder="Sœur +1 ..." /></div>
          </div>
          <div className="emc-field"><label>Médecin traitant</label><input value={f.doctor} onChange={set('doctor')} placeholder="Dr Tremblay +1 ..." /></div>
          <div className="emc-field"><label>Notes</label><textarea value={f.notes} onChange={set('notes')} placeholder="Porteur de pacemaker, etc." /></div>
          <div className="emc-actions">
            <button className="emc-btn" onClick={() => window.print()}>🖨 Imprimer la carte</button>
            <button className="emc-btn ghost" onClick={exportPNG}>⬇ Exporter en PNG</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="emc-print" ref={cardRef}>
            <div className="hd">✚ URGENCE MÉDICALE</div>
            <div className="bd">
              <div className="nm">{f.name || 'Nom Prénom'}</div>
              {f.birth && <div className="bt">Né(e) le {f.birth}</div>}
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div className="r" key={k}><b>{k}</b><span>{v}</span></div>
              ))}
              {rows.every(([, v]) => !v) && <div className="bt">Remplis le formulaire pour générer la carte.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
