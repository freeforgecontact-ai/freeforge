import React, { useState, useEffect } from 'react';

/**
 * MealPrep — planificateur de menu hebdomadaire + liste de courses, 100 % local & hors-ligne.
 * Grille 7 jours x 3 repas (déjeuner / dîner / souper). On crée des plats (avec ingrédients),
 * on les assigne aux cases. La liste de courses agrège automatiquement tous les ingrédients
 * des plats planifiés. Tout est mémorisé dans le navigateur (localStorage). Aucun réseau.
 */

const LS_KEY = 'mealprep_v1';
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEALS = ['Déjeuner', 'Dîner', 'Souper'];

const load = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrompu : on ignore */ }
  return null;
};

export default function MealPrep({ goBack }) {
  const init = load();
  const [dishes, setDishes] = useState(init?.dishes || []); // {id,name,ing:[...]}
  const [plan, setPlan] = useState(init?.plan || {});       // {"0_1": dishId}
  const [name, setName] = useState('');
  const [ing, setIng] = useState('');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ dishes, plan })); }
    catch (e) { /* quota/file:// : on ignore */ }
  }, [dishes, plan]);

  const addDish = () => {
    const nm = name.trim();
    if (!nm) return;
    const list = ing.split(',').map((s) => s.trim()).filter(Boolean);
    setDishes((d) => [...d, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: nm, ing: list }]);
    setName(''); setIng('');
  };
  const delDish = (id) => {
    setDishes((d) => d.filter((x) => x.id !== id));
    setPlan((p) => {
      const c = { ...p };
      Object.keys(c).forEach((k) => { if (c[k] === id) delete c[k]; });
      return c;
    });
  };
  const assign = (day, meal, id) => {
    const key = `${day}_${meal}`;
    setPlan((p) => {
      const c = { ...p };
      if (id) c[key] = id; else delete c[key];
      return c;
    });
  };
  const clearWeek = () => { if (window.confirm('Vider tout le planning de la semaine ?')) setPlan({}); };

  // ---- liste de courses agrégée ----
  const shopping = (() => {
    const counts = {};
    Object.values(plan).forEach((id) => {
      const d = dishes.find((x) => x.id === id);
      if (!d) return;
      d.ing.forEach((it) => {
        const key = it.toLowerCase();
        counts[key] = counts[key] || { label: it, n: 0 };
        counts[key].n += 1;
      });
    });
    return Object.values(counts).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  })();

  const dishById = (id) => dishes.find((x) => x.id === id);

  return (
    <div className="mlp">
      <style>{`
        .mlp{color:#eaf2fb;max-width:1100px;margin:0 auto}
        .mlp h1{font-size:1.6rem;margin:0 0 4px}
        .mlp .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px;line-height:1.45}
        .mlp .back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:7px 13px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .mlp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:18px}
        .mlp h2{font-size:1.05rem;margin:0 0 12px}
        .mlp input[type=text]{background:rgba(10,22,40,.7);color:#eaf2fb;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 12px;font-size:.9rem;font-family:inherit}
        .mlp-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.88rem}
        .mlp-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .mlp-form{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
        .mlp-form .fld{display:flex;flex-direction:column;gap:5px}
        .mlp-form label{font-size:.78rem;color:#9fb6cf;font-weight:600}
        .mlp-dishes{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
        .mlp-chip{background:rgba(91,157,255,.16);border:1px solid rgba(91,157,255,.4);border-radius:20px;padding:6px 12px;font-size:.84rem;display:flex;align-items:center;gap:8px}
        .mlp-chip small{color:#9fb6cf}
        .mlp-chip .x{cursor:pointer;opacity:.6;font-weight:700}
        .mlp-chip .x:hover{opacity:1;color:#ff9a9a}
        .mlp-grid{overflow-x:auto}
        .mlp-grid table{border-collapse:collapse;width:100%;min-width:640px}
        .mlp-grid th,.mlp-grid td{border:1px solid rgba(255,255,255,.1);padding:7px;text-align:center;vertical-align:middle}
        .mlp-grid th{background:rgba(255,255,255,.06);font-size:.82rem;color:#cfe0f3}
        .mlp-grid td.day{background:rgba(255,255,255,.04);font-weight:700;font-size:.84rem;white-space:nowrap}
        .mlp-grid select{width:100%;background:rgba(10,22,40,.7);color:#eaf2fb;border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px;font-size:.8rem;font-family:inherit}
        .mlp-grid select.filled{border-color:rgba(255,174,59,.55);background:rgba(255,122,24,.1)}
        .mlp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
        .mlp-shop{list-style:none;padding:0;margin:0;columns:2;column-gap:24px}
        .mlp-shop li{break-inside:avoid;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.9rem;display:flex;justify-content:space-between;gap:8px}
        .mlp-shop li .n{color:#ffd27a;font-weight:700;font-size:.8rem}
        .mlp-empty{color:#9fb6cf;font-size:.9rem;padding:10px 0}
        @media(max-width:760px){.mlp-shop{columns:1}.mlp-form .fld{flex:1;min-width:140px}}
      `}</style>

      {goBack && <button className="back" onClick={goBack}>← Retour</button>}
      <h1>🍽️ Menu de la semaine</h1>
      <p className="sub">Crée tes plats avec leurs ingrédients, assigne-les aux repas, puis génère ta liste de courses agrégée. Tout reste sur ton appareil.</p>

      <div className="mlp-card">
        <h2>➕ Ajouter un plat</h2>
        <div className="mlp-form">
          <div className="fld">
            <label>Nom du plat</label>
            <input type="text" value={name} placeholder="ex. Poulet curry" onChange={(e) => setName(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') addDish(); }} />
          </div>
          <div className="fld" style={{ flex: 1, minWidth: 220 }}>
            <label>Ingrédients (séparés par des virgules)</label>
            <input type="text" value={ing} placeholder="poulet, riz, lait de coco, curry" onChange={(e) => setIng(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') addDish(); }} />
          </div>
          <button className="mlp-btn" onClick={addDish}>Ajouter</button>
        </div>
        <div className="mlp-dishes">
          {dishes.length === 0 && <span className="mlp-empty">Aucun plat. Ajoute ton premier plat ci-dessus.</span>}
          {dishes.map((d) => (
            <span key={d.id} className="mlp-chip" title={d.ing.join(', ')}>
              {d.name} <small>({d.ing.length} ingr.)</small>
              <span className="x" onClick={() => delDish(d.id)}>✕</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mlp-actions">
        <button className="mlp-btn" onClick={() => setShowList((v) => !v)}>🛒 {showList ? 'Masquer' : 'Voir'} la liste de courses</button>
        <button className="mlp-btn ghost" onClick={clearWeek}>🗑️ Vider la semaine</button>
      </div>

      {showList && (
        <div className="mlp-card">
          <h2>🛒 Liste de courses ({shopping.length})</h2>
          {shopping.length === 0 ? (
            <div className="mlp-empty">Assigne des plats au planning pour générer la liste.</div>
          ) : (
            <ul className="mlp-shop">
              {shopping.map((it) => (
                <li key={it.label}><span>{it.label}</span>{it.n > 1 && <span className="n">×{it.n}</span>}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mlp-card">
        <h2>📅 Planning</h2>
        <div className="mlp-grid">
          <table>
            <thead>
              <tr><th></th>{MEALS.map((m) => <th key={m}>{m}</th>)}</tr>
            </thead>
            <tbody>
              {DAYS.map((day, di) => (
                <tr key={day}>
                  <td className="day">{day}</td>
                  {MEALS.map((meal, mi) => {
                    const val = plan[`${di}_${mi}`] || '';
                    return (
                      <td key={meal}>
                        <select className={val ? 'filled' : ''} value={val} onChange={(e) => assign(di, mi, e.target.value)}>
                          <option value="">—</option>
                          {dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
