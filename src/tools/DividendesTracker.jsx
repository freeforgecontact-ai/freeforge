import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function DividendesTracker({ goBack }) {
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem('ff_dividends');
    return saved ? JSON.parse(saved) : [
      { id: '1', symbol: 'BNS.TO', name: 'Banque Scotia', shares: 120, dividendPerShare: 4.24, frequency: 4 },
      { id: '2', symbol: 'T.TO', name: 'Telus Corp', shares: 250, dividendPerShare: 1.52, frequency: 4 }
    ];
  });

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [divShare, setDivShare] = useState('');
  const [frequency, setFrequency] = useState(4);
  const [isEditing, setIsEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem('ff_dividends', JSON.stringify(stocks));
  }, [stocks]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol || !shares || !divShare) return;

    const parsedShares = parseFloat(shares);
    const parsedDiv = parseFloat(divShare);

    if (isEditing) {
      setStocks(stocks.map(s => s.id === isEditing ? {
        ...s,
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        shares: parsedShares,
        dividendPerShare: parsedDiv,
        frequency
      } : s));
      setIsEditing(null);
    } else {
      const newStock = {
        id: Date.now().toString(),
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        shares: parsedShares,
        dividendPerShare: parsedDiv,
        frequency
      };
      setStocks([...stocks, newStock]);
    }

    setSymbol('');
    setName('');
    setShares('');
    setDivShare('');
    setFrequency(4);
  };

  const handleEdit = (stock) => {
    setIsEditing(stock.id);
    setSymbol(stock.symbol);
    setName(stock.name);
    setShares(stock.shares.toString());
    setDivShare(stock.dividendPerShare.toString());
    setFrequency(stock.frequency);
  };

  const handleDelete = (id) => {
    if (confirm("Supprimer ce titre ?")) {
      setStocks(stocks.filter(s => s.id !== id));
    }
  };

  const annualIncome = stocks.reduce((sum, s) => sum + (s.shares * s.dividendPerShare), 0);
  const monthlyIncome = annualIncome / 12;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            💸 Stock Dividend Tracker
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Suivi des dividendes de votre portefeuille d'actions et projections de rentes passives.
          </p>
        </div>
        <FolderButton toolId="dividend_tracker" toolName="DividendesTracker" localStorageKeys={["ff_dividends"]} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revenu Annuel Estimé</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {annualIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rente Mensuelle Moyenne</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
            {monthlyIncome.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre de Lignes Actions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
            {stocks.length} actions
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Actions list */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Actions de votre portefeuille</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: 12 }}>Symbole</th>
                  <th style={{ padding: 12 }}>Actions Detenues</th>
                  <th style={{ padding: 12 }}>Dividende Annuel / Act.</th>
                  <th style={{ padding: 12 }}>Fréquence</th>
                  <th style={{ padding: 12 }}>Revenu Annuel</th>
                  <th style={{ padding: 12 }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Aucune action ajoutée. Ajoutez-en via le formulaire.
                    </td>
                  </tr>
                ) : (
                  stocks.map(s => {
                    const annualVal = s.shares * s.dividendPerShare;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <td style={{ padding: 12 }}>
                          <span style={{ fontWeight: 'bold', color: 'white' }}>{s.symbol}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{s.name}</span>
                        </td>
                        <td style={{ padding: 12 }}>{s.shares}</td>
                        <td style={{ padding: 12 }}>{s.dividendPerShare.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                        <td style={{ padding: 12 }}>
                          {s.frequency === 12 ? 'Mensuelle' : s.frequency === 4 ? 'Trimestrielle' : 'Annuelle'}
                        </td>
                        <td style={{ padding: 12, fontWeight: 600, color: '#10b981' }}>
                          {annualVal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                        </td>
                        <td style={{ padding: 12 }} className="no-print">
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleEdit(s)} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Éditer
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>
            {isEditing ? 'Modifier la ligne' : 'Ajouter un titre'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Symbole (ex: TD.TO, ENB.TO)</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input-premium" required placeholder="ENB.TO" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom complet</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" placeholder="Enbridge Inc" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Actions Détenues</label>
              <input type="number" step="any" value={shares} onChange={(e) => setShares(e.target.value)} className="input-premium" required placeholder="50" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dividende annuel par action (CAD)</label>
              <input type="number" step="any" value={divShare} onChange={(e) => setDivShare(e.target.value)} className="input-premium" required placeholder="3.66" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fréquence des versements</label>
              <select value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value={12}>Mensuelle (12/an)</option>
                <option value={4}>Trimestrielle (4/an)</option>
                <option value={1}>Annuelle (1/an)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-premium btn-primary" style={{ flex: 1, padding: 10, fontWeight: 'bold' }}>
                {isEditing ? 'Sauvegarder' : 'Ajouter'}
              </button>
              {isEditing && (
                <button type="button" onClick={() => { setIsEditing(null); setSymbol(''); setName(''); setShares(''); setDivShare(''); setFrequency(4); }} className="btn-premium btn-secondary" style={{ padding: 10 }}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}