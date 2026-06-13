import React, { useState, useEffect, useMemo } from 'react';

/**
 * TravelChecklist — liste de bagages dynamique, 100 % locale & hors-ligne.
 * Indique la durée, la météo (chaud/froid/pluie) et le type de voyage
 * (plage/affaires/randonnée) : la liste s'adapte. Coche, ajoute tes articles,
 * suis ta progression. Tout est mémorisé dans le navigateur (localStorage).
 */

const LS_KEY = 'travelchecklist_v1';

const BASE = ['Passeport / pièce d\'identité', 'Téléphone + chargeur', 'Portefeuille / argent', 'Trousse de toilette', 'Brosse à dents', 'Médicaments perso', 'Écouteurs', 'Sous-vêtements', 'Chaussettes', 'Lunettes de soleil'];
const WEATHER = {
  chaud: ['Crème solaire', 'Chapeau / casquette', 'Short', 'T-shirts légers', 'Sandales', 'Gourde d\'eau'],
  froid: ['Manteau chaud', 'Bonnet & gants', 'Écharpe', 'Pull / polaire', 'Bottes', 'Sous-vêtements thermiques'],
  pluie: ['Imperméable / K-way', 'Parapluie', 'Chaussures étanches', 'Sac plastique étanche'],
};
const TYPE = {
  plage: ['Maillot de bain', 'Serviette de plage', 'Tongs', 'Masque & tuba', 'Ballon / jeux'],
  affaires: ['Tenue de bureau', 'Ordinateur portable', 'Cartes de visite', 'Chaussures de ville', 'Bloc-notes & stylo'],
  randonnée: ['Chaussures de marche', 'Sac à dos', 'Gourde / poche à eau', 'Lampe frontale', 'Trousse de secours', 'Bâtons de marche'],
};

export default function TravelChecklist({ goBack }) {
  const [days, setDays] = useState(5);
  const [weather, setWeather] = useState('chaud');
  const [type, setType] = useState('plage');
  const [checked, setChecked] = useState({}); // {item:true}
  const [extras, setExtras] = useState([]);   // articles perso
  const [custom, setCustom] = useState('');
  const [genId, setGenId] = useState(0);      // force re-génération

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.days) setDays(d.days);
        if (d.weather) setWeather(d.weather);
        if (d.type) setType(d.type);
        if (d.checked) setChecked(d.checked);
        if (Array.isArray(d.extras)) setExtras(d.extras);
      }
    } catch (e) { /* indisponible : on ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ days, weather, type, checked, extras })); }
    catch (e) { /* quota : on ignore */ }
  }, [days, weather, type, checked, extras]);

  const list = useMemo(() => {
    const n = Math.max(1, Number(days) || 1);
    const items = [...BASE];
    items.push(`${Math.max(2, Math.ceil(n * 1.1))} hauts (t-shirts/chemises)`);
    items.push(`${Math.max(1, Math.ceil(n / 2))} pantalons / bas`);
    if (n >= 4) items.push('Lessive en feuille / sac à linge sale');
    if (n >= 7) items.push('Trousse de premiers soins complète');
    WEATHER[weather].forEach((i) => items.push(i));
    TYPE[type].forEach((i) => items.push(i));
    return Array.from(new Set(items));
  }, [days, weather, type, genId]);

  const all = useMemo(() => [...list, ...extras], [list, extras]);
  const doneCount = all.filter((i) => checked[i]).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  const toggle = (i) => setChecked((c) => { const n = { ...c }; if (n[i]) delete n[i]; else n[i] = true; return n; });
  const addCustom = () => {
    const v = custom.trim(); if (!v || all.includes(v)) { setCustom(''); return; }
    setExtras((e) => [...e, v]); setCustom('');
  };
  const removeExtra = (i) => { setExtras((e) => e.filter((x) => x !== i)); setChecked((c) => { const n = { ...c }; delete n[i]; return n; }); };
  const reset = () => { setChecked({}); setGenId((g) => g + 1); };

  const SEG = (state, set, opts) => (
    <div className="tc-seg">
      {opts.map((o) => <button key={o} className={state === o ? 'on' : ''} onClick={() => set(o)}>{o}</button>)}
    </div>
  );

  return (
    <div className="tc">
      <style>{`
        .tc{color:#eaf2fb;max-width:880px;margin:0 auto;font-family:system-ui,sans-serif}
        .tc h1{font-size:1.55rem;margin:0 0 4px}
        .tc .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .tc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px}
        .tc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .tc-field{margin-bottom:13px}
        .tc-field label{display:block;font-size:.8rem;color:#9fb6cf;margin-bottom:6px;font-weight:600}
        .tc-field input[type=number]{width:110px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#eaf2fb;padding:10px;font-size:.95rem}
        .tc-seg{display:inline-flex;flex-wrap:wrap;gap:4px;background:rgba(0,0,0,.25);border-radius:10px;padding:4px}
        .tc-seg button{background:none;border:none;color:#9fb6cf;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem;text-transform:capitalize}
        .tc-seg button.on{background:rgba(255,174,59,.22);color:#ffae3b}
        .tc-row{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
        .tc-row input[type=text]{flex:1;min-width:170px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#eaf2fb;padding:11px;font-size:.92rem}
        .tc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .tc-ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:11px 16px;font-weight:600;cursor:pointer;font-size:.88rem}
        .tc-prog{height:12px;background:rgba(0,0,0,.3);border-radius:99px;overflow:hidden;margin:6px 0 4px}
        .tc-prog i{display:block;height:100%;background:linear-gradient(90deg,#ff7a18,#ffae3b);transition:width .25s}
        .tc-progtxt{font-size:.8rem;color:#9fb6cf}
        .tc-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:7px}
        .tc-item{display:flex;align-items:center;gap:9px;padding:9px 11px;background:rgba(0,0,0,.18);border-radius:10px;cursor:pointer;font-size:.9rem}
        .tc-item:hover{background:rgba(0,0,0,.28)}
        .tc-item.on{opacity:.55}
        .tc-item.on .lbl{text-decoration:line-through}
        .tc-box{width:20px;height:20px;flex:none;border-radius:6px;border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#10130a}
        .tc-item.on .tc-box{background:#46b07a;border-color:#46b07a}
        .tc-lbl{flex:1}
        .tc-x{background:none;border:none;color:#e8908f;cursor:pointer;opacity:.6;font-size:.85rem}
        .tc-x:hover{opacity:1}
        @media(max-width:760px){.tc-items{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="tc-back" onClick={goBack}>← Retour</button>}
      <h1>🧳 Liste de bagages</h1>
      <p className="sub">Règle ton voyage, la liste s'adapte. Coche au fur et à mesure. 🔒 Tout reste sur ton appareil.</p>

      <div className="tc-card">
        <div className="tc-field">
          <label>Durée du voyage (jours)</label>
          <input type="number" min="1" max="90" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div className="tc-field">
          <label>Météo prévue</label>
          {SEG(weather, setWeather, ['chaud', 'froid', 'pluie'])}
        </div>
        <div className="tc-field">
          <label>Type de voyage</label>
          {SEG(type, setType, ['plage', 'affaires', 'randonnée'])}
        </div>
        <button className="tc-ghost" onClick={reset}>↺ Régénérer la liste (décocher tout)</button>
      </div>

      <div className="tc-card">
        <div className="tc-row">
          <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ajouter un article perso"
                 onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
          <button className="tc-btn" onClick={addCustom}>＋ Ajouter</button>
        </div>

        <div className="tc-prog"><i style={{ width: `${pct}%` }} /></div>
        <div className="tc-progtxt">{doneCount} / {all.length} articles préparés · {pct}%</div>

        <div className="tc-items" style={{ marginTop: 14 }}>
          {all.map((i) => {
            const on = !!checked[i]; const isExtra = extras.includes(i);
            return (
              <div key={i} className={`tc-item ${on ? 'on' : ''}`}>
                <div onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
                  <span className="tc-box">{on ? '✓' : ''}</span>
                  <span className="tc-lbl">{i}{isExtra && ' ✦'}</span>
                </div>
                {isExtra && <button className="tc-x" onClick={() => removeExtra(i)} title="Supprimer">✕</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
