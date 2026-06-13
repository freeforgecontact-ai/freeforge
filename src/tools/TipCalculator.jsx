import React, { useState, useMemo } from 'react';

/**
 * TipCalculator — calculateur de pourboire 100 % local & hors-ligne.
 * Montant de l'addition, % de pourboire (préréglages + perso), partage entre
 * convives, et option « pourboire sur le montant avant taxes » (TPS 5 % / TVQ 9,975 %).
 * Aucun réseau, aucune donnée envoyée.
 */

const TPS = 0.05;
const TVQ = 0.09975;
const PRESETS = [10, 15, 18, 20];

export default function TipCalculator({ goBack }) {
  const [bill, setBill] = useState('50');
  const [pct, setPct] = useState(18);
  const [custom, setCustom] = useState('');
  const [people, setPeople] = useState(1);
  const [preTax, setPreTax] = useState(false);

  const fmt = (v) => (isFinite(v) ? v : 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

  const r = useMemo(() => {
    const total = Math.max(0, parseFloat(bill) || 0); // l'addition saisie est TTC
    const effPct = (custom !== '' ? parseFloat(custom) || 0 : pct) / 100;
    // Si « avant taxes » : on retire les taxes pour obtenir la base du pourboire.
    const base = preTax ? total / (1 + TPS + TVQ) : total;
    const tip = base * effPct;
    const grand = total + tip;
    const n = Math.max(1, parseInt(people, 10) || 1);
    return { total, base, tip, grand, perPerson: grand / n, tipPerPerson: tip / n, n, effPct };
  }, [bill, pct, custom, people, preTax]);

  return (
    <div className="tipc">
      <style>{`
        .tipc{color:#eaf2fb;max-width:760px;margin:0 auto;font-family:inherit}
        .tipc h1{font-size:1.55rem;margin:0 0 4px}
        .tipc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .tipc-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .tipc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:16px}
        .tipc-lbl{font-size:.82rem;color:#9fb6cf;font-weight:600;display:block;margin-bottom:7px}
        .tipc-in{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#eaf2fb;padding:11px 13px;font-size:1.05rem;outline:none}
        .tipc-in:focus{border-color:#5b9dff}
        .tipc-presets{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .tipc-chip{flex:1;min-width:64px;background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:11px;font-weight:700;cursor:pointer;font-size:.95rem}
        .tipc-chip.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border-color:transparent}
        .tipc-row{display:flex;gap:14px;flex-wrap:wrap}
        .tipc-row>div{flex:1;min-width:150px}
        .tipc-steps{display:flex;align-items:center;gap:10px}
        .tipc-steps button{width:42px;height:42px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#eaf2fb;font-size:1.3rem;cursor:pointer}
        .tipc-steps span{flex:1;text-align:center;font-size:1.3rem;font-weight:700}
        .tipc-toggle{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.9rem;color:#eaf2fb;margin-top:14px}
        .tipc-toggle input{width:18px;height:18px;accent-color:#ff8a3b}
        .tipc-out{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .tipc-stat{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 15px}
        .tipc-stat small{display:block;color:#9fb6cf;font-size:.74rem;margin-bottom:4px}
        .tipc-stat b{font-size:1.25rem;color:#ffae3b}
        .tipc-stat.big{grid-column:1/-1;background:linear-gradient(135deg,rgba(255,122,24,.18),rgba(91,157,255,.14));border-color:rgba(255,174,59,.35)}
        .tipc-stat.big b{font-size:1.6rem;color:#fff}
        .tipc-note{font-size:.76rem;color:#9fb6cf;margin-top:10px}
        @media(max-width:760px){.tipc-out{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="tipc-back" onClick={goBack}>← Retour</button>}
      <h1>💵 Calculateur de pourboire</h1>
      <p className="sub">Calcule le pourboire, le total et le montant par personne. 100 % hors-ligne.</p>

      <div className="tipc-card">
        <label className="tipc-lbl">Montant de l'addition (taxes comprises)</label>
        <input className="tipc-in" type="number" inputMode="decimal" min="0" step="0.01"
               value={bill} onChange={(e) => setBill(e.target.value)} placeholder="0.00" />

        <label className="tipc-lbl" style={{ marginTop: 16 }}>Pourcentage de pourboire</label>
        <div className="tipc-presets">
          {PRESETS.map((p) => (
            <button key={p} className={`tipc-chip ${custom === '' && pct === p ? 'on' : ''}`}
                    onClick={() => { setPct(p); setCustom(''); }}>{p} %</button>
          ))}
        </div>
        <input className="tipc-in" type="number" inputMode="decimal" min="0" step="1"
               value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Pourboire personnalisé (%)" />

        <label className="tipc-toggle">
          <input type="checkbox" checked={preTax} onChange={(e) => setPreTax(e.target.checked)} />
          Calculer le pourboire sur le montant <b>avant taxes</b> (TPS 5 % + TVQ 9,975 %)
        </label>
      </div>

      <div className="tipc-card">
        <label className="tipc-lbl">Nombre de personnes</label>
        <div className="tipc-steps">
          <button onClick={() => setPeople((n) => Math.max(1, (parseInt(n, 10) || 1) - 1))}>−</button>
          <span>{r.n} {r.n > 1 ? 'personnes' : 'personne'}</span>
          <button onClick={() => setPeople((n) => (parseInt(n, 10) || 1) + 1)}>+</button>
        </div>
      </div>

      <div className="tipc-card">
        <div className="tipc-out">
          {preTax && (
            <div className="tipc-stat"><small>Montant avant taxes</small><b>{fmt(r.base)}</b></div>
          )}
          <div className="tipc-stat"><small>Pourboire ({(r.effPct * 100).toLocaleString('fr-CA', { maximumFractionDigits: 2 })} %)</small><b>{fmt(r.tip)}</b></div>
          <div className="tipc-stat"><small>Total à payer</small><b>{fmt(r.grand)}</b></div>
          {r.n > 1 && <div className="tipc-stat"><small>Pourboire / personne</small><b>{fmt(r.tipPerPerson)}</b></div>}
          <div className="tipc-stat big"><small>Montant par personne</small><b>{fmt(r.perPerson)}</b></div>
        </div>
        {preTax && <p className="tipc-note">Le pourboire est calculé sur {fmt(r.base)} (addition moins les taxes), puis ajouté au total taxes comprises.</p>}
      </div>
    </div>
  );
}
