import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function SimulateurHypothecaire({ goBack }) {
  const [price, setPrice] = useState(450000);
  const [downPayment, setDownPayment] = useState(90000);
  const [rate, setRate] = useState(4.89);
  const [amortization, setAmortization] = useState(25);
  const [frequency, setFrequency] = useState('monthly');
  const [municipalTaxRate, setMunicipalTaxRate] = useState(1.0);

  const [calculated, setCalculated] = useState({
    loanAmount: 0,
    payment: 0,
    welcomeTax: 0,
    totalInterest: 0,
    schedule: []
  });

  useEffect(() => {
    localStorage.setItem('ff_mortgage', JSON.stringify({ price, downPayment, rate, amortization, frequency, municipalTaxRate }));
    calculateMortgage();
  }, [price, downPayment, rate, amortization, frequency, municipalTaxRate]);

  const calculateMortgage = () => {
    const loanAmount = Math.max(0, price - downPayment);
    if (loanAmount <= 0) {
      setCalculated({ loanAmount: 0, payment: 0, welcomeTax: 0, totalInterest: 0, schedule: [] });
      return;
    }

    // Canadian mortgage compounding: rate compounded semi-annually
    const r_eff = Math.pow(1 + (rate / 100) / 2, 2) - 1;
    const r_monthly = Math.pow(1 + r_eff, 1 / 12) - 1;

    let periodsPerYear = 12;
    let r_period = r_monthly;
    if (frequency === 'weekly') {
      periodsPerYear = 52;
      r_period = Math.pow(1 + r_eff, 1 / 52) - 1;
    } else if (frequency === 'bi-weekly') {
      periodsPerYear = 26;
      r_period = Math.pow(1 + r_eff, 1 / 26) - 1;
    }

    const n_periods = amortization * periodsPerYear;
    const payment = (loanAmount * r_period * Math.pow(1 + r_period, n_periods)) / (Math.pow(1 + r_period, n_periods) - 1);

    let welcomeTax = 0;
    if (price <= 58900) {
      welcomeTax = price * 0.005;
    } else if (price <= 294600) {
      welcomeTax = (58900 * 0.005) + ((price - 58900) * 0.01);
    } else if (price <= 500000) {
      welcomeTax = (58900 * 0.005) + ((294600 - 58900) * 0.01) + ((price - 294600) * 0.015);
    } else {
      welcomeTax = (58900 * 0.005) + ((294600 - 58900) * 0.01) + ((500000 - 294600) * 0.015) + ((price - 500000) * 0.02);
    }

    let balance = loanAmount;
    let totalInterest = 0;
    const schedule = [];

    for (let year = 1; year <= amortization; year++) {
      let principalPaidYear = 0;
      let interestPaidYear = 0;

      for (let p = 0; p < periodsPerYear; p++) {
        const interest = balance * r_period;
        const principal = Math.min(balance, payment - interest);
        interestPaidYear += interest;
        principalPaidYear += principal;
        balance -= principal;
      }

      totalInterest += interestPaidYear;
      schedule.push({
        year,
        principal: principalPaidYear,
        interest: interestPaidYear,
        remaining: Math.max(0, balance)
      });
    }

    setCalculated({
      loanAmount,
      payment,
      welcomeTax,
      totalInterest,
      schedule
    });
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🏠 Simulateur Hypothécaire Québec
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Estimez vos versements hypothécaires et la taxe de bienvenue au Québec.
          </p>
        </div>
        <FolderButton toolId="mortgage_quebec" toolName="SimulateurHypothecaire" localStorageKeys={["ff_mortgage"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Paramètres</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prix de la propriété (CAD)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mise de fonds (CAD)</label>
            <input type="number" value={downPayment} onChange={(e) => setDownPayment(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
              Pourcentage : {price > 0 ? ((downPayment / price) * 100).toFixed(1) : 0}%
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taux d'intérêt annuel (%)</label>
            <input type="number" step="0.01" value={rate} onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Période d'amortissement (années)</label>
            <select value={amortization} onChange={(e) => setAmortization(parseInt(e.target.value))} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              {[5, 10, 15, 20, 25, 30].map(yr => <option key={yr} value={yr}>{yr} ans</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fréquence des versements</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value="monthly">Mensuelle</option>
              <option value="bi-weekly">Toutes les 2 semaines</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Versement ({frequency === 'monthly' ? 'Mensuel' : frequency === 'weekly' ? 'Hebdo' : 'Aux 2 sem.'})</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {calculated.payment.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Montant du prêt</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
                {calculated.loanAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Taxe Mutation (Bienvenue)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                {calculated.welcomeTax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Intérêts totaux payés</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                {calculated.totalInterest.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
          </div>

          {/* Amortization Table */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Tableau d'amortissement (Annuel)</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: 10 }}>Année</th>
                    <th style={{ padding: 10 }}>Principal payé</th>
                    <th style={{ padding: 10 }}>Intérêt payé</th>
                    <th style={{ padding: 10 }}>Solde restant</th>
                  </tr>
                </thead>
                <tbody>
                  {calculated.schedule.map(row => (
                    <tr key={row.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                      <td style={{ padding: 10, fontWeight: 'bold' }}>Année {row.year}</td>
                      <td style={{ padding: 10 }}>{row.principal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td style={{ padding: 10 }}>{row.interest.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td style={{ padding: 10 }}>{row.remaining.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}