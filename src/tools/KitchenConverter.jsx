import React, { useState } from 'react';

/**
 * KitchenConverter — convertisseur de cuisine 100 % local & hors-ligne.
 * (a) Redimensionne une recette : liste d'ingrédients + quantités, multipliée
 *     par un facteur OU recalculée selon un nombre de portions.
 * (b) Conversions d'unités de volume/poids (tasse, ml, c. à thé, c. à soupe,
 *     g, oz) et de températures (°C / °F). Tables en dur. Aucun réseau.
 */

// vers ml (volume) — base de conversion approximative usuelle (Canada)
const VOL = { 'tasse': 250, 'ml': 1, 'c. à soupe': 15, 'c. à thé': 5, 'litre': 1000 };
// vers g (poids)
const POIDS = { 'g': 1, 'kg': 1000, 'oz': 28.3495, 'lb': 453.592 };

const round = (n) => Math.round(n * 1000) / 1000;

export default function KitchenConverter({ goBack }) {
  const [tab, setTab] = useState('recette'); // 'recette' | 'unites' | 'temp'

  // ---- (a) redimensionnement ----
  const [lignes, setLignes] = useState([
    { id: 1, nom: 'Farine', qte: '2', unite: 'tasse' },
    { id: 2, nom: 'Sucre', qte: '1', unite: 'tasse' },
    { id: 3, nom: 'Oeufs', qte: '3', unite: '' },
  ]);
  const [portBase, setPortBase] = useState('4');
  const [portCible, setPortCible] = useState('8');
  const facteur = (parseFloat(portCible) || 0) / (parseFloat(portBase) || 1);

  const setLigne = (id, champ, val) => setLignes((l) => l.map((x) => x.id === id ? { ...x, [champ]: val } : x));
  const addLigne = () => setLignes((l) => [...l, { id: Date.now(), nom: '', qte: '1', unite: '' }]);
  const delLigne = (id) => setLignes((l) => l.filter((x) => x.id !== id));

  // ---- (b) conversion unités ----
  const [uVal, setUVal] = useState('1');
  const [uFrom, setUFrom] = useState('tasse');
  const [uTo, setUTo] = useState('ml');
  const tableFrom = VOL[uFrom] !== undefined ? VOL : POIDS;
  const tableTo = VOL[uTo] !== undefined ? VOL : POIDS;
  const memeType = tableFrom === tableTo;
  const uResult = memeType ? round((parseFloat(uVal) || 0) * tableFrom[uFrom] / tableTo[uTo]) : null;

  // ---- (b) température ----
  const [tVal, setTVal] = useState('180');
  const [tFrom, setTFrom] = useState('C');
  const tResult = tFrom === 'C'
    ? round((parseFloat(tVal) || 0) * 9 / 5 + 32)
    : round(((parseFloat(tVal) || 0) - 32) * 5 / 9);

  const Tab = ({ id, label }) => (
    <button className={`kc-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
  );

  return (
    <div className="kc">
      <style>{`
        .kc{color:#eaf2fb;max-width:880px;margin:0 auto}
        .kc h1{font-size:1.6rem;margin:0 0 4px}
        .kc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .kc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .kc-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
        .kc-tab{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.88rem}
        .kc-tab.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none}
        .kc-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .kc input,.kc select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:9px 10px;font-size:.92rem}
        .kc select option{color:#0a1628}
        .kc-fac{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}
        .kc-fld{display:flex;flex-direction:column;gap:4px}
        .kc-fld label{font-size:.78rem;color:#9fb6cf}
        .kc-fld input{width:90px}
        .kc-facbadge{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.5);border-radius:10px;padding:9px 12px;font-weight:700;font-size:.9rem}
        .kc-line{display:grid;grid-template-columns:1fr 70px 110px auto auto;gap:8px;align-items:center;margin-bottom:8px}
        .kc-line .res{font-weight:800;color:#ffae3b;text-align:right;font-size:.95rem}
        .kc-x{background:none;border:none;color:#9fb6cf;cursor:pointer;font-size:1rem}
        .kc-x:hover{color:#ff8a8a}
        .kc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.88rem;margin-top:8px}
        .kc-conv{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
        .kc-out{margin-top:16px;background:linear-gradient(135deg,rgba(255,122,24,.12),rgba(255,174,59,.12));border:1px solid rgba(255,174,59,.3);border-radius:12px;padding:14px;font-size:1.25rem;font-weight:800}
        .kc-warn{color:#ffd9a3;font-size:.85rem;margin-top:12px}
        @media(max-width:760px){.kc-line{grid-template-columns:1fr 60px 100px;}.kc-line .res{grid-column:1/-1;text-align:left}.kc-line .kc-x{grid-column:1/-1;justify-self:start}}
      `}</style>

      {goBack && <button className="kc-back" onClick={goBack}>← Retour</button>}
      <h1>🥄 Convertisseur de cuisine</h1>
      <p className="sub">Redimensionne tes recettes et convertis tes unités. 100 % hors-ligne.</p>

      <div className="kc-tabs">
        <Tab id="recette" label="📐 Redimensionner" />
        <Tab id="unites" label="🧪 Unités" />
        <Tab id="temp" label="🌡️ Température" />
      </div>

      {tab === 'recette' && (
        <div className="kc-pane">
          <div className="kc-fac">
            <div className="kc-fld"><label>Portions d'origine</label><input type="number" min="1" value={portBase} onChange={(e) => setPortBase(e.target.value)} /></div>
            <div className="kc-fld"><label>Portions voulues</label><input type="number" min="1" value={portCible} onChange={(e) => setPortCible(e.target.value)} /></div>
            <div className="kc-facbadge">×{round(facteur) || '—'}</div>
          </div>
          {lignes.map((l) => (
            <div key={l.id} className="kc-line">
              <input type="text" placeholder="Ingrédient" value={l.nom} onChange={(e) => setLigne(l.id, 'nom', e.target.value)} />
              <input type="number" min="0" step="0.01" value={l.qte} onChange={(e) => setLigne(l.id, 'qte', e.target.value)} />
              <input type="text" placeholder="unité" value={l.unite} onChange={(e) => setLigne(l.id, 'unite', e.target.value)} />
              <span className="res">{round((parseFloat(l.qte) || 0) * facteur)} {l.unite}</span>
              <button className="kc-x" onClick={() => delLigne(l.id)} title="Supprimer">✕</button>
            </div>
          ))}
          <button className="kc-btn" onClick={addLigne}>＋ Ajouter un ingrédient</button>
        </div>
      )}

      {tab === 'unites' && (
        <div className="kc-pane">
          <div className="kc-conv">
            <div className="kc-fld"><label>Quantité</label><input type="number" step="0.01" value={uVal} onChange={(e) => setUVal(e.target.value)} style={{ width: 110 }} /></div>
            <div className="kc-fld"><label>De</label>
              <select value={uFrom} onChange={(e) => setUFrom(e.target.value)}>
                {[...Object.keys(VOL), ...Object.keys(POIDS)].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="kc-fld"><label>Vers</label>
              <select value={uTo} onChange={(e) => setUTo(e.target.value)}>
                {[...Object.keys(VOL), ...Object.keys(POIDS)].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {memeType
            ? <div className="kc-out">{parseFloat(uVal) || 0} {uFrom} = {uResult} {uTo}</div>
            : <p className="kc-warn">⚠️ Conversion volume ↔ poids impossible sans densité (ça dépend de l'ingrédient). Choisis deux unités du même type.</p>}
          <p className="kc-warn">Valeurs usuelles : 1 tasse ≈ 250 ml, 1 c. à soupe = 15 ml, 1 c. à thé = 5 ml, 1 oz ≈ 28,35 g.</p>
        </div>
      )}

      {tab === 'temp' && (
        <div className="kc-pane">
          <div className="kc-conv">
            <div className="kc-fld"><label>Température</label><input type="number" step="1" value={tVal} onChange={(e) => setTVal(e.target.value)} style={{ width: 120 }} /></div>
            <div className="kc-fld"><label>Unité d'entrée</label>
              <select value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </div>
          </div>
          <div className="kc-out">{parseFloat(tVal) || 0} °{tFrom} = {tResult} °{tFrom === 'C' ? 'F' : 'C'}</div>
          <p className="kc-warn">Four courant : 180 °C = 350 °F · 200 °C = 400 °F · 220 °C = 425 °F.</p>
        </div>
      )}
    </div>
  );
}
