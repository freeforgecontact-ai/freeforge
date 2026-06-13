import React, { useState, useEffect, useMemo } from 'react';

/**
 * ExpenseSplitter — répartiteur de dépenses de voyage 100 % local.
 * Ajoute des voyageurs et des dépenses (payeur, montant, bénéficiaires),
 * calcule le solde de chacun puis propose un règlement simplifié
 * (qui rembourse combien à qui). Aucune donnée envoyée, persistance navigateur.
 */

const LS_KEY = 'ff_expense_splitter_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const money = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);

export default function ExpenseSplitter({ goBack }) {
  const [people, setPeople] = useState([]);          // [{id,name}]
  const [expenses, setExpenses] = useState([]);      // [{id,label,amount,payer,beneficiaries:[id]}]
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [forIds, setForIds] = useState([]);          // bénéficiaires sélectionnés
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.people)) setPeople(d.people);
        if (Array.isArray(d.expenses)) setExpenses(d.expenses);
        if (d.currency) setCurrency(d.currency);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ people, expenses, currency })); } catch (e) { /* ignore */ }
  }, [people, expenses, currency]);

  const addPerson = () => {
    const n = name.trim();
    if (!n || people.some((p) => p.name.toLowerCase() === n.toLowerCase())) return;
    setPeople((prev) => [...prev, { id: uid(), name: n }]);
    setName('');
  };
  const removePerson = (id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setExpenses((prev) => prev.filter((e) => e.payer !== id).map((e) => ({ ...e, beneficiaries: e.beneficiaries.filter((b) => b !== id) })));
    setForIds((prev) => prev.filter((b) => b !== id));
    if (payer === id) setPayer('');
  };
  const toggleFor = (id) => setForIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addExpense = () => {
    const a = parseFloat(amount);
    const benef = forIds.length ? forIds : people.map((p) => p.id);
    if (!payer || !a || a <= 0 || !benef.length) return;
    setExpenses((prev) => [...prev, { id: uid(), label: label.trim() || 'Dépense', amount: a, payer, beneficiaries: benef }]);
    setLabel(''); setAmount(''); setForIds([]);
  };
  const removeExpense = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));
  const resetAll = () => { if (window.confirm('Tout effacer ?')) { setPeople([]); setExpenses([]); setForIds([]); setPayer(''); } };

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  // ---- soldes : (ce qu'on a payé) - (sa part des dépenses) ----
  const balances = useMemo(() => {
    const b = {};
    people.forEach((p) => { b[p.id] = 0; });
    expenses.forEach((e) => {
      if (b[e.payer] != null) b[e.payer] += e.amount;
      const share = e.amount / e.beneficiaries.length;
      e.beneficiaries.forEach((id) => { if (b[id] != null) b[id] -= share; });
    });
    return b;
  }, [people, expenses]);

  // ---- règlement simplifié : créditeurs vs débiteurs ----
  const settlements = useMemo(() => {
    const debtors = [], creditors = [];
    people.forEach((p) => {
      const v = Math.round((balances[p.id] || 0) * 100) / 100;
      if (v < -0.005) debtors.push({ id: p.id, name: p.name, amt: -v });
      else if (v > 0.005) creditors.push({ id: p.id, name: p.name, amt: v });
    });
    debtors.sort((a, b) => b.amt - a.amt); creditors.sort((a, b) => b.amt - a.amt);
    const out = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amt, creditors[j].amt);
      if (pay > 0.005) out.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
      debtors[i].amt -= pay; creditors[j].amt -= pay;
      if (debtors[i].amt < 0.005) i++;
      if (creditors[j].amt < 0.005) j++;
    }
    return out;
  }, [people, balances]);

  return (
    <div className="esp">
      <style>{`
        .esp{color:#eaf2fb;max-width:980px;margin:0 auto}
        .esp h1{font-size:1.55rem;margin:0 0 4px}
        .esp .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .esp-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .esp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .esp-card h2{font-size:1.05rem;margin:0 0 12px}
        .esp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
        .esp input,.esp select{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:10px;padding:9px 11px;font-size:.9rem;flex:1;min-width:90px}
        .esp input:focus,.esp select:focus{outline:none;border-color:#5b9dff}
        .esp-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .esp-btn:hover{filter:brightness(1.06)}
        .esp-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .esp-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.4);border-radius:20px;padding:5px 10px;font-size:.85rem;margin:0 6px 6px 0}
        .esp-chip .x{cursor:pointer;opacity:.6}
        .esp-chip .x:hover{opacity:1;color:#ff8a8a}
        .esp-for{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}
        .esp-tag{cursor:pointer;border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:5px 10px;font-size:.82rem;background:rgba(255,255,255,.04)}
        .esp-tag.on{background:rgba(91,157,255,.25);border-color:#5b9dff}
        .esp-exp{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:7px;font-size:.88rem}
        .esp-exp .grow{flex:1;min-width:0}
        .esp-exp .amt{color:#ffae3b;font-weight:700}
        .esp-exp .x{cursor:pointer;opacity:.55}
        .esp-exp .x:hover{opacity:1;color:#ff8a8a}
        .esp-bal{display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.08);font-size:.9rem}
        .esp-pos{color:#34d399;font-weight:700}.esp-neg{color:#fb7185;font-weight:700}
        .esp-set{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);border-radius:10px;padding:10px 12px;margin-bottom:7px;font-size:.9rem}
        .esp-set b{color:#ffae3b}
        .esp-empty{color:#9fb6cf;font-size:.88rem;padding:16px 4px;text-align:center}
        .esp-total{margin-top:10px;font-size:.95rem;color:#9fb6cf}
        .esp-total b{color:#eaf2fb}
        .esp-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
        @media(max-width:760px){.esp-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="esp-top">
        {goBack && <button className="esp-btn ghost" onClick={goBack}>← Retour</button>}
        <select style={{ flex: '0 0 auto', minWidth: 70 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option>$</option><option>€</option><option>£</option><option>CHF</option>
        </select>
        <button className="esp-btn ghost" style={{ marginLeft: 'auto' }} onClick={resetAll}>Réinitialiser</button>
      </div>

      <h1>💸 Répartiteur de dépenses</h1>
      <p className="sub">Partage équitablement les frais d'un voyage entre voyageurs. 100 % local — rien n'est envoyé.</p>

      <div className="esp-grid">
        <div className="esp-card">
          <h2>Voyageurs</h2>
          <div className="esp-row">
            <input placeholder="Nom du voyageur" value={name} onChange={(e) => setName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && addPerson()} />
            <button className="esp-btn" onClick={addPerson}>＋</button>
          </div>
          <div>
            {people.length === 0 && <div className="esp-empty">Ajoute au moins deux voyageurs.</div>}
            {people.map((p) => (
              <span key={p.id} className="esp-chip">{p.name}<span className="x" onClick={() => removePerson(p.id)}>✕</span></span>
            ))}
          </div>

          {people.length > 0 && (
            <>
              <h2 style={{ marginTop: 18 }}>Nouvelle dépense</h2>
              <div className="esp-row">
                <input placeholder="Intitulé (ex. Essence)" value={label} onChange={(e) => setLabel(e.target.value)} />
                <input type="number" min="0" step="0.01" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ maxWidth: 110 }} />
              </div>
              <div className="esp-row">
                <select value={payer} onChange={(e) => setPayer(e.target.value)}>
                  <option value="">Qui a payé ?</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ fontSize: '.82rem', color: '#9fb6cf', marginBottom: 4 }}>Pour qui ? (vide = tous)</div>
              <div className="esp-for">
                {people.map((p) => (
                  <span key={p.id} className={`esp-tag ${forIds.includes(p.id) ? 'on' : ''}`} onClick={() => toggleFor(p.id)}>{p.name}</span>
                ))}
              </div>
              <button className="esp-btn" onClick={addExpense}>Ajouter la dépense</button>
            </>
          )}
        </div>

        <div className="esp-card">
          <h2>Dépenses</h2>
          {expenses.length === 0 ? <div className="esp-empty">Aucune dépense enregistrée.</div> : expenses.map((e) => {
            const payerName = people.find((p) => p.id === e.payer)?.name || '?';
            return (
              <div key={e.id} className="esp-exp">
                <div className="grow">
                  <div>{e.label}</div>
                  <div style={{ fontSize: '.78rem', color: '#9fb6cf' }}>{payerName} · {e.beneficiaries.length} pers.</div>
                </div>
                <span className="amt">{currency}{money(e.amount)}</span>
                <span className="x" onClick={() => removeExpense(e.id)}>✕</span>
              </div>
            );
          })}
          {expenses.length > 0 && <div className="esp-total">Total du voyage : <b>{currency}{money(total)}</b></div>}

          {people.length > 0 && (
            <>
              <h2 style={{ marginTop: 18 }}>Soldes</h2>
              {people.map((p) => {
                const v = balances[p.id] || 0;
                return (
                  <div key={p.id} className="esp-bal">
                    <span>{p.name}</span>
                    <span className={v >= 0 ? 'esp-pos' : 'esp-neg'}>{v >= 0 ? '+' : '−'}{currency}{money(Math.abs(v))}</span>
                  </div>
                );
              })}

              <h2 style={{ marginTop: 18 }}>Règlement simplifié</h2>
              {settlements.length === 0 ? <div className="esp-empty">Tout le monde est à jour 🎉</div> : settlements.map((s, i) => (
                <div key={i} className="esp-set"><b>{s.from}</b> → <b>{s.to}</b> : {currency}{money(s.amount)}</div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
