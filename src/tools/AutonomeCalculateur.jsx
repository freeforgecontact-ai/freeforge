import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function AutonomeCalculateur({ goBack }) {
  const [grossIncome, setGrossIncome] = useState('65000');
  const [status, setStatus] = useState('autonome'); // 'autonome' | 'salarie'
  
  // Computed values
  const [fedTax, setFedTax] = useState(0);
  const [provTax, setProvTax] = useState(0);
  const [rrqContribution, setRrqContribution] = useState(0);
  const [rqapContribution, setRqapContribution] = useState(0);
  const [ramqContribution, setRamqContribution] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  // Progressive Tax Bracket Calculations
  const calculateFederalTax = (income) => {
    // 2026 approximate federal tax brackets
    const brackets = [
      { limit: 55867, rate: 0.15 },
      { limit: 111733, rate: 0.205 },
      { limit: 173205, rate: 0.26 },
      { limit: 246752, rate: 0.29 },
      { limit: Infinity, rate: 0.33 }
    ];

    let tax = 0;
    let remaining = income;
    let previousLimit = 0;

    for (let i = 0; i < brackets.length; i++) {
      const { limit, rate } = brackets[i];
      const range = limit - previousLimit;
      const taxableInRange = Math.min(remaining, range);
      
      tax += taxableInRange * rate;
      remaining -= taxableInRange;
      previousLimit = limit;
      
      if (remaining <= 0) break;
    }
    // Crédit d'impôt personnel de base fédéral (~16 129 $ × 15 %), puis
    // abattement du Québec de 16,5 % accordé aux résidents du Québec.
    const fedBasicCredit = 16129 * 0.15;
    const afterCredit = Math.max(0, tax - fedBasicCredit);
    return afterCredit * (1 - 0.165);
  };

  const calculateProvincialTax = (income) => {
    // 2026 approximate Quebec provincial tax brackets
    const brackets = [
      { limit: 51780, rate: 0.14 },
      { limit: 103545, rate: 0.19 },
      { limit: 126000, rate: 0.24 },
      { limit: Infinity, rate: 0.2575 }
    ];

    let tax = 0;
    let remaining = income;
    let previousLimit = 0;

    for (let i = 0; i < brackets.length; i++) {
      const { limit, rate } = brackets[i];
      const range = limit - previousLimit;
      const taxableInRange = Math.min(remaining, range);
      
      tax += taxableInRange * rate;
      remaining -= taxableInRange;
      previousLimit = limit;
      
      if (remaining <= 0) break;
    }
    // Crédit d'impôt personnel de base du Québec (~18 571 $ × 14 %).
    const provBasicCredit = 18571 * 0.14;
    return Math.max(0, tax - provBasicCredit);
  };

  useEffect(() => {
    const income = parseFloat(grossIncome) || 0;
    
    // Federal and Provincial Taxes
    const computedFed = calculateFederalTax(income);
    const computedProv = calculateProvincialTax(income);
    
    // RRQ (QPP) Contributions
    // Salaried employee pays 6.4%, Freelancer pays 12.8% on income above $3500 up to Max
    let rrq = 0;
    const rrqExemption = 3500;
    const rrqMaxIncome = 68500; // standard ceiling
    if (income > rrqExemption) {
      const rrqBase = Math.min(income, rrqMaxIncome) - rrqExemption;
      const rrqRate = status === 'autonome' ? 0.128 : 0.064;
      rrq = rrqBase * rrqRate;
    }

    // RQAP (QPIP) Contributions
    // Salaried: 0.494% up to max ceiling ($97000), Freelancer: 0.873% up to ceiling
    const rqapCeiling = 97000;
    const rqapRate = status === 'autonome' ? 0.00873 : 0.00494;
    const rqap = Math.min(income, rqapCeiling) * rqapRate;

    // RAMQ (Drug Insurance) Contribution (Simplified tiered flat fee based on income)
    let ramq = 0;
    if (income > 28000) {
      ramq = Math.min(730, (income - 28000) * 0.02);
    }

    const deductions = computedFed + computedProv + rrq + rqap + ramq;
    const net = Math.max(0, income - deductions);

    setFedTax(computedFed);
    setProvTax(computedProv);
    setRrqContribution(rrq);
    setRqapContribution(rqap);
    setRamqContribution(ramq);
    setTotalDeductions(deductions);
    setNetIncome(net);
  }, [grossIncome, status]);

  const formatCurrency = (val) => {
    return val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
  };

  // Percentages for chart representation
  const gross = parseFloat(grossIncome) || 1;
  const netPct = Math.round((netIncome / gross) * 100) || 0;
  const fedPct = Math.round((fedTax / gross) * 100) || 0;
  const provPct = Math.round((provTax / gross) * 100) || 0;
  const rrqPct = Math.round((rrqContribution / gross) * 100) || 0;
  const rqapPct = Math.round((rqapContribution / gross) * 100) || 0;
  const ramqPct = Math.round((ramqContribution / gross) * 100) || 0;

  return (
    <div>
      {/* Back navigation */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Comptabilité</span>
        <FolderButton toolId="autonome" toolName="Simulateur Impôt & Cotisations" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Simulateur Impôt & Cotisations (Québec)</h1>
      <p className="page-subtitle">Estimez vos déductions fiscales provinciales, fédérales et vos cotisations sociales au Québec (2026).</p>

      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Input Parameters column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card-premium" style={{ cursor: 'default', gap: 18 }}>
            <h2 className="card-title" style={{ fontSize: '1.1rem' }}>⚙️ Revenus & Statut</h2>
            
            {/* Status Selector */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
              <button 
                className={`btn-premium ${status === 'autonome' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: 6 }}
                onClick={() => setStatus('autonome')}
              >
                Travailleur Autonome
              </button>
              <button 
                className={`btn-premium ${status === 'salarie' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: 6 }}
                onClick={() => setStatus('salarie')}
              >
                Salarié Employé
              </button>
            </div>

            {/* Income Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {status === 'autonome' ? 'Chiffre d\'affaires annuel estimé ($)' : 'Salaire annuel brut ($)'}
              </label>
              <input 
                type="number"
                min="0"
                className="input-premium"
                value={grossIncome}
                onChange={e => setGrossIncome(e.target.value)}
                placeholder="Ex: 65000"
              />
            </div>

            {/* Info note */}
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              💡 <strong>Remarque</strong> : Les travailleurs autonomes paient la part double de la cotisation RRQ (QPP) car ils assument les rôles d'employeur et d'employé. Ils bénéficient toutefois de déductions de dépenses d'entreprise non incluses dans cette simulation.
            </div>
          </div>
        </div>

        {/* Results column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card-premium" style={{ cursor: 'default', gap: 20 }}>
            <h2 className="card-title" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>📊 Revenu disponible net</h2>

            {/* Visual Progress Bar Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Revenu net après impôts : {netPct}%</span>
                <span style={{ color: 'var(--accent)' }}>{formatCurrency(netIncome)}</span>
              </div>
              
              {/* Stacked Bar Chart */}
              <div style={{ width: '100%', height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${netPct}%`, height: '100%', backgroundColor: 'var(--accent)', transition: 'width 0.3s ease' }} title={`Revenu net: ${netPct}%`} />
                <div style={{ width: `${fedPct}%`, height: '100%', backgroundColor: 'var(--secondary)', transition: 'width 0.3s ease' }} title={`Impôt fédéral: ${fedPct}%`} />
                <div style={{ width: `${provPct}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s ease' }} title={`Impôt provincial: ${provPct}%`} />
                <div style={{ width: `${rrqPct + rqapPct + ramqPct}%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.3s ease' }} title={`Cotisations: ${rrqPct + rqapPct + ramqPct}%`} />
              </div>
            </div>

            {/* Grid details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Revenu annuel brut</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(grossIncome) || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--secondary)' }} />
                  Impôt fédéral (Canada)
                </span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(fedTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  Impôt provincial (Québec)
                </span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(provTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Cotisation RRQ
                </span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(rrqContribution)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cotisation RQAP</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(rqapContribution)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cotisation RAMQ</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(ramqContribution)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent)' }}>
                <span>Revenu Net Final disponible</span>
                <span>{formatCurrency(netIncome)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
