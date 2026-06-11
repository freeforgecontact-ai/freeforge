import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function RemboursementDettes({ goBack }) {
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('ff_debt');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Carte de crédit 1', balance: 3500, interestRate: 19.99, minPayment: 110 },
      { id: '2', name: 'Marge de crédit', balance: 8000, interestRate: 8.5, minPayment: 160 },
      { id: '3', name: 'Prêt Auto', balance: 14000, interestRate: 5.9, minPayment: 320 }
    ];
  });

  const [strategy, setStrategy] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState(250);

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minPay, setMinPay] = useState('');

  const [simulation, setSimulation] = useState({
    totalMonths: 0,
    totalInterestPaid: 0,
    schedule: []
  });

  useEffect(() => {
    localStorage.setItem('ff_debt', JSON.stringify(debts));
    runSimulation();
  }, [debts, strategy, extraPayment]);

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!name || !balance || !rate || !minPay) return;

    const newDebt = {
      id: Date.now().toString(),
      name,
      balance: parseFloat(balance),
      interestRate: parseFloat(rate),
      minPayment: parseFloat(minPay)
    };

    setDebts([...debts, newDebt]);
    setName('');
    setBalance('');
    setRate('');
    setMinPay('');
  };

  const handleDeleteDebt = (id) => {
    if (confirm("Supprimer cette dette ?")) {
      setDebts(debts.filter(d => d.id !== id));
    }
  };

  const runSimulation = () => {
    if (debts.length === 0) {
      setSimulation({ totalMonths: 0, totalInterestPaid: 0, schedule: [] });
      return;
    }

    let activeDebts = debts.map(d => ({ ...d }));
    let months = 0;
    let totalInterest = 0;
    const schedule = [];

    while (activeDebts.some(d => d.balance > 0) && months < 360) {
      months++;
      let interestMonth = 0;
      let availableExtra = parseFloat(extraPayment) || 0;

      if (strategy === 'avalanche') {
        activeDebts.sort((a, b) => b.interestRate - a.interestRate);
      } else {
        activeDebts.sort((a, b) => a.balance - b.balance);
      }

      activeDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * (d.interestRate / 100 / 12);
          interestMonth += interest;
          totalInterest += interest;
          d.balance += interest;

          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
        }
      });

      for (let i = 0; i < activeDebts.length; i++) {
        const d = activeDebts[i];
        if (d.balance > 0 && availableExtra > 0) {
          const applyExtra = Math.min(d.balance, availableExtra);
          d.balance -= applyExtra;
          availableExtra -= applyExtra;
        }
      }

      schedule.push({
        month: months,
        balances: activeDebts.map(d => ({ name: d.name, val: d.balance })),
        interestPaid: interestMonth
      });
    }

    setSimulation({
      totalMonths: months,
      totalInterestPaid: totalInterest,
      schedule
    });
  };

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            💳 Debt Payoff Planner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Organisez le remboursement de vos dettes en comparant les stratégies Avalanche (intérêts élevés) et Boule de Neige (petits montants).
          </p>
        </div>
        <FolderButton toolId="debt_planner" toolName="RemboursementDettes" localStorageKeys={["ff_debt"]} />
      </div>

      {/* Cards stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Encours Total Dettes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
            {totalBalance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remboursement estimé</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {simulation.totalMonths} mois
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Intérêts Totaux Estimés</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {simulation.totalInterestPaid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* List of debts & simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Vos Dettes</h2>
              <div style={{ display: 'flex', gap: 8 }} className="no-print">
                <button type="button" onClick={() => setStrategy('avalanche')} className={ 'btn-premium ' + (strategy === 'avalanche' ? 'btn-primary' : 'btn-secondary') } style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  ⚡ Avalanche
                </button>
                <button type="button" onClick={() => setStrategy('snowball')} className={ 'btn-premium ' + (strategy === 'snowball' ? 'btn-primary' : 'btn-secondary') } style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  ❄️ Boule de Neige
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: 12 }}>Nom du compte</th>
                  <th style={{ padding: 12 }}>Solde Dû</th>
                  <th style={{ padding: 12 }}>Taux d'intérêt</th>
                  <th style={{ padding: 12 }}>Paiement Min.</th>
                  <th style={{ padding: 12 }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Aucune dette enregistrée. Ajoutez vos comptes à rembourser.
                    </td>
                  </tr>
                ) : (
                  debts.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                      <td style={{ padding: 12, fontWeight: 'bold', color: 'white' }}>{d.name}</td>
                      <td style={{ padding: 12 }}>{d.balance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td style={{ padding: 12 }}>{d.interestRate}%</td>
                      <td style={{ padding: 12 }}>{d.minPayment.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td style={{ padding: 12 }} className="no-print">
                        <button onClick={() => handleDeleteDebt(d.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input Add Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paiement Supplémentaire Mensuel</label>
            <input type="number" value={extraPayment} onChange={(e) => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>Ajouter un compte de dette</h3>
          <form onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom (ex: Visa Desjardins)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Solde Restant ($)</label>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="input-premium" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taux d'intérêt (%)</label>
              <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className="input-premium" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paiement Minimum Requis ($)</label>
              <input type="number" value={minPay} onChange={(e) => setMinPay(e.target.value)} className="input-premium" required style={{ width: '100%' }} />
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter la dette
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}