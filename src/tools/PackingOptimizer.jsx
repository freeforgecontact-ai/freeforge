import React, { useState, useEffect, useMemo } from 'react';

/**
 * PackingOptimizer — optimiseur de liste de bagages (≠ simple checklist).
 * Saisis la durée + le type de voyage : l'outil CALCULE des quantités
 * recommandées par article (selon la durée), les catégorise, estime un
 * « poids » indicatif total, propose des cases à cocher et l'ajout perso.
 * 100 % local & hors-ligne. État mémorisé dans localStorage.
 */

const LS_KEY = 'ff_packing_optimizer_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

// Règles de quantité : per = nb par jour (plafonné), fixe = quantité constante.
// w = poids unitaire indicatif en grammes.
const RULES = {
  Vêtements: [
    { name: 'T-shirts', per: 1, cap: 10, w: 150 },
    { name: 'Sous-vêtements', per: 1, cap: 12, extra: 1, w: 60 },
    { name: 'Chaussettes', per: 1, cap: 12, extra: 1, w: 50 },
    { name: 'Pantalons', perN: 3, cap: 4, min: 1, w: 500 },
    { name: 'Pull / veste', perN: 7, cap: 2, min: 1, w: 600 },
    { name: 'Pyjama', fixe: 1, w: 300 },
    { name: 'Chaussures (paires)', perN: 7, cap: 3, min: 1, w: 900 },
  ],
  Toilette: [
    { name: 'Brosse à dents', fixe: 1, w: 20 },
    { name: 'Dentifrice', fixe: 1, w: 100 },
    { name: 'Déodorant', fixe: 1, w: 80 },
    { name: 'Savon / gel douche', fixe: 1, w: 200 },
    { name: 'Trousse de soins', fixe: 1, w: 250 },
  ],
  Électronique: [
    { name: 'Téléphone + chargeur', fixe: 1, w: 250 },
    { name: 'Batterie externe', fixe: 1, w: 200 },
    { name: 'Adaptateur de prise', fixe: 1, w: 90 },
    { name: 'Écouteurs', fixe: 1, w: 60 },
  ],
  Documents: [
    { name: 'Passeport / pièce ID', fixe: 1, w: 40 },
    { name: 'Carte bancaire', fixe: 1, w: 10 },
    { name: 'Billets / réservations', fixe: 1, w: 20 },
    { name: 'Assurance voyage', fixe: 1, w: 15 },
  ],
};

// Modulateurs par type de voyage (multiplie certaines catégories / ajoute des extras).
const TYPES = {
  Loisir: { mult: 1, extras: [] },
  Affaires: { mult: 1, extras: [{ cat: 'Vêtements', name: 'Tenue habillée', perN: 2, cap: 4, min: 1, w: 700 }, { cat: 'Électronique', name: 'Ordinateur portable', fixe: 1, w: 1500 }] },
  Plage: { mult: 1, extras: [{ cat: 'Vêtements', name: 'Maillot de bain', perN: 3, cap: 3, min: 1, w: 120 }, { cat: 'Toilette', name: 'Crème solaire', fixe: 1, w: 200 }] },
  Randonnée: { mult: 1, extras: [{ cat: 'Vêtements', name: 'Tenue technique', perN: 2, cap: 4, min: 1, w: 400 }, { cat: 'Électronique', name: 'Lampe frontale', fixe: 1, w: 120 }] },
  Hiver: { mult: 1, extras: [{ cat: 'Vêtements', name: 'Couche thermique', per: 1, cap: 6, w: 200 }, { cat: 'Vêtements', name: 'Bonnet / gants', fixe: 1, w: 200 }, { cat: 'Vêtements', name: 'Manteau chaud', fixe: 1, w: 1200 }] },
};

function qtyFor(rule, days) {
  if (rule.fixe) return rule.fixe;
  if (rule.per) return Math.min(rule.cap || 99, days * rule.per + (rule.extra || 0));
  if (rule.perN) return Math.max(rule.min || 0, Math.min(rule.cap || 99, Math.ceil(days / rule.perN)));
  return 1;
}

export default function PackingOptimizer({ goBack }) {
  const [days, setDays] = useState(5);
  const [type, setType] = useState('Loisir');
  const [checked, setChecked] = useState({}); // {key:true}
  const [extras, setExtras] = useState([]); // {id,cat,name,qty,w}
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Vêtements');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.days === 'number') setDays(d.days);
        if (d.type) setType(d.type);
        if (d.checked) setChecked(d.checked);
        if (Array.isArray(d.extras)) setExtras(d.extras);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ days, type, checked, extras })); }
    catch (e) { /* ignore */ }
  }, [days, type, checked, extras]);

  // Construit la liste recommandée (règles de base + extras du type).
  const list = useMemo(() => {
    const d = Math.max(1, Number(days) || 1);
    const out = {};
    Object.keys(RULES).forEach((cat) => {
      out[cat] = RULES[cat].map((r) => ({ key: `${cat}:${r.name}`, cat, name: r.name, qty: qtyFor(r, d), w: r.w }));
    });
    (TYPES[type]?.extras || []).forEach((r) => {
      if (!out[r.cat]) out[r.cat] = [];
      out[r.cat].push({ key: `${r.cat}:${r.name}`, cat: r.cat, name: r.name, qty: qtyFor(r, d), w: r.w });
    });
    extras.forEach((e) => {
      if (!out[e.cat]) out[e.cat] = [];
      out[e.cat].push({ key: `extra:${e.id}`, cat: e.cat, name: e.name, qty: e.qty, w: e.w, custom: e.id });
    });
    return out;
  }, [days, type, extras]);

  const allItems = useMemo(() => Object.values(list).flat(), [list]);
  const totalWeight = useMemo(
    () => allItems.reduce((s, it) => s + it.qty * it.w, 0), [allItems]);
  const packedWeight = useMemo(
    () => allItems.reduce((s, it) => s + (checked[it.key] ? it.qty * it.w : 0), 0), [allItems, checked]);
  const packedCount = allItems.filter((it) => checked[it.key]).length;

  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));
  const addExtra = () => {
    const n = newName.trim();
    if (!n) return;
    setExtras((e) => [...e, { id: uid(), cat: newCat, name: n, qty: 1, w: 150 }]);
    setNewName('');
  };
  const removeExtra = (id) => setExtras((e) => e.filter((x) => x.id !== id));
  const reset = () => setChecked({});

  const kg = (g) => (g / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  const ICONS = { Vêtements: '👕', Toilette: '🧴', Électronique: '🔌', Documents: '📄' };

  return (
    <div className="pko">
      <style>{`
        .pko{color:#eaf2fb;max-width:820px;margin:0 auto}
        .pko h1{font-size:1.6rem;margin:0 0 4px}
        .pko .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .pko-top{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px;display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
        .pko-f{display:flex;flex-direction:column;gap:5px}
        .pko-f label{font-size:.78rem;color:#9fb6cf}
        .pko input,.pko select{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;color:#eaf2fb;padding:9px 11px;font-size:.95rem;box-sizing:border-box}
        .pko input:focus,.pko select:focus{outline:none;border-color:#5b9dff}
        .pko-stats{margin-left:auto;display:flex;gap:18px;text-align:right}
        .pko-stats .lbl{font-size:.72rem;color:#9fb6cf}
        .pko-stats .v{font-size:1.35rem;font-weight:800;color:#ffae3b}
        .pko-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:16px}
        .pko-bar i{display:block;height:100%;background:linear-gradient(90deg,#ff7a18,#ffae3b)}
        .pko-cat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px 16px;margin-bottom:14px}
        .pko-cat h2{font-size:1.05rem;margin:0 0 10px}
        .pko-it{display:flex;align-items:center;gap:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07)}
        .pko-it:last-child{border-bottom:none}
        .pko-it input[type=checkbox]{width:19px;height:19px;accent-color:#ff8a3b;cursor:pointer}
        .pko-it .nm{flex:1;font-size:.95rem}
        .pko-it.done .nm{text-decoration:line-through;color:#7e94ac}
        .pko-q{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.4);border-radius:20px;padding:2px 10px;font-weight:700;font-size:.85rem;min-width:28px;text-align:center}
        .pko-w{color:#9fb6cf;font-size:.78rem;min-width:62px;text-align:right}
        .pko-x{opacity:.5;cursor:pointer;font-size:.8rem;padding:2px 4px}
        .pko-x:hover{opacity:1;color:#ff8a8a}
        .pko-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .pko-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .pko-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px}
        .pko-add input{flex:1;min-width:150px}
        .pko-note{color:#9fb6cf;font-size:.78rem;margin-top:8px}
        @media(max-width:760px){.pko-stats{width:100%;justify-content:space-between}.pko-w{min-width:50px}}
      `}</style>

      {goBack && <button className="pko-btn ghost" style={{ marginBottom: 14 }} onClick={goBack}>← Retour</button>}

      <h1>🧳 Optimiseur de bagages</h1>
      <p className="sub">Quantités recommandées calculées selon ta durée et ton type de voyage. 100 % hors-ligne.</p>

      <div className="pko-top">
        <div className="pko-f">
          <label>Durée (jours)</label>
          <input style={{ width: 90 }} type="number" min="1" max="60" value={days}
                 onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="pko-f">
          <label>Type de voyage</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.keys(TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="pko-stats">
          <div>
            <div className="lbl">Préparé</div>
            <div className="v">{packedCount}/{allItems.length}</div>
          </div>
          <div>
            <div className="lbl">Poids indicatif</div>
            <div className="v">{kg(packedWeight)}/{kg(totalWeight)} kg</div>
          </div>
        </div>
      </div>

      <div className="pko-bar">
        <i style={{ width: `${allItems.length ? (packedCount / allItems.length) * 100 : 0}%` }} />
      </div>

      {Object.keys(list).map((cat) => (
        <div key={cat} className="pko-cat">
          <h2>{ICONS[cat] || '📦'} {cat}</h2>
          {list[cat].map((it) => (
            <div key={it.key} className={`pko-it ${checked[it.key] ? 'done' : ''}`}>
              <input type="checkbox" checked={!!checked[it.key]} onChange={() => toggle(it.key)} />
              <span className="pko-q">{it.qty}×</span>
              <span className="nm">{it.name}</span>
              <span className="pko-w">{kg(it.qty * it.w)} kg</span>
              {it.custom && <span className="pko-x" title="Retirer" onClick={() => removeExtra(it.custom)}>✕</span>}
            </div>
          ))}
        </div>
      ))}

      <div className="pko-cat">
        <h2>➕ Ajouter un article perso</h2>
        <div className="pko-add">
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
            {Object.keys(RULES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={newName} placeholder="Nom de l'article"
                 onChange={(e) => setNewName(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addExtra()} />
          <button className="pko-btn" onClick={addExtra}>Ajouter</button>
          <button className="pko-btn ghost" onClick={reset}>↺ Décocher tout</button>
        </div>
        <p className="pko-note">Le poids est une estimation indicative (peut varier selon les modèles). Les quantités s'ajustent automatiquement à la durée.</p>
      </div>
    </div>
  );
}
