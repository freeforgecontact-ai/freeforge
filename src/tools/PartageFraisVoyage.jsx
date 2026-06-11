import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function PartageFraisVoyage({ goBack }) {
  const [travelers, setTravelers] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_travelers');
      return saved ? JSON.parse(saved) : ['Alex', 'Sophie', 'Marc'];
    } catch (e) {
      console.error("Error reading ff_travelers", e);
      return ['Alex', 'Sophie', 'Marc'];
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_travel_split');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Hébergement Airbnb', amount: 450, paidBy: 'Alex', splitBetween: ['Alex', 'Sophie', 'Marc'], splitType: 'equal', customSplits: {} },
        { id: '2', name: 'Épicerie Chalet', amount: 120, paidBy: 'Sophie', splitBetween: ['Alex', 'Sophie', 'Marc'], splitType: 'equal', customSplits: {} }
      ];
    } catch (e) {
      console.error("Error reading ff_travel_split", e);
      return [];
    }
  });

  const [newTraveler, setNewTraveler] = useState('');
  
  // Expense fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('Alex');
  const [splitBetween, setSplitBetween] = useState(['Alex', 'Sophie', 'Marc']);
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'amount' | 'weight'
  const [customSplits, setCustomSplits] = useState({}); // { [traveler]: value }

  // Sync state
  useEffect(() => {
    localStorage.setItem('ff_travelers', JSON.stringify(travelers));
    // Default the payer to first traveler if list changes
    if (travelers.length > 0 && !travelers.includes(paidBy)) {
      setPaidBy(travelers[0]);
    }
  }, [travelers]);

  useEffect(() => {
    localStorage.setItem('ff_travel_split', JSON.stringify(expenses));
  }, [expenses]);

  // Sync split checkboxes with travelers list
  useEffect(() => {
    setSplitBetween(travelers);
  }, [travelers]);

  // Default values when split type or splitBetween changes
  useEffect(() => {
    const nextSplits = { ...customSplits };
    splitBetween.forEach(t => {
      if (nextSplits[t] === undefined) {
        nextSplits[t] = splitType === 'weight' ? '1' : '';
      }
    });
    setCustomSplits(nextSplits);
  }, [splitBetween, splitType]);

  const handleAddTraveler = (e) => {
    e.preventDefault();
    const cleanName = newTraveler.trim();
    if (!cleanName || travelers.includes(cleanName)) return;
    setTravelers([...travelers, cleanName]);
    setNewTraveler('');
  };

  const handleDeleteTraveler = (tName) => {
    if (travelers.length <= 1) {
      alert("Il doit y avoir au moins 1 voyageur.");
      return;
    }
    if (confirm(`Voulez-vous supprimer ${tName} ? Les factures associées seront nettoyées.`)) {
      setTravelers(travelers.filter(t => t !== tName));
      // Remove traveler from existing splits
      setExpenses(prev => {
        return prev.map(exp => ({
          ...exp,
          splitBetween: exp.splitBetween.filter(t => t !== tName),
          customSplits: exp.customSplits ? Object.fromEntries(
            Object.entries(exp.customSplits).filter(([k]) => k !== tName)
          ) : {}
        })).filter(exp => exp.paidBy !== tName && exp.splitBetween.length > 0);
      });
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!name || !amount || splitBetween.length === 0) {
      alert("Veuillez remplir le nom, le montant, et sélectionner au moins 1 bénéficiaire.");
      return;
    }

    const floatAmount = parseFloat(amount);
    const splits = {};

    if (splitType === 'amount') {
      let sum = 0;
      for (const t of splitBetween) {
        const val = parseFloat(customSplits[t]) || 0;
        if (val <= 0) {
          alert(`Veuillez entrer un montant valide pour ${t}`);
          return;
        }
        splits[t] = val;
        sum += val;
      }
      if (Math.abs(sum - floatAmount) > 0.02) {
        alert(`La somme des montants individuels (${sum.toFixed(2)} $) doit être égale au montant total de la facture (${floatAmount.toFixed(2)} $).`);
        return;
      }
    } else if (splitType === 'weight') {
      let totalWeight = 0;
      for (const t of splitBetween) {
        const val = parseFloat(customSplits[t]) || 0;
        if (val <= 0) {
          alert(`Veuillez entrer une part valide pour ${t}`);
          return;
        }
        splits[t] = val;
        totalWeight += val;
      }
      if (totalWeight <= 0) {
        alert("La somme des parts doit être supérieure à 0.");
        return;
      }
    }

    const newExpense = {
      id: Date.now().toString(),
      name,
      amount: floatAmount,
      paidBy,
      splitBetween: [...splitBetween],
      splitType,
      customSplits: splits
    };

    setExpenses([...expenses, newExpense]);
    setName('');
    setAmount('');
    setSplitType('equal');
    setCustomSplits({});
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleToggleBeneficiary = (tName) => {
    if (splitBetween.includes(tName)) {
      setSplitBetween(splitBetween.filter(t => t !== tName));
    } else {
      setSplitBetween([...splitBetween, tName]);
    }
  };

  // 1. Calculate Net Balances
  const getBalances = () => {
    const balances = {};
    travelers.forEach(t => {
      balances[t] = 0;
    });

    expenses.forEach(exp => {
      const payer = exp.paidBy;
      const amount = exp.amount;
      const beneficiaries = exp.splitBetween;
      
      if (beneficiaries.length === 0) return;

      const type = exp.splitType || 'equal';
      const splits = exp.customSplits || {};

      if (type === 'equal') {
        const share = amount / beneficiaries.length;
        beneficiaries.forEach(b => {
          if (balances[b] !== undefined) {
            balances[b] -= share;
          }
        });
      } else if (type === 'amount') {
        beneficiaries.forEach(b => {
          const share = parseFloat(splits[b]) || 0;
          if (balances[b] !== undefined) {
            balances[b] -= share;
          }
        });
      } else if (type === 'weight') {
        const totalWeight = beneficiaries.reduce((sum, b) => sum + (parseFloat(splits[b]) || 0), 0) || 1;
        beneficiaries.forEach(b => {
          const weight = parseFloat(splits[b]) || 0;
          const share = amount * (weight / totalWeight);
          if (balances[b] !== undefined) {
            balances[b] -= share;
          }
        });
      }

      // Add paid amount to payer
      if (balances[payer] !== undefined) {
        balances[payer] += amount;
      }
    });

    return balances;
  };

  // 2. Resolve debts using greedy optimization algorithm
  const getSettlements = () => {
    const balances = getBalances();
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(t => {
      const bal = balances[t];
      if (bal < -0.01) {
        debtors.push({ name: t, balance: bal });
      } else if (bal > 0.01) {
        creditors.push({ name: t, balance: bal });
      }
    });

    // Sort: debtors (most negative first), creditors (most positive first)
    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const settlements = [];
    let dIdx = 0;
    let cIdx = 0;

    // Shallow copy balances for tracking
    const tempDebtors = debtors.map(d => ({ ...d }));
    const tempCreditors = creditors.map(c => ({ ...c }));

    while (dIdx < tempDebtors.length && cIdx < tempCreditors.length) {
      const debtor = tempDebtors[dIdx];
      const creditor = tempCreditors[cIdx];

      const amountToPay = Math.min(-debtor.balance, creditor.balance);
      
      if (amountToPay > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: amountToPay
        });
      }

      debtor.balance += amountToPay;
      creditor.balance -= amountToPay;

      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }

    return settlements;
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balances = getBalances();
  const settlements = getSettlements();

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🤝 Travel Expense Splitter
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Partagez équitablement les frais de voyage, gérez des groupes de N personnes et simplifiez les remboursements.
          </p>
        </div>
        <FolderButton toolId="travel_split" toolName="PartageFraisVoyage" localStorageKeys={["ff_travel_split", "ff_travelers"]} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dépenses Totales</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
            {total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Membres du voyage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
            {travelers.length} voyageurs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transactions suggérées</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {settlements.length > 0 ? settlements.map((s, idx) => (
              <div key={idx} style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>
                👉 {s.from} doit payer {s.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} à {s.to}
              </div>
            )) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Équilibre parfait !</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Manage Travelers */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>👥 Gérer les voyageurs</h3>
          
          <form onSubmit={handleAddTraveler} style={{ display: 'flex', gap: 6 }}>
            <input 
              type="text" 
              value={newTraveler} 
              onChange={e => setNewTraveler(e.target.value)} 
              placeholder="Nom..." 
              className="input-premium" 
              style={{ flex: 1, padding: 8 }} 
            />
            <button type="submit" className="btn-premium btn-primary" style={{ padding: '8px 12px' }}>+</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {travelers.map(t => {
              const bal = balances[t] || 0;
              return (
                <div 
                  key={t} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 10px', 
                    backgroundColor: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 8 
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>{t}</span>
                    <span style={{ fontSize: '0.75rem', color: bal > 0.01 ? '#10b981' : bal < -0.01 ? '#ef4444' : 'var(--text-muted)' }}>
                      {bal > 0.01 ? `+${bal.toFixed(2)} $` : bal < -0.01 ? `${bal.toFixed(2)} $` : 'Équilibré'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTraveler(t)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Expenses List */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white', margin: 0 }}>Détail des factures</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <th style={{ padding: 10 }}>Description</th>
                  <th style={{ padding: 10 }}>Payé par</th>
                  <th style={{ padding: 10 }}>Bénéficiaires (Répartition)</th>
                  <th style={{ padding: 10 }}>Montant</th>
                  <th style={{ padding: 10 }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune dépense enregistrée.</td>
                  </tr>
                ) : (
                  expenses.map(e => {
                    const isAll = e.splitBetween.length === travelers.length;
                    const formatSplits = () => {
                      if (!e.splitType || e.splitType === 'equal') {
                        return isAll ? 'Tous (égal)' : `${e.splitBetween.join(', ')} (égal)`;
                      }
                      return e.splitBetween.map(t => {
                        const val = e.customSplits ? e.customSplits[t] || 0 : 0;
                        return `${t} (${val}${e.splitType === 'amount' ? '$' : ' part(s)'})`;
                      }).join(', ');
                    };
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                        <td style={{ padding: 10, fontWeight: 'bold', color: 'white' }}>{e.name}</td>
                        <td style={{ padding: 10 }}>{e.paidBy}</td>
                        <td style={{ padding: 10, fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatSplits()}>
                          {formatSplits()}
                        </td>
                        <td style={{ padding: 10, fontWeight: 600, color: 'white' }}>{e.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                        <td style={{ padding: 10 }} className="no-print">
                          <button onClick={() => handleDeleteExpense(e.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Supprimer</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Input Form */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Ajouter une facture</h3>
          
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" required placeholder="ex: Courses Chalet" style={{ width: '100%', marginTop: 4 }} />
            </div>
            
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Montant payé (CAD)</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-premium" required placeholder="ex: 120" style={{ width: '100%', marginTop: 4 }} />
            </div>
            
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Payé par</label>
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                {travelers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Split Type Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mode de répartition</label>
              <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value="equal">Équitable (Parts égales)</option>
                <option value="amount">Par montants exacts</option>
                <option value="weight">Par coefficients de parts</option>
              </select>
            </div>

            {/* Split beneficiaries checkboxes */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Partagé entre :
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {travelers.map(t => {
                  const isChecked = splitBetween.includes(t);
                  return (
                    <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleToggleBeneficiary(t)} 
                          style={{ accentColor: 'var(--secondary)' }}
                        />
                        <span style={{ fontWeight: isChecked ? 'bold' : 'normal', color: isChecked ? 'white' : 'var(--text-secondary)' }}>{t}</span>
                      </label>
                      
                      {isChecked && splitType !== 'equal' && (
                        <div style={{ marginLeft: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {splitType === 'amount' ? 'Montant :' : 'Part (ex: 1, 2) :'}
                          </span>
                          <input 
                            type="number" 
                            step={splitType === 'amount' ? '0.01' : '1'} 
                            min="0.01"
                            required
                            placeholder={splitType === 'amount' ? '0.00' : '1'}
                            value={customSplits[t] || ''} 
                            onChange={(e) => setCustomSplits({ ...customSplits, [t]: e.target.value })}
                            className="input-premium" 
                            style={{ width: 80, padding: '2px 6px', fontSize: '0.8rem', borderRadius: 4 }} 
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {splitType === 'amount' ? '$' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold', justifyContent: 'center' }}>
              💾 Enregistrer la facture
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}