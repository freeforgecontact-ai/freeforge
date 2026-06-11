import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function EpargneRetraite({ goBack }) {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(25000);
  
  // Monthly savings split per vehicle
  const [monthlyREER, setMonthlyREER] = useState(200);
  const [monthlyCELI, setMonthlyCELI] = useState(150);
  const [monthlyCELIAPP, setMonthlyCELIAPP] = useState(100);

  const [expectedReturn, setExpectedReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(2);
  const [monthlySpending, setMonthlySpending] = useState(3000);

  const [result, setResult] = useState({
    totalSavings: 0,
    inflationAdjusted: 0,
    willLastYears: 0,
    monthlyPayout: 0,
    reerPart: 0,
    celiPart: 0,
    celiappPart: 0,
    schedule: []
  });

  const totalMonthlySavings = monthlyREER + monthlyCELI + monthlyCELIAPP;

  // 2026 limits warnings
  const annualREER = monthlyREER * 12;
  const annualCELI = monthlyCELI * 12;
  const annualCELIAPP = monthlyCELIAPP * 12;

  const reerLimitExceeded = annualREER > 32490;
  const celiLimitExceeded = annualCELI > 7000;
  const celiappLimitExceeded = annualCELIAPP > 8000;

  const calculateRetirement = () => {
    let reer = currentSavings;
    let celi = 0;
    let celiapp = 0;
    let lifetimeCeliAppContribution = 0;

    const rate = expectedReturn / 100;
    const infl = inflationRate / 100;
    const schedule = [];

    const years = retirementAge - currentAge;
    
    for (let y = 1; y <= Math.max(1, years); y++) {
      // 1. Grow existing balances
      reer = reer * (1 + rate);
      celi = celi * (1 + rate);
      celiapp = celiapp * (1 + rate);

      // 2. Add contributions
      reer += monthlyREER * 12;
      celi += monthlyCELI * 12;

      // CELIAPP lifetime cap of $40,000 contribution
      if (lifetimeCeliAppContribution < 40000) {
        const remainingContributionRoom = 40000 - lifetimeCeliAppContribution;
        const currentYearContribution = Math.min(monthlyCELIAPP * 12, remainingContributionRoom);
        celiapp += currentYearContribution;
        lifetimeCeliAppContribution += currentYearContribution;
      }

      const totalNominal = reer + celi + celiapp;
      const totalReal = totalNominal / Math.pow(1 + infl, y);

      schedule.push({
        age: currentAge + y,
        nominal: totalNominal,
        real: totalReal,
        reer,
        celi,
        celiapp
      });
    }

    const finalSchedule = schedule.length > 0 ? schedule : [{ age: currentAge, nominal: currentSavings, real: currentSavings, reer, celi, celiapp }];
    const finalRow = finalSchedule[finalSchedule.length - 1];
    
    // Calculate how long savings will last in retirement (real rates)
    const realSavings = finalRow.real;
    const realReturn = Math.max(0.001, rate - infl);
    let tempBalance = realSavings;
    let willLastYears = 0;

    while (tempBalance > 0 && willLastYears < 100) {
      tempBalance = tempBalance * (1 + realReturn);
      tempBalance -= monthlySpending * 12;
      if (tempBalance >= 0) {
        willLastYears++;
      } else {
        // partial year
        if (monthlySpending > 0) {
          willLastYears += Math.max(0, tempBalance + (monthlySpending * 12)) / (monthlySpending * 12);
        }
        break;
      }
    }
    
    willLastYears = Math.round(willLastYears * 10) / 10;

    // Perpetual payout if they only withdraw growth
    const monthlyPayout = (realSavings * realReturn) / 12;

    setResult({
      totalSavings: finalRow.nominal,
      inflationAdjusted: finalRow.real,
      willLastYears,
      monthlyPayout,
      reerPart: finalRow.reer,
      celiPart: finalRow.celi,
      celiappPart: finalRow.celiapp,
      schedule: finalSchedule
    });
  };

  useEffect(() => {
    localStorage.setItem(
      'ff_retirement_v2', 
      JSON.stringify({ 
        currentAge, retirementAge, currentSavings, 
        monthlyREER, monthlyCELI, monthlyCELIAPP, 
        expectedReturn, inflationRate, monthlySpending 
      })
    );
    calculateRetirement();
  }, [currentAge, retirementAge, currentSavings, monthlyREER, monthlyCELI, monthlyCELIAPP, expectedReturn, inflationRate, monthlySpending]);

  // Try to load saved state
  useEffect(() => {
    const saved = localStorage.getItem('ff_retirement_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentAge) setCurrentAge(Number(parsed.currentAge));
        if (parsed.retirementAge) setRetirementAge(Number(parsed.retirementAge));
        if (parsed.currentSavings) setCurrentSavings(Number(parsed.currentSavings));
        if (parsed.monthlyREER) setMonthlyREER(Number(parsed.monthlyREER));
        if (parsed.monthlyCELI) setMonthlyCELI(Number(parsed.monthlyCELI));
        if (parsed.monthlyCELIAPP) setMonthlyCELIAPP(Number(parsed.monthlyCELIAPP));
        if (parsed.expectedReturn) setExpectedReturn(Number(parsed.expectedReturn));
        if (parsed.inflationRate) setInflationRate(Number(parsed.inflationRate));
        if (parsed.monthlySpending) setMonthlySpending(Number(parsed.monthlySpending));
      } catch (e) {
        console.error("Failed to parse retirement settings:", e);
      }
    }
  }, []);

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
            Projetez la croissance de votre épargne selon les véhicules canadiens (REER, CELI, CELIAPP).
          </p>
        </div>
        <FolderButton toolId="retirement_planner" toolName="EpargneRetraite" localStorageKeys={["ff_retirement_v2"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* Input */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Paramètres de Projection</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Âge Actuel</label>
              <input type="number" min="1" max="100" value={currentAge} onChange={(e) => setCurrentAge(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Âge de Retraite</label>
              <input type="number" min={currentAge} max="110" value={retirementAge} onChange={(e) => setRetirementAge(Math.max(currentAge + 1, parseInt(e.target.value) || currentAge + 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épargne Initiale Déjà Constituée (CAD)</label>
            <input type="number" min="0" value={currentSavings} onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Épargne Mensuelle par Véhicule</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <label style={{ color: '#f43f5e' }}>REER ($ / mois)</label>
                  <span>Max 2026: 32 490$ / an</span>
                </div>
                <input type="number" min="0" value={monthlyREER} onChange={(e) => setMonthlyREER(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
                {reerLimitExceeded && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠️ Dépasse la limite absolue REER 2026 de 32 490$.</span>}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <label style={{ color: '#3b82f6' }}>CELI ($ / mois)</label>
                  <span>Max 2026: 7 000$ / an</span>
                </div>
                <input type="number" min="0" value={monthlyCELI} onChange={(e) => setMonthlyCELI(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
                {celiLimitExceeded && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠️ Dépasse la limite annuelle CELI 2026 de 7 000$.</span>}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <label style={{ color: '#eab308' }}>CELIAPP ($ / mois)</label>
                  <span>Max: 8 000$ / an (Capped à 40k$)</span>
                </div>
                <input type="number" min="0" value={monthlyCELIAPP} onChange={(e) => setMonthlyCELIAPP(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
                {celiappLimitExceeded && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠️ Dépasse la limite annuelle CELIAPP de 8 000$.</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rendement Annuel (%)</label>
              <input type="number" min="0" max="30" step="0.1" value={expectedReturn} onChange={(e) => setExpectedReturn(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inflation (%)</label>
              <input type="number" min="0" max="15" step="0.1" value={inflationRate} onChange={(e) => setInflationRate(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dépense Mensuelle Cible ( CAD en dollars d'aujourd'hui )</label>
            <input type="number" min="0" value={monthlySpending} onChange={(e) => setMonthlySpending(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Épargne Réelle (Ajustée à l'Inflation)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {result.inflationAdjusted.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Nominal brut: {result.totalSavings.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Durée de l'Épargne (Retraite)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: result.willLastYears >= 25 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                {result.willLastYears >= 99 ? '100 ans et +' : result.willLastYears + ' ans'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Pour dépense de {monthlySpending.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}/mois
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rente Relle Mensuelle Sans Épuiser</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                {result.monthlyPayout.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Basé sur rendement réel de {Math.round((expectedReturn - inflationRate) * 10) / 10}%
              </div>
            </div>
          </div>

          {/* Visual Breakdown of Assets */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Répartition du Portefeuille à {retirementAge} ans</h3>
            {result.totalSavings > 0 ? (
              <div>
                <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                  {result.reerPart > 0 && (
                    <div style={{ 
                      width: `${(result.reerPart / result.totalSavings) * 100}%`, 
                      backgroundColor: '#f43f5e', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      color: 'white' 
                    }} title={`REER: ${Math.round((result.reerPart / result.totalSavings) * 100)}%`}>
                      {Math.round((result.reerPart / result.totalSavings) * 100) >= 10 ? 'REER' : ''}
                    </div>
                  )}
                  {result.celiPart > 0 && (
                    <div style={{ 
                      width: `${(result.celiPart / result.totalSavings) * 100}%`, 
                      backgroundColor: '#3b82f6', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      color: 'white' 
                    }} title={`CELI: ${Math.round((result.celiPart / result.totalSavings) * 100)}%`}>
                      {Math.round((result.celiPart / result.totalSavings) * 100) >= 10 ? 'CELI' : ''}
                    </div>
                  )}
                  {result.celiappPart > 0 && (
                    <div style={{ 
                      width: `${(result.celiappPart / result.totalSavings) * 100}%`, 
                      backgroundColor: '#eab308', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      color: 'white' 
                    }} title={`CELIAPP: ${Math.round((result.celiappPart / result.totalSavings) * 100)}%`}>
                      {Math.round((result.celiappPart / result.totalSavings) * 100) >= 10 ? 'CELIAPP' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f43f5e', marginRight: 6 }}></span>
                    REER: {result.reerPart.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3b82f6', marginRight: 6 }}></span>
                    CELI: {result.celiPart.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308', marginRight: 6 }}></span>
                    CELIAPP: {result.celiappPart.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>Aucune épargne accumulée.</p>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Évolution Annuelle Projetée</h3>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: 10 }}>Âge</th>
                    <th style={{ padding: 10 }}>Valeur Nominale</th>
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