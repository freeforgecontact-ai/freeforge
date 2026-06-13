import React, { useState, useEffect, useMemo } from 'react';

/**
 * FridgeScanner — scanner de frigo & suggestions de recettes, 100 % local.
 * L'utilisateur saisit ses ingrédients (garde-manger), l'app croise avec une
 * base de recettes québécoises/simples intégrée et propose ce qu'il peut cuisiner.
 * Signale aussi les recettes où il ne manque qu'un seul ingrédient.
 * Garde-manger mémorisé dans le navigateur (localStorage). Aucun réseau.
 */

const LS_KEY = 'fridgescanner_pantry_v1';

const norm = (s) => s.toLowerCase().trim()
  .normalize('NFD').replace(/[̀-ͯ]/g, '') // sans accents
  .replace(/s$/, ''); // pluriel naïf

const RECETTES = [
  { nom: 'Pâté chinois', emoji: '🥧', ingredients: ['boeuf haché', 'maïs', 'pomme de terre', 'oignon', 'beurre'] },
  { nom: 'Macaroni au fromage', emoji: '🧀', ingredients: ['macaroni', 'fromage', 'lait', 'beurre', 'farine'] },
  { nom: 'Soupe aux pois', emoji: '🍲', ingredients: ['pois jaunes', 'jambon', 'oignon', 'carotte', 'eau'] },
  { nom: 'Tourtière', emoji: '🥟', ingredients: ['porc haché', 'pomme de terre', 'oignon', 'pâte', 'clou de girofle'] },
  { nom: 'Omelette', emoji: '🍳', ingredients: ['oeuf', 'fromage', 'lait', 'beurre'] },
  { nom: 'Crêpes', emoji: '🥞', ingredients: ['farine', 'oeuf', 'lait', 'beurre', 'sirop d\'érable'] },
  { nom: 'Spaghetti sauce à la viande', emoji: '🍝', ingredients: ['spaghetti', 'boeuf haché', 'tomate', 'oignon', 'ail'] },
  { nom: 'Grilled cheese', emoji: '🥪', ingredients: ['pain', 'fromage', 'beurre'] },
  { nom: 'Salade de pâtes', emoji: '🥗', ingredients: ['macaroni', 'poivron', 'mayonnaise', 'oignon', 'maïs'] },
  { nom: 'Galette de sarrasin', emoji: '🫓', ingredients: ['farine de sarrasin', 'eau', 'sel', 'oeuf'] },
  { nom: 'Poutine maison', emoji: '🍟', ingredients: ['pomme de terre', 'fromage', 'sauce brune'] },
  { nom: 'Pain doré', emoji: '🍞', ingredients: ['pain', 'oeuf', 'lait', 'cannelle', 'sirop d\'érable'] },
];

export default function FridgeScanner({ goBack }) {
  const [pantry, setPantry] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPantry(JSON.parse(raw));
    } catch (e) { /* localStorage indisponible : on ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(pantry)); }
    catch (e) { /* quota/file:// : on ignore */ }
  }, [pantry]);

  const addItems = () => {
    const items = input.split(',').map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    setPantry((p) => {
      const next = [...p];
      items.forEach((it) => { if (!next.some((x) => norm(x) === norm(it))) next.push(it); });
      return next;
    });
    setInput('');
  };
  const removeItem = (it) => setPantry((p) => p.filter((x) => x !== it));
  const clearAll = () => { if (window.confirm('Vider le garde-manger ?')) setPantry([]); };

  const have = useMemo(() => new Set(pantry.map(norm)), [pantry]);

  const analyse = useMemo(() => {
    return RECETTES.map((r) => {
      const manquants = r.ingredients.filter((ing) => !have.has(norm(ing)));
      return { ...r, manquants, ont: r.ingredients.length - manquants.length };
    }).sort((a, b) => a.manquants.length - b.manquants.length || b.ont - a.ont);
  }, [have]);

  const faisables = analyse.filter((r) => r.manquants.length === 0);
  const presque = analyse.filter((r) => r.manquants.length === 1);
  const autres = analyse.filter((r) => r.manquants.length >= 2);

  const Carte = ({ r }) => (
    <div className={`fs-card ${r.manquants.length === 0 ? 'ok' : r.manquants.length === 1 ? 'near' : ''}`}>
      <div className="fs-card-h">
        <span>{r.emoji} {r.nom}</span>
        <span className="fs-badge">{r.ont}/{r.ingredients.length}</span>
      </div>
      <div className="fs-ings">
        {r.ingredients.map((ing) => (
          <span key={ing} className={`fs-ing ${have.has(norm(ing)) ? 'has' : 'miss'}`}>{ing}</span>
        ))}
      </div>
      {r.manquants.length === 1 && <div className="fs-tip">⚠️ Il ne manque que : <b>{r.manquants[0]}</b></div>}
    </div>
  );

  return (
    <div className="fs">
      <style>{`
        .fs{color:#eaf2fb;max-width:980px;margin:0 auto}
        .fs h1{font-size:1.6rem;margin:0 0 4px}
        .fs .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .fs-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .fs-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
        .fs input[type=text]{flex:1;min-width:200px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#eaf2fb;padding:10px 12px;font-size:.95rem}
        .fs-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .fs-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .fs-pantry{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
        .fs-chip{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.5);border-radius:20px;padding:5px 10px;font-size:.85rem;display:flex;align-items:center;gap:6px}
        .fs-chip b{cursor:pointer;opacity:.6}
        .fs-chip b:hover{opacity:1;color:#ff8a8a}
        .fs-sec{margin:18px 0 8px;font-size:1.05rem;font-weight:700;color:#ffae3b}
        .fs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
        .fs-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px}
        .fs-card.ok{border-color:rgba(74,222,128,.5);background:rgba(74,222,128,.08)}
        .fs-card.near{border-color:rgba(255,174,59,.5);background:rgba(255,174,59,.08)}
        .fs-card-h{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:8px}
        .fs-badge{font-size:.75rem;background:rgba(255,255,255,.12);border-radius:8px;padding:2px 7px;color:#9fb6cf}
        .fs-ings{display:flex;flex-wrap:wrap;gap:5px}
        .fs-ing{font-size:.78rem;border-radius:7px;padding:3px 7px}
        .fs-ing.has{background:rgba(74,222,128,.18);color:#bbf7d0}
        .fs-ing.miss{background:rgba(255,255,255,.06);color:#9fb6cf;text-decoration:line-through}
        .fs-tip{margin-top:9px;font-size:.82rem;color:#ffd9a3}
        .fs-empty{color:#9fb6cf;font-size:.9rem;padding:10px 0}
        @media(max-width:760px){.fs-grid{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="fs-back" onClick={goBack}>← Retour</button>}
      <h1>🧊 Scanner de frigo</h1>
      <p className="sub">Dis-moi ce que tu as, je te dis quoi cuisiner. 100 % hors-ligne.</p>

      <div className="fs-row">
        <input type="text" placeholder="Ex : oeuf, fromage, lait, pain…"
               value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') addItems(); }} />
        <button className="fs-btn" onClick={addItems}>＋ Ajouter</button>
        {pantry.length > 0 && <button className="fs-btn ghost" onClick={clearAll}>Vider</button>}
      </div>

      {pantry.length > 0 ? (
        <div className="fs-pantry">
          {pantry.map((it) => (
            <span key={it} className="fs-chip">{it} <b onClick={() => removeItem(it)} title="Retirer">✕</b></span>
          ))}
        </div>
      ) : <p className="fs-empty">Garde-manger vide — ajoute quelques ingrédients pour commencer.</p>}

      {pantry.length > 0 && (
        <>
          <div className="fs-sec">✅ Tu peux cuisiner ({faisables.length})</div>
          {faisables.length ? <div className="fs-grid">{faisables.map((r) => <Carte key={r.nom} r={r} />)}</div>
            : <p className="fs-empty">Aucune recette complète pour l'instant. Regarde « presque prêt » ci-dessous.</p>}

          <div className="fs-sec">⚠️ Presque prêt — il ne manque qu'un ingrédient ({presque.length})</div>
          {presque.length ? <div className="fs-grid">{presque.map((r) => <Carte key={r.nom} r={r} />)}</div>
            : <p className="fs-empty">Rien à ce stade.</p>}

          <div className="fs-sec">💡 Autres idées</div>
          <div className="fs-grid">{autres.map((r) => <Carte key={r.nom} r={r} />)}</div>
        </>
      )}
    </div>
  );
}
