import React, { useState, useMemo } from 'react';

/**
 * CoteRGpa — calculateur de moyenne pondérée, GPA /4.3 et estimation de Cote R (CRC)
 * pour le Québec. 100 % local & hors-ligne. La Cote R réelle dépend de données
 * confidentielles du ministère ; ce module fournit une ESTIMATION pédagogique
 * (z-score + IFG simplifié), à ne pas confondre avec la cote officielle.
 */

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

// Barème GPA québécois simplifié (/4.3) selon la note en %.
function noteToGpa(p) {
  if (p >= 90) return 4.3;
  if (p >= 85) return 4.0;
  if (p >= 80) return 3.7;
  if (p >= 77) return 3.3;
  if (p >= 73) return 3.0;
  if (p >= 70) return 2.7;
  if (p >= 65) return 2.3;
  if (p >= 60) return 2.0;
  if (p >= 57) return 1.7;
  if (p >= 54) return 1.3;
  if (p >= 50) return 1.0;
  return 0;
}

export default function CoteRGpa({ goBack }) {
  const [cours, setCours] = useState([
    { id: uid(), nom: 'Cours 1', note: '', unites: '3', moy: '', et: '' },
  ]);
  // IFG : indicateur de force du groupe (1.0 = moyen). Sert d'ajustement global.
  const [ifg, setIfg] = useState('1.0');

  const add = () => setCours((c) => [...c, { id: uid(), nom: `Cours ${c.length + 1}`, note: '', unites: '3', moy: '', et: '' }]);
  const del = (id) => setCours((c) => (c.length > 1 ? c.filter((x) => x.id !== id) : c));
  const upd = (id, k, v) => setCours((c) => c.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const r = useMemo(() => {
    let sumNote = 0, sumU = 0, sumGpa = 0, sumCRC = 0, sumUcrc = 0;
    const lignes = cours.map((co) => {
      const note = parseFloat(co.note);
      const u = parseFloat(co.unites);
      const moy = parseFloat(co.moy);
      const et = parseFloat(co.et);
      const ok = isFinite(note) && isFinite(u) && u > 0;
      if (ok) { sumNote += note * u; sumU += u; sumGpa += noteToGpa(note) * u; }
      let z = null, crc = null;
      if (ok && isFinite(moy) && isFinite(et) && et > 0) {
        z = (note - moy) / et;
        const g = parseFloat(ifg);
        crc = (z + 5) * 5 + (isFinite(g) ? (g - 1) * 5 : 0);
        sumCRC += crc * u; sumUcrc += u;
      }
      return { ...co, z, crc, valide: ok };
    });
    return {
      lignes,
      moyenne: sumU > 0 ? sumNote / sumU : null,
      gpa: sumU > 0 ? sumGpa / sumU : null,
      unites: sumU,
      coteR: sumUcrc > 0 ? sumCRC / sumUcrc : null,
    };
  }, [cours, ifg]);

  const f = (v, d = 2) => (v == null || !isFinite(v) ? '—' : v.toFixed(d));

  return (
    <div className="crg">
      <style>{`
        .crg{color:#eaf2fb;max-width:920px;margin:0 auto}
        .crg h1{font-size:1.5rem;margin:0 0 4px}
        .crg .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .crg-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 13px;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .crg-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin-bottom:14px}
        .crg-row{display:grid;grid-template-columns:1.6fr .8fr .8fr 1fr 1fr .6fr auto;gap:8px;align-items:center;margin-bottom:8px}
        .crg-row.head{color:#9fb6cf;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
        .crg input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#eaf2fb;padding:8px;font-size:.9rem}
        .crg input:focus{outline:none;border-color:#5b9dff}
        .crg-mini{font-size:.78rem;color:#9cd1ff;text-align:center}
        .crg-x{background:none;border:none;color:#ff8a8a;font-size:1.05rem;cursor:pointer;opacity:.6}
        .crg-x:hover{opacity:1}
        .crg-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .crg-ifg{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:#9fb6cf;font-size:.85rem;margin-top:6px}
        .crg-ifg input{width:90px}
        .crg-res{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .crg-stat{background:rgba(91,157,255,.12);border:1px solid rgba(91,157,255,.3);border-radius:14px;padding:14px;text-align:center}
        .crg-stat .v{font-size:1.7rem;font-weight:800;color:#fff}
        .crg-stat .k{font-size:.78rem;color:#9fb6cf;margin-top:2px}
        .crg-stat.cr{background:linear-gradient(135deg,rgba(255,122,24,.22),rgba(255,174,59,.16));border-color:rgba(255,174,59,.5)}
        .crg-note{color:#ffd9a8;font-size:.78rem;margin-top:12px;line-height:1.45}
        @media(max-width:760px){
          .crg-row,.crg-row.head{grid-template-columns:1fr 1fr;gap:6px}
          .crg-row.head{display:none}
          .crg-row{border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;position:relative}
          .crg input{font-size:16px}
          .crg-res{grid-template-columns:repeat(2,1fr)}
        }
      `}</style>

      {goBack && <button className="crg-back" onClick={goBack}>← Retour</button>}
      <h1>🎓 Cote R, GPA & moyenne pondérée</h1>
      <p className="sub">Saisis tes cours pour estimer ta moyenne pondérée, ton GPA /4.3 et une <b>estimation</b> de Cote R (CRC). 100 % local, rien n'est envoyé.</p>

      <div className="crg-card">
        <div className="crg-row head">
          <span>Cours</span><span>Note %</span><span>Unités</span><span>Moy. groupe</span><span>Écart-type</span><span>z / CRC</span><span></span>
        </div>
        {r.lignes.map((co) => (
          <div className="crg-row" key={co.id}>
            <input value={co.nom} placeholder="Nom du cours" onChange={(e) => upd(co.id, 'nom', e.target.value)} />
            <input value={co.note} type="number" inputMode="decimal" placeholder="ex: 84" onChange={(e) => upd(co.id, 'note', e.target.value)} />
            <input value={co.unites} type="number" inputMode="decimal" placeholder="3" onChange={(e) => upd(co.id, 'unites', e.target.value)} />
            <input value={co.moy} type="number" inputMode="decimal" placeholder="opt." onChange={(e) => upd(co.id, 'moy', e.target.value)} />
            <input value={co.et} type="number" inputMode="decimal" placeholder="opt." onChange={(e) => upd(co.id, 'et', e.target.value)} />
            <span className="crg-mini">{co.z != null ? `z ${f(co.z)} · ${f(co.crc, 1)}` : '—'}</span>
            <button className="crg-x" title="Supprimer" onClick={() => del(co.id)}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <button className="crg-btn" onClick={add}>＋ Ajouter un cours</button>
          <div className="crg-ifg">
            <label>IFG (force du groupe, 1.0 = moyen) :</label>
            <input value={ifg} type="number" inputMode="decimal" step="0.05" onChange={(e) => setIfg(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="crg-res">
        <div className="crg-stat"><div className="v">{f(r.moyenne, 1)}{r.moyenne != null ? '%' : ''}</div><div className="k">Moyenne pondérée</div></div>
        <div className="crg-stat"><div className="v">{f(r.gpa)}</div><div className="k">GPA /4.3</div></div>
        <div className="crg-stat"><div className="v">{f(r.unites, 0)}</div><div className="k">Unités totales</div></div>
        <div className="crg-stat cr"><div className="v">{f(r.coteR, 1)}</div><div className="k">Cote R (estimation)</div></div>
      </div>

      <p className="crg-note">
        ⚠️ <b>Estimation seulement.</b> La Cote R officielle (CRC) du BCI utilise la moyenne et l'écart-type réels de chaque groupe ainsi que l'IFG calculé par le ministère, données non publiques. Renseigne « Moy. groupe » et « Écart-type » pour obtenir une estimation par cours ; sinon ces cours sont ignorés dans le calcul de Cote R. Le GPA suit un barème québécois simplifié /4.3.
      </p>
    </div>
  );
}
