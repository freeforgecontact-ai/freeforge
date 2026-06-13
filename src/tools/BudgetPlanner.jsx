import React, { useState, useEffect, useMemo } from 'react';

/**
 * BudgetPlanner — budget personnel méthode 50/30/20, 100 % local & hors-ligne.
 * Revenu net réparti en 50 % besoins / 30 % envies / 20 % épargne.
 * Dépenses catégorisées, barres de progression vs cible, alertes de dépassement.
 * Persistance localStorage.
 */

const LS_KEY = 'ff_budget_planner_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const CATS = {
  need: { label: 'Besoins', ratio: 0.5, color: '#5b9dff', emoji: '🏠' },
  want: { label: 'Envies', ratio: 0.3, color: '#ff7a18', emoji: '🎉' },
  save: { label: 'Épargne', ratio: 0.2, color: '#3bd6a0', emoji: '💰' },
};

export default function BudgetPlanner({ goBack }) {
  const [income, setIncome] = useState(2500);
  const [expenses, setExpenses] = useState([]); // {id,name,amount,cat}
  const [form, setForm] = useState({ name: '', amount: '', cat: 'need' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); if (typeof d.income === 'number') setIncome(d.income); if (d.expenses) setExpenses(d.expenses); }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ income, expenses })); } catch (e) { /* ignore */ }
  }, [income, expenses]);

  const eur = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const num = (v) => Math.max(0, parseFloat(v) || 0);

  const addExp = () => {
    if (!form.name.trim() || num(form.amount) <= 0) return;
    setExpenses((p) => [...p, { id: uid(), name: form.name.trim(), amount: num(form.amount), cat: form.cat }]);
    setForm({ name: '', amount: '', cat: form.cat });
  };
  const delExp = (id) => setExpenses((p) => p.filter((e) => e.id !== id));

  const byCat = useMemo(() => {
    const o = { need: 0, want: 0, save: 0 };
    expenses.forEach((e) => { o[e.cat] = (o[e.cat] || 0) + e.amount; });
    return o;
  }, [expenses]);

  const totalSpent = byCat.need + byCat.want + byCat.save;
  const leftover = income - totalSpent;

  return (
    <div className="bdg">
      <style>{`
        .bdg{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .bdg h1{font-size:1.6rem;margin:0 0 4px}
        .bdg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .bdg-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .bdg-grid{display:grid;grid-template-columns:1fr 360px;gap:18px;align-items:start}
        .bdg input,.bdg select{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:8px;padding:8px 10px;font-size:.85rem}
        .bdg-inc{font-size:1.4rem;width:140px;font-weight:800;text-align:right}
        .bdg-form{display:grid;grid-template-columns:1fr 100px 130px auto;gap:8px;align-items:center;margin-bottom:12px}
        .bdg-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.85rem}
        .bdg-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .bdg-it{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.86rem}
        .bdg-it .nm{flex:1}
        .bdg-tag{font-size:.68rem;padding:2px 8px;border-radius:20px;font-weight:700}
        .bdg-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:.95rem}
        .bdg-cat{margin-bottom:14px}
        .bdg-cat-h{display:flex;justify-content:space-between;align-items:baseline;font-size:.88rem;margin-bottom:5px}
        .bdg-cat-h b{font-weight:700}
        .bdg-bar{height:16px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden;position:relative}
        .bdg-bar > span{display:block;height:100%;transition:width .25s}
        .bdg-cat small{font-size:.74rem;color:#9fb6cf}
        .bdg-alert{color:#ff8a8a;font-weight:700}
        .bdg-empty{color:#9fb6cf;text-align:center;padding:22px 8px;font-size:.88rem}
        .bdg-left{font-size:1.6rem;font-weight:800;line-height:1;margin-top:4px}
        @media(max-width:760px){.bdg-grid{grid-template-columns:1fr}.bdg-form{grid-template-columns:1fr 1fr}.bdg-form>button{grid-column:1/-1}}
      `}</style>

      <div className="no-print" style={{ marginBottom: 14 }}>
        {goBack && <button className="bdg-btn ghost" onClick={goBack}>← Retour</button>}
      </div>

      <h1>📊 Budget 50 / 30 / 20</h1>
      <p className="sub">Indique ton revenu net : l'outil répartit 50 % besoins, 30 % envies, 20 % épargne et te prévient en cas de dépassement. 100 % hors-ligne.</p>

      <div className="bdg-card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <label style={{ fontSize: '.9rem', fontWeight: 600 }}>💶 Revenu net mensuel</label>
        <input className="bdg-inc" type="number" min="0" value={income} onChange={(e) => setIncome(Math.max(0, parseFloat(e.target.value) || 0))} />
        <span style={{ color: '#9fb6cf', fontSize: '.85rem', marginLeft: 'auto' }}>
          Dépensé {eur(totalSpent)} · Reste <b style={{ color: leftover < 0 ? '#ff8a8a' : '#3bd6a0' }}>{eur(leftover)}</b>
        </span>
      </div>

      <div className="bdg-grid">
        <div className="bdg-card">
          <h3 style={{ fontSize: '.95rem', margin: '0 0 12px' }}>➕ Ajouter une dépense</h3>
          <div className="bdg-form">
            <input placeholder="Libellé (ex: Loyer)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addExp()} />
            <input type="number" min="0" placeholder="Montant" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            <select value={form.cat} onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}>
              {Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.label}</option>)}
            </select>
            <button className="bdg-btn" onClick={addExp}>＋</button>
          </div>

          {expenses.length === 0 ? (
            <div className="bdg-empty">Aucune dépense. Ajoute ton loyer, tes courses, tes loisirs…</div>
          ) : expenses.map((e) => (
            <div className="bdg-it" key={e.id}>
              <span className="nm">{e.name}</span>
              <span className="bdg-tag" style={{ background: `${CATS[e.cat].color}33`, color: CATS[e.cat].color }}>{CATS[e.cat].emoji} {CATS[e.cat].label}</span>
              <b>{eur(e.amount)}</b>
              <button className="bdg-x" onClick={() => delExp(e.id)} title="Supprimer">✕</button>
            </div>
          ))}
        </div>

        <div className="bdg-card">
          <h3 style={{ fontSize: '.95rem', margin: '0 0 14px' }}>🎯 Suivi par catégorie</h3>
          {Object.entries(CATS).map(([k, c]) => {
            const target = income * c.ratio;
            const spent = byCat[k] || 0;
            const pct = target > 0 ? (spent / target) * 100 : (spent > 0 ? 100 : 0);
            const over = spent > target && target >= 0;
            return (
              <div className="bdg-cat" key={k}>
                <div className="bdg-cat-h">
                  <b>{c.emoji} {c.label} <small>({Math.round(c.ratio * 100)}%)</small></b>
                  <span className={over ? 'bdg-alert' : ''}>{eur(spent)} / {eur(target)}</span>
                </div>
                <div className="bdg-bar">
                  <span style={{ width: `${Math.min(100, pct)}%`, background: over ? 'linear-gradient(90deg,#ff5a5a,#ff8a8a)' : c.color }} />
                </div>
                <small>{over ? <span className="bdg-alert">⚠️ Dépassement de {eur(spent - target)}</span> : `Disponible : ${eur(Math.max(0, target - spent))}`}</small>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 12, marginTop: 6 }}>
            <small style={{ color: '#9fb6cf' }}>Non dépensé / à épargner</small>
            <div className="bdg-left" style={{ color: leftover < 0 ? '#ff8a8a' : '#3bd6a0' }}>{eur(leftover)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
