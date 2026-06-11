import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function EpargneRetraite({ goBack }) {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(25000);
  const [monthlySavings, setMonthlySavings] = useState(400);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(2);
  const [monthlySpending, setMonthlySpending] = useState(3000);

  const [result, setResult] = useState({
    totalSavings: 0,
    inflationAdjusted: 0,
    willLastYears: 0,
    monthlyPayout: 0,
    schedule: []
  });

  useEffect(() => {
    localStorage.setItem('ff_retirement', JSON.stringify({ currentAge, retirementAge, currentSavings, monthlySavings, expectedReturn, inflationRate, monthlySpending }));
    calculateRetirement();
  }, [currentAge, retirementAge, currentSavings, monthlySavings, expectedReturn, inflationRate, monthlySpending]);

  const calculateRetirement = () => {
    const yearsToRetire = Math.max(0, retirementAge - currentAge);
    const realRate = (expectedReturn - inflationRate) / 100;

    let balance = currentSavings;
    let balanceNominal = currentSavings;
    const schedule = [];

    for (let yr = 1; yr <= yearsToRetire; yr++) {
      for (let m = 0; m < 12; m++) {
        balance += monthlySavings;
        balance *= (1 + realRate / 12);

        balanceNominal += monthlySavings;
        balanceNominal *= (1 + expectedReturn / 100 / 12);
      }
      schedule.push({
        year: yr,
        age: parseInt(currentAge) + yr,
        nominal: balanceNominal,
        real: balance
      });
    }

    const annualSpendingReal = monthlySpending * 12;
    let retirementBalance = balance;
    let yearsLasted = 0;
    while (retirementBalance > annualSpendingReal && yearsLasted < 50) {
      retirementBalance -= annualSpendingReal;
      retirementBalance *= (1 + realRate);
      yearsLasted++;
    }

    setResult({
      totalSavings: balanceNominal,
      inflationAdjusted: balance,
      willLastYears: yearsLasted,
      monthlyPayout: (balance * realRate) / 12,
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
            🧓 Planificateur de Retraite
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Projetez la croissance de votre épargne et vérifiez si elle couvrira vos besoins de retraite.
          </p>
        </div>
        <FolderButton toolId="retirement_planner" toolName="EpargneRetraite" localStorageKeys={["ff_retirement"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Input */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Paramètres</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Âge Actuel</label>
              <input type="number" value={currentAge} onChange={(e) => setCurrentAge(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Âge Retraite</label>
              <input type="number" value={retirementAge} onChange={(e) => setRetirementAge(Math.max(currentAge, parseInt(e.target.value) || currentAge))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épargne Actuelle (CAD)</label>
            <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épargne Mensuelle Récurrente</label>
            <input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rendement (%)</label>
              <input type="number" value={expectedReturn} onChange={(e) => setExpectedReturn(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inflation (%)</label>
              <input type="number" value={inflationRate} onChange={(e) => setInflationRate(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dépense mensuelle cible retraite</label>
            <input type="number" value={monthlySpending} onChange={(e) => setMonthlySpending(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Épargne Réelle (Ajustée Inflation)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {result.inflationAdjusted.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Durée de l'épargne (Retraite)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: result.willLastYears >= 25 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                {result.willLastYears >= 50 ? '50 ans et +' : result.willLastYears + ' ans'}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rente Perpetuelle Réelle / mois</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                {result.monthlyPayout.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Évolution annuelle projetée</h3>
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: 10 }}>Âge</th>
                    <th style={{ padding: 10 }}>Valeur Nominale (Brute)</th>
                    <th style={{ padding: 10 }}>Valeur Réelle (Ajustée)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map(row => (
                    <tr key={row.age} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                      <td style={{ padding: 10, fontWeight: 'bold' }}>{row.age} ans</td>
                      <td style={{ padding: 10 }}>{row.nominal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</td>
                      <td style={{ padding: 10, color: '#10b981' }}>{row.real.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}</td>
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