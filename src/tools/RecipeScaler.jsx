import React, { useState, useEffect, useMemo } from 'react';

/**
 * RecipeScaler — ajusteur de portions de recette + liste d'épicerie.
 * Saisis tes ingrédients (quantité, unité, nom) et le nombre de portions d'origine,
 * choisis le nombre de portions voulu : toutes les quantités sont recalculées.
 * Génère ensuite une liste d'épicerie cochable. 100 % local, hors-ligne.
 */

const LS_KEY = 'ff_recipescaler_v1';
const fmtQty = (n) => {
  if (!isFinite(n)) return '0';
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r).replace('.', ',');
};

export default function RecipeScaler({ goBack }) {
  const [ingredients, setIngredients] = useState([]); // {id, qty, unit, name}
  const [baseServings, setBaseServings] = useState(4);
  const [targetServings, setTargetServings] = useState(4);
  const [checked, setChecked] = useState({}); // {id:true}
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.ingredients)) setIngredients(d.ingredients);
        if (d.baseServings) setBaseServings(d.baseServings);
        if (d.targetServings) setTargetServings(d.targetServings);
        if (d.checked) setChecked(d.checked);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ingredients, baseServings, targetServings, checked }));
    } catch (e) { /* ignore */ }
  }, [ingredients, baseServings, targetServings, checked]);

  const factor = useMemo(() => {
    const b = Number(baseServings) || 1;
    const t = Number(targetServings) || 0;
    return t / b;
  }, [baseServings, targetServings]);

  const addIngredient = () => {
    const q = parseFloat(String(qty).replace(',', '.'));
    const nm = name.trim();
    if (!nm || !isFinite(q) || q <= 0) return;
    setIngredients((prev) => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, qty: q, unit: unit.trim(), name: nm }]);
    setQty(''); setUnit(''); setName('');
  };
  const removeIngredient = (id) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setChecked((c) => { const n = { ...c }; delete n[id]; return n; });
  };
  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const resetChecks = () => setChecked({});

  return (
    <div className="rsc">
      <style>{`
        .rsc{color:#eaf2fb;max-width:880px;margin:0 auto}
        .rsc h1{font-size:1.6rem;margin:0 0 4px}
        .rsc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .rsc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px;font-size:.85rem}
        .rsc-back:hover{background:rgba(255,255,255,.14)}
        .rsc-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .rsc-pane h2{font-size:1.05rem;margin:0 0 12px;color:#cfe0f5}
        .rsc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
        .rsc-fld{display:flex;flex-direction:column;gap:4px}
        .rsc-fld label{font-size:.75rem;color:#9fb6cf}
        .rsc input{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:9px 10px;color:#eaf2fb;font-size:.9rem}
        .rsc input:focus{outline:none;border-color:#5b9dff}
        .rsc-serv{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
        .rsc-serv .rsc-fld input{width:80px}
        .rsc-badge{background:rgba(91,157,255,.2);border:1px solid rgba(91,157,255,.5);border-radius:9px;padding:8px 12px;font-weight:700;font-size:.9rem}
        .rsc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .rsc-btn:hover{filter:brightness(1.06)}
        .rsc-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .rsc-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:rgba(10,22,40,.4);margin-bottom:7px}
        .rsc-item.done{opacity:.55}
        .rsc-item .scaled{font-weight:700;color:#ffae3b;min-width:96px}
        .rsc-item .orig{font-size:.75rem;color:#7f97b4}
        .rsc-item .nm{flex:1;min-width:0}
        .rsc-item.done .nm{text-decoration:line-through}
        .rsc-x{opacity:.5;cursor:pointer;font-size:.85rem;background:none;border:none;color:#ff8a8a}
        .rsc-x:hover{opacity:1}
        .rsc-chk{width:20px;height:20px;accent-color:#ff8a3b;cursor:pointer}
        .rsc-empty{color:#9fb6cf;text-align:center;padding:24px 10px;font-size:.9rem}
        @media(max-width:760px){.rsc-item .scaled{min-width:78px}.rsc-row{flex-direction:column;align-items:stretch}.rsc-row input{width:100%!important}}
      `}</style>

      {goBack && <button className="rsc-back" onClick={goBack}>← Retour</button>}
      <h1>🍲 Ajusteur de portions</h1>
      <p className="sub">Recalcule les quantités de ta recette selon le nombre de convives, puis coche ta liste d'épicerie. 100 % hors-ligne.</p>

      <div className="rsc-pane">
        <h2>Portions</h2>
        <div className="rsc-serv">
          <div className="rsc-fld">
            <label>Portions d'origine</label>
            <input type="number" min="1" value={baseServings} onChange={(e) => setBaseServings(e.target.value)} />
          </div>
          <span style={{ fontSize: '1.3rem', color: '#7f97b4' }}>→</span>
          <div className="rsc-fld">
            <label>Portions voulues</label>
            <input type="number" min="1" value={targetServings} onChange={(e) => setTargetServings(e.target.value)} />
          </div>
          <span className="rsc-badge">× {fmtQty(factor)}</span>
        </div>
      </div>

      <div className="rsc-pane">
        <h2>Ajouter un ingrédient</h2>
        <div className="rsc-row">
          <div className="rsc-fld" style={{ flex: '0 0 90px' }}>
            <label>Quantité</label>
            <input type="text" inputMode="decimal" placeholder="200" value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIngredient()} />
          </div>
          <div className="rsc-fld" style={{ flex: '0 0 90px' }}>
            <label>Unité</label>
            <input type="text" placeholder="g" value={unit} onChange={(e) => setUnit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIngredient()} />
          </div>
          <div className="rsc-fld" style={{ flex: '1 1 160px' }}>
            <label>Ingrédient</label>
            <input type="text" placeholder="farine" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIngredient()} />
          </div>
          <button className="rsc-btn" onClick={addIngredient}>＋ Ajouter</button>
        </div>
      </div>

      <div className="rsc-pane">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Liste d'épicerie ajustée</span>
          {ingredients.length > 0 && <button className="rsc-btn ghost" style={{ padding: '6px 12px', fontSize: '.8rem' }} onClick={resetChecks}>Décocher tout</button>}
        </h2>
        {ingredients.length === 0 ? (
          <div className="rsc-empty">Aucun ingrédient. Ajoute-en un ci-dessus pour commencer.</div>
        ) : ingredients.map((i) => {
          const scaled = i.qty * factor;
          return (
            <div key={i.id} className={`rsc-item ${checked[i.id] ? 'done' : ''}`}>
              <input className="rsc-chk" type="checkbox" checked={!!checked[i.id]} onChange={() => toggle(i.id)} />
              <span className="scaled">{fmtQty(scaled)} {i.unit}</span>
              <span className="nm">
                {i.name}
                <br /><span className="orig">(base : {fmtQty(i.qty)} {i.unit})</span>
              </span>
              <button className="rsc-x" title="Retirer" onClick={() => removeIngredient(i.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
