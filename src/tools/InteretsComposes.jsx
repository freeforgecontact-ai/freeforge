import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function InteretsComposes({ goBack }) {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(250);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(15);
  const [compounding, setCompounding] = useState(12);

  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState({ principal: 0, interest: 0, final: 0 });

  useEffect(() => {
    localStorage.setItem('ff_compound', JSON.stringify({ initial, monthly, rate, years, compounding }));
    calculateCompound();
  }, [initial, monthly, rate, years, compounding]);

  const calculateCompound = () => {
    const data = [];
    let balance = initial;
    let totalInvested = initial;
    const r = rate / 100;
    const frequency = compounding;

    for (let yr = 1; yr <= years; yr++) {
      for (let m = 0; m < 12; m++) {
        balance += monthly;
        totalInvested += monthly;

        if (frequency === 12) {
          balance *= (1 + r / 12);
        } else if (frequency === 4 && (m + 1) % 3 === 0) {
          balance *= (1 + r / 4);
        } else if (frequency === 1 && m === 11) {
          balance *= (1 + r);
        }
      }

      data.push({
        year: yr,
        principal: totalInvested,
        interest: Math.max(0, balance - totalInvested),
        total: balance
      });
    }

    setChartData(data);
    setTotals({
      principal: totalInvested,
      interest: Math.max(0, balance - totalInvested),
      final: balance
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
            📈 Calculateur d'Intérêts Composés
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Visualisez la croissance à long terme de vos investissements grâce aux intérêts composés.
          </p>
        </div>
        <FolderButton toolId="compound_calculator" toolName="InteretsComposes" localStorageKeys={["ff_compound"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Paramètres</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dépôt Initial (CAD)</label>
            <input type="number" value={initial} onChange={(e) => setInitial(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contribution Mensuelle (CAD)</label>
            <input type="number" value={monthly} onChange={(e) => setMonthly(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taux d'intérêt annuel (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Horizon temporel (années)</label>
            <input type="number" value={years} onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fréquence de capitalisation</label>
            <select value={compounding} onChange={(e) => setCompounding(parseInt(e.target.value))} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value={12}>Mensuelle</option>
              <option value={4}>Trimestrielle</option>
              <option value={1}>Annuelle</option>
            </select>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valeur Finale Projetée</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {totals.final.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Investi (Capital)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
                {totals.principal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Intérêts cumulés</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                {totals.interest.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
          </div>

          {/* Graphical representation */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Croissance du capital</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chartData.filter((_, idx) => idx % Math.max(1, Math.round(years / 10)) === 0 || idx === chartData.length - 1).map(row => {
                const maxVal = totals.final;
                const principalWidth = (row.principal / maxVal) * 100;
                const interestWidth = (row.interest / maxVal) * 100;
                return (
                  <div key={row.year} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Année {row.year}</span>
                    <div style={{ height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ width: principalWidth + '%', backgroundColor: '#3b82f6', transition: 'width 0.3s' }} title="Principal" />
                      <div style={{ width: interestWidth + '%', backgroundColor: '#10b981', transition: 'width 0.3s' }} title="Intérêts" />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600, textAlign: 'right' }}>
                      {row.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: '0.8rem', justifyContent: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#3b82f6' }} /> Capital Investi
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10b981' }} /> Intérêts Composés
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}