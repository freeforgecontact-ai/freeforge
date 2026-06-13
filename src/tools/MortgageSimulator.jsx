import React, { useState, useMemo } from 'react';

/**
 * MortgageSimulator — simulateur hypothécaire (Québec) 100 % local & hors-ligne.
 * Entrées : montant, taux annuel, amortissement (années), fréquence
 * (mensuel / aux 2 semaines accéléré). Calcule le paiement, l'intérêt total et
 * affiche un aperçu du tableau d'amortissement + un résumé. Aucun réseau.
 * Convention canadienne : intérêt composé semestriellement.
 */

const money = (n) => (isFinite(n) ? n : 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

export default function MortgageSimulator({ goBack }) {
  const [amount, setAmount] = useState('350000');
  const [rate, setRate] = useState('5.25');
  const [years, setYears] = useState('25');
  const [freq, setFreq] = useState('monthly'); // 'monthly' | 'biweekly'

  const result = useMemo(() => {
    const P = parseFloat(amount) || 0;
    const annual = (parseFloat(rate) || 0) / 100;
    const yrs = parseFloat(years) || 0;
    if (P <= 0 || yrs <= 0) return null;

    // Taux périodique effectif (composition semestrielle — norme canadienne).
    const semi = annual / 2;
    const effAnnual = Math.pow(1 + semi, 2) - 1;
    const perYear = freq === 'biweekly' ? 26 : 12;
    const i = Math.pow(1 + effAnnual, 1 / perYear) - 1;

    let payment, schedule = [], balance = P, totalInterest = 0, n;

    if (freq === 'biweekly') {
      // Aux 2 semaines ACCÉLÉRÉ : on prend la moitié du paiement mensuel.
      const iM = Math.pow(1 + effAnnual, 1 / 12) - 1;
      const nM = 12 * yrs;
      const monthly = iM > 0 ? (P * iM) / (1 - Math.pow(1 + iM, -nM)) : P / nM;
      payment = monthly / 2;
    } else {
      n = perYear * yrs;
      payment = i > 0 ? (P * i) / (1 - Math.pow(1 + i, -n)) : P / n;
    }

    // Amortissement réel jusqu'à solde nul (l'accéléré finit plus tôt).
    let k = 0;
    const guard = perYear * yrs + 600;
    while (balance > 0.005 && k < guard) {
      const interest = balance * i;
      let principal = payment - interest;
      if (principal > balance) principal = balance;
      balance -= principal;
      totalInterest += interest;
      k++;
      if (k <= 4 || balance <= 0.005) {
        schedule.push({ k, payment: principal + interest, interest, principal, balance: Math.max(balance, 0) });
      }
    }

    return {
      payment,
      perYear,
      periods: k,
      totalInterest,
      totalPaid: P + totalInterest,
      schedule,
      yearsReal: k / perYear,
    };
  }, [amount, rate, years, freq]);

  return (
    <div className="mtg">
      <style>{`
        .mtg{color:#eaf2fb;max-width:920px;margin:0 auto}
        .mtg h1{font-size:1.6rem;margin:0 0 4px}
        .mtg .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .mtg-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:14px}
        .mtg-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .mtg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .mtg-f label{display:block;font-size:.78rem;color:#9fb6cf;margin-bottom:5px}
        .mtg input{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:9px;color:#eaf2fb;padding:10px;font-size:.95rem}
        .mtg input:focus{outline:none;border-color:#5b9dff}
        .mtg-seg{display:flex;gap:8px;background:rgba(0,0,0,.2);padding:4px;border-radius:9px}
        .mtg-seg button{flex:1;border:none;background:transparent;color:#9fb6cf;padding:9px;border-radius:7px;cursor:pointer;font-weight:600;font-size:.85rem}
        .mtg-seg button.on{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300}
        .mtg-hero{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
        .mtg-hero .big{flex:1;min-width:180px;background:linear-gradient(135deg,rgba(255,122,24,.15),rgba(91,157,255,.12));border:1px solid rgba(255,174,59,.3);border-radius:14px;padding:14px 18px}
        .mtg-hero small{display:block;color:#9fb6cf;font-size:.75rem;margin-bottom:3px}
        .mtg-hero b{font-size:1.5rem;color:#ffae3b}
        .mtg-stats{display:flex;gap:14px;flex-wrap:wrap}
        .mtg-stats div{flex:1;min-width:140px;background:rgba(91,157,255,.1);border:1px solid rgba(91,157,255,.25);border-radius:12px;padding:10px 14px}
        .mtg-stats small{display:block;color:#9fb6cf;font-size:.72rem}
        .mtg-stats b{font-size:1.1rem}
        .mtg-tbl{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:6px}
        .mtg-tbl th{text-align:right;color:#9fb6cf;font-weight:600;padding:8px;border-bottom:1px solid rgba(255,255,255,.12)}
        .mtg-tbl th:first-child{text-align:left}
        .mtg-tbl td{padding:8px;border-bottom:1px solid rgba(255,255,255,.07);text-align:right}
        .mtg-tbl td:first-child{text-align:left;color:#9fb6cf}
        .mtg-note{color:#9fb6cf;font-size:.78rem;margin-top:10px}
        @media(max-width:760px){.mtg-grid{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="mtg-back" onClick={goBack}>← Retour</button>}
      <h1>🏠 Simulateur hypothécaire</h1>
      <p className="sub">Québec · intérêt composé semestriellement (norme canadienne). 100 % local, aucun réseau.</p>

      <div className="mtg-card">
        <div className="mtg-grid">
          <div className="mtg-f"><label>Montant du prêt ($)</label><input type="number" min="0" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="mtg-f"><label>Taux annuel (%)</label><input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div className="mtg-f"><label>Amortissement (années)</label><input type="number" min="1" step="1" value={years} onChange={(e) => setYears(e.target.value)} /></div>
          <div className="mtg-f">
            <label>Fréquence de paiement</label>
            <div className="mtg-seg">
              <button className={freq === 'monthly' ? 'on' : ''} onClick={() => setFreq('monthly')}>Mensuel</button>
              <button className={freq === 'biweekly' ? 'on' : ''} onClick={() => setFreq('biweekly')}>Aux 2 semaines</button>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <div className="mtg-card">
          <div className="mtg-hero">
            <div className="big">
              <small>Paiement {freq === 'biweekly' ? 'aux 2 semaines (accéléré)' : 'mensuel'}</small>
              <b>{money(result.payment)}</b>
            </div>
          </div>
          <div className="mtg-stats">
            <div><small>Intérêt total payé</small><b>{money(result.totalInterest)}</b></div>
            <div><small>Total remboursé</small><b>{money(result.totalPaid)}</b></div>
            <div><small>Nombre de paiements</small><b>{result.periods}</b></div>
            <div><small>Durée réelle</small><b>{result.yearsReal.toFixed(1)} ans</b></div>
          </div>

          <h3 style={{ margin: '18px 0 4px', fontSize: '1rem' }}>Tableau d'amortissement (aperçu)</h3>
          <table className="mtg-tbl">
            <thead>
              <tr><th>Paiement n°</th><th>Versement</th><th>Intérêt</th><th>Capital</th><th>Solde</th></tr>
            </thead>
            <tbody>
              {result.schedule.map((s) => (
                <tr key={s.k}>
                  <td>{s.k}{s.balance <= 0.005 ? ' (dernier)' : ''}</td>
                  <td>{money(s.payment)}</td>
                  <td>{money(s.interest)}</td>
                  <td>{money(s.principal)}</td>
                  <td>{money(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mtg-note">Aperçu : 4 premiers versements + dernier. {freq === 'biweekly' ? 'Le paiement accéléré aux 2 semaines équivaut à un paiement mensuel divisé en deux, ce qui rembourse le prêt plus tôt.' : ''} Estimation à titre indicatif seulement.</p>
        </div>
      ) : (
        <div className="mtg-card"><p className="sub" style={{ margin: 0 }}>Saisis un montant et un amortissement valides pour lancer le calcul.</p></div>
      )}
    </div>
  );
}
