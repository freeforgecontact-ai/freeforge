import React, { useState, useEffect, useMemo } from 'react';

/**
 * DividendTracker — suivi de dividendes 100 % local & hors-ligne.
 * Ajoute des titres (symbole, nb d'actions, dividende annuel/action, fréquence
 * trimestrielle/mensuelle, prix payé par action facultatif pour le rendement).
 * Calcule le revenu annuel et mensuel, le rendement et un calendrier prévisionnel
 * simple sur 12 mois (SVG/HTML, aucune librairie). localStorage. Aucun réseau.
 */

const LS_KEY = 'dividend_tracker_v1';
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const money = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

export default function DividendTracker({ goBack }) {
  const [rows, setRows] = useState([]); // {id,symbol,shares,annualPerShare,freq,price}
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [annual, setAnnual] = useState('');
  const [freq, setFreq] = useState('quarterly'); // 'quarterly' | 'monthly'
  const [price, setPrice] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch (e) { /* corrompu : on ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); } catch (e) { /* quota : on ignore */ }
  }, [rows]);

  const add = () => {
    const s = symbol.trim().toUpperCase();
    const sh = parseFloat(shares), a = parseFloat(annual), pr = parseFloat(price);
    if (!s || !(sh > 0) || !(a >= 0)) return;
    setRows((p) => [...p, {
      id: Date.now() + '' + Math.random().toString(36).slice(2),
      symbol: s, shares: sh, annualPerShare: a, freq, price: isFinite(pr) && pr > 0 ? pr : 0,
    }]);
    setSymbol(''); setShares(''); setAnnual(''); setPrice(''); setFreq('quarterly');
  };
  const remove = (id) => setRows((p) => p.filter((r) => r.id !== id));

  const enriched = useMemo(() => rows.map((r) => {
    const annualIncome = r.shares * r.annualPerShare;
    const cost = r.shares * r.price;
    const yieldPct = cost > 0 ? (annualIncome / cost) * 100 : 0;
    return { ...r, annualIncome, cost, yieldPct };
  }), [rows]);

  const totals = useMemo(() => {
    const annualIncome = enriched.reduce((a, r) => a + r.annualIncome, 0);
    const cost = enriched.reduce((a, r) => a + r.cost, 0);
    return { annualIncome, monthlyIncome: annualIncome / 12, cost, yieldPct: cost > 0 ? (annualIncome / cost) * 100 : 0 };
  }, [enriched]);

  // ---- calendrier prévisionnel : revenu attribué par mois (12 mois) ----
  const calendar = useMemo(() => {
    const arr = new Array(12).fill(0);
    enriched.forEach((r) => {
      if (r.freq === 'monthly') {
        const per = r.annualIncome / 12;
        for (let i = 0; i < 12; i++) arr[i] += per;
      } else {
        const per = r.annualIncome / 4; // versé aux mois 3,6,9,12 (mars/juin/sept/déc)
        [2, 5, 8, 11].forEach((i) => { arr[i] += per; });
      }
    });
    return arr;
  }, [enriched]);

  const maxMonth = Math.max(...calendar, 1);

  return (
    <div className="dvt">
      <style>{`
        .dvt{color:#eaf2fb;max-width:1000px;margin:0 auto}
        .dvt h1{font-size:1.6rem;margin:0 0 4px}
        .dvt .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .dvt-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .dvt-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:18px}
        .dvt-form{display:grid;grid-template-columns:1fr .8fr 1fr 1.1fr .9fr auto;gap:8px;align-items:end}
        .dvt-form label{display:block;font-size:.72rem;color:#9fb6cf;margin-bottom:4px}
        .dvt input,.dvt select{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:9px 10px;font-size:.9rem}
        .dvt input:focus,.dvt select:focus{outline:none;border-color:#5b9dff}
        .dvt-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem;white-space:nowrap}
        .dvt-tbl{width:100%;border-collapse:collapse;font-size:.85rem}
        .dvt-tbl th{text-align:right;color:#9fb6cf;font-weight:600;padding:8px;border-bottom:1px solid rgba(255,255,255,.12)}
        .dvt-tbl th:first-child{text-align:left}
        .dvt-tbl td{padding:8px;border-bottom:1px solid rgba(255,255,255,.07);text-align:right}
        .dvt-tbl td:first-child{text-align:left;font-weight:700}
        .dvt-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:1rem;opacity:.7}
        .dvt-x:hover{opacity:1}
        .dvt-tot{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px}
        .dvt-tot div{flex:1;min-width:150px;border-radius:12px;padding:11px 16px}
        .dvt-tot .a{background:linear-gradient(135deg,rgba(255,122,24,.16),rgba(255,174,59,.12));border:1px solid rgba(255,174,59,.3)}
        .dvt-tot .m{background:rgba(55,211,155,.1);border:1px solid rgba(55,211,155,.3)}
        .dvt-tot .y{background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.25)}
        .dvt-tot small{display:block;color:#9fb6cf;font-size:.72rem}
        .dvt-tot b{font-size:1.25rem}
        .dvt-cal{display:flex;align-items:flex-end;gap:6px;height:140px;margin-top:6px}
        .dvt-bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:5px}
        .dvt-bar .fill{width:70%;background:linear-gradient(180deg,#ffae3b,#ff7a18);border-radius:5px 5px 0 0;min-height:2px}
        .dvt-bar .lbl{font-size:.68rem;color:#9fb6cf}
        .dvt-bar .val{font-size:.62rem;color:#eaf2fb}
        .dvt-empty{text-align:center;color:#9fb6cf;padding:30px 10px;font-size:.9rem}
        @media(max-width:760px){.dvt-form{grid-template-columns:1fr 1fr}.dvt-cal{gap:3px}.dvt-bar .val{display:none}}
      `}</style>

      {goBack && <button className="dvt-back" onClick={goBack}>← Retour</button>}
      <h1>🪙 Suivi de dividendes</h1>
      <p className="sub">100 % local & hors-ligne. Saisis tes titres à la main — rien n'est envoyé sur Internet.</p>

      <div className="dvt-card">
        <div className="dvt-form">
          <div><label>Symbole</label><input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ENB" /></div>
          <div><label>Nb d'actions</label><input type="number" step="any" min="0" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="100" /></div>
          <div><label>Div. annuel / action ($)</label><input type="number" step="any" min="0" value={annual} onChange={(e) => setAnnual(e.target.value)} placeholder="3.66" /></div>
          <div>
            <label>Fréquence</label>
            <select value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option value="quarterly">Trimestrielle</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </div>
          <div><label>Prix payé / action ($)</label><input type="number" step="any" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.00" /></div>
          <button className="dvt-btn" onClick={add}>＋ Ajouter</button>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="dvt-card"><div className="dvt-empty">Aucun titre. Ajoute ton premier titre à dividendes ci-dessus.</div></div>
      ) : (
        <>
          <div className="dvt-card">
            <table className="dvt-tbl">
              <thead>
                <tr><th>Titre</th><th>Actions</th><th>Div./action</th><th>Fréq.</th><th>Revenu annuel</th><th>Rend.</th><th></th></tr>
              </thead>
              <tbody>
                {enriched.map((r) => (
                  <tr key={r.id}>
                    <td>{r.symbol}</td>
                    <td>{r.shares}</td>
                    <td>{money(r.annualPerShare)}</td>
                    <td>{r.freq === 'monthly' ? 'Mensuel' : 'Trimestriel'}</td>
                    <td>{money(r.annualIncome)}</td>
                    <td>{r.yieldPct > 0 ? r.yieldPct.toFixed(2) + ' %' : '—'}</td>
                    <td><button className="dvt-x" title="Supprimer" onClick={() => remove(r.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="dvt-tot">
              <div className="a"><small>Revenu annuel</small><b style={{ color: '#ffae3b' }}>{money(totals.annualIncome)}</b></div>
              <div className="m"><small>Revenu mensuel (moy.)</small><b style={{ color: '#37d39b' }}>{money(totals.monthlyIncome)}</b></div>
              <div className="y"><small>Rendement global</small><b>{totals.yieldPct > 0 ? totals.yieldPct.toFixed(2) + ' %' : '—'}</b></div>
            </div>
          </div>

          <div className="dvt-card">
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Calendrier prévisionnel (12 mois)</h3>
            <div className="dvt-cal">
              {calendar.map((v, i) => (
                <div className="dvt-bar" key={i} title={`${MONTHS[i]} : ${money(v)}`}>
                  <span className="val">{v > 0 ? Math.round(v) : ''}</span>
                  <div className="fill" style={{ height: `${(v / maxMonth) * 100}%` }} />
                  <span className="lbl">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
            <p className="sub" style={{ margin: '10px 0 0' }}>Hypothèse : versements mensuels lissés sur l'année, trimestriels attribués à mars, juin, septembre et décembre.</p>
          </div>
        </>
      )}
    </div>
  );
}
