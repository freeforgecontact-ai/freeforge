import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function SalaireNetQuebec({ goBack }) {
  const [salaryType, setSalaryType] = useState('annual');
  const [grossAmount, setGrossAmount] = useState(65000);
  const [hourlyWage, setHourlyWage] = useState(25);
  const [hoursPerWeek, setHoursPerWeek] = useState(37.5);
  const [reerContribution, setReerContribution] = useState(0);

  const [netOutput, setNetOutput] = useState({
    grossAnnual: 0,
    fedTax: 0,
    provTax: 0,
    rrq: 0,
    rqap: 0,
    ae: 0,
    totalDeductions: 0,
    netAnnual: 0,
    netMonthly: 0,
    netBiWeekly: 0
  });

  useEffect(() => {
    localStorage.setItem('ff_net_salary', JSON.stringify({ salaryType, grossAmount, hourlyWage, hoursPerWeek, reerContribution }));
    calculateNetSalary();
  }, [salaryType, grossAmount, hourlyWage, hoursPerWeek, reerContribution]);

  const calculateNetSalary = () => {
    const grossAnnual = salaryType === 'annual' ? grossAmount : hourlyWage * hoursPerWeek * 52;
    const taxableIncome = Math.max(0, grossAnnual - reerContribution);

    let fedTax = 0;
    if (taxableIncome <= 55867) {
      fedTax = taxableIncome * 0.15;
    } else if (taxableIncome <= 111733) {
      fedTax = (55867 * 0.15) + ((taxableIncome - 55867) * 0.205);
    } else if (taxableIncome <= 173205) {
      fedTax = (55867 * 0.15) + ((111733 - 55867) * 0.205) + ((taxableIncome - 111733) * 0.26);
    } else {
      fedTax = (55867 * 0.15) + ((111733 - 55867) * 0.205) + ((173205 - 111733) * 0.26) + ((taxableIncome - 173205) * 0.29);
    }
    fedTax = Math.max(0, fedTax - 15000 * 0.15);

    let provTax = 0;
    if (taxableIncome <= 51780) {
      provTax = taxableIncome * 0.14;
    } else if (taxableIncome <= 103545) {
      provTax = (51780 * 0.14) + ((taxableIncome - 51780) * 0.19);
    } else if (taxableIncome <= 126000) {
      provTax = (51780 * 0.14) + ((103545 - 51780) * 0.19) + ((taxableIncome - 103545) * 0.24);
    } else {
      provTax = (51780 * 0.14) + ((103545 - 51780) * 0.19) + ((126000 - 103545) * 0.24) + ((taxableIncome - 126000) * 0.2575);
    }
    provTax = Math.max(0, provTax - 17000 * 0.14);

    const rrq = Math.min(4348, Math.max(0, grossAnnual - 3500) * 0.064);
    const ae = Math.min(880, grossAnnual * 0.0125);
    const rqap = Math.min(490, grossAnnual * 0.00494);

    const totalDeductions = fedTax + provTax + rrq + ae + rqap;
    const netAnnual = Math.max(0, grossAnnual - totalDeductions);

    setNetOutput({
      grossAnnual,
      fedTax,
      provTax,
      rrq,
      rqap,
      ae,
      totalDeductions,
      netAnnual,
      netMonthly: netAnnual / 12,
      netBiWeekly: netAnnual / 26
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
            📊 Calculateur de Salaire Net Québec
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Estimez votre salaire net au Québec après toutes les déductions fiscales et sociales.
          </p>
        </div>
        <FolderButton toolId="salary_quebec" toolName="SalaireNetQuebec" localStorageKeys={["ff_net_salary"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Calculs</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type de rémunération</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setSalaryType('annual')} className={ 'btn-premium ' + (salaryType === 'annual' ? 'btn-primary' : 'btn-secondary') } style={{ flex: 1, padding: 8 }}>
                Annuel
              </button>
              <button type="button" onClick={() => setSalaryType('hourly')} className={ 'btn-premium ' + (salaryType === 'hourly' ? 'btn-primary' : 'btn-secondary') } style={{ flex: 1, padding: 8 }}>
                Horaire
              </button>
            </div>
          </div>

          {salaryType === 'annual' ? (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Salaire Brut Annuel (CAD)</label>
              <input type="number" value={grossAmount} onChange={(e) => setGrossAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taux horaire brut (CAD)</label>
                <input type="number" value={hourlyWage} onChange={(e) => setHourlyWage(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Heures travaillées par semaine</label>
                <input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Déd. REER / Autres abattements (CAD)</label>
            <input type="number" value={reerContribution} onChange={(e) => setReerContribution(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary Net */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salaire Net Annuel</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {netOutput.netAnnual.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salaire Net Mensuel</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
                {netOutput.netMonthly.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salaire Net Bi-Hebdo</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
                {netOutput.netBiWeekly.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Détail des déductions fiscales et sociales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Salaire Brut Total</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{netOutput.grossAnnual.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Impôt Fédéral</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.fedTax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Impôt Provincial (Québec)</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.provTax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Régime des Rentes du Québec (RRQ)</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.rrq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Assurance-Emploi (AE)</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.ae.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>RQAP (Parental)</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.rqap.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: '1.05rem', fontWeight: 'bold' }}>
                <span style={{ color: 'white' }}>Total Déductions</span>
                <span style={{ color: '#ef4444' }}>-{netOutput.totalDeductions.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}