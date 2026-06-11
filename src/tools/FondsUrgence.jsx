import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FondsUrgence({ goBack }) {
  const [rent, setRent] = useState(1200);
  const [food, setFood] = useState(450);
  const [utilities, setUtilities] = useState(180);
  const [debts, setDebts] = useState(150);
  const [other, setOther] = useState(200);

  const [targetMonths, setTargetMonths] = useState(6);
  const [currentSavings, setCurrentSavings] = useState(3000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);

  const [result, setResult] = useState({
    monthlyExpenses: 0,
    targetAmount: 0,
    remaining: 0,
    monthsToSave: 0,
    percentage: 0
  });

  useEffect(() => {
    localStorage.setItem('ff_emergency', JSON.stringify({ rent, food, utilities, debts, other, targetMonths, currentSavings, monthlyContribution }));
    calculateEmergencyFund();
  }, [rent, food, utilities, debts, other, targetMonths, currentSavings, monthlyContribution]);

  const calculateEmergencyFund = () => {
    const monthlyExpenses = rent + food + utilities + debts + other;
    const targetAmount = monthlyExpenses * targetMonths;
    const remaining = Math.max(0, targetAmount - currentSavings);
    const monthsToSave = monthlyContribution > 0 ? remaining / monthlyContribution : 0;
    const percentage = targetAmount > 0 ? Math.min(100, (currentSavings / targetAmount) * 100) : 0;

    setResult({
      monthlyExpenses,
      targetAmount,
      remaining,
      monthsToSave,
      percentage
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
            🛡️ Fonds d'Urgence Simulateur
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Calculez et suivez votre coussin de sécurité financière en fonction de vos dépenses incompressibles.
          </p>
        </div>
        <FolderButton toolId="emergency_fund" toolName="FondsUrgence" localStorageKeys={["ff_emergency"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Dépenses Mensuelles</h2>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logement / Loyer / Hypothèque</label>
            <input type="number" value={rent} onChange={(e) => setRent(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épicerie & Alimentation</label>
            <input type="number" value={food} onChange={(e) => setFood(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Télécom / Hydro / Assurances</label>
            <input type="number" value={utilities} onChange={(e) => setUtilities(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remboursement Dettes (Minimaux)</label>
            <input type="number" value={debts} onChange={(e) => setDebts(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Autres dépenses incompressibles</label>
            <input type="number" value={other} onChange={(e) => setOther(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        {/* Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Controls top */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Objectif de couverture</label>
              <select value={targetMonths} onChange={(e) => setTargetMonths(parseInt(e.target.value))} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} mois</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épargne actuelle dédiée</label>
              <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contribution mensuelle</label>
              <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>

          {/* Progress Section */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>Progression du fonds d'urgence</span>
              <span style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 800 }}>{result.percentage.toFixed(0)}%</span>
            </div>
            <div style={{ height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', marginBottom: 20 }}>
              <div style={{ width: result.percentage + '%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', height: '100%', borderRadius: 10 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cible totale ({targetMonths} mois)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
                  {result.targetAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reste à épargner</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                  {result.remaining.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Temps restant estimé</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                  {result.monthsToSave > 0 ? result.monthsToSave.toFixed(1) + ' mois' : 'Cible atteinte! 🎉'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}