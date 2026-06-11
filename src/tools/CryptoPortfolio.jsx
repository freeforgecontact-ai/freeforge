import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CryptoPortfolio({ goBack }) {
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('ff_crypto');
    return saved ? JSON.parse(saved) : [
      { id: '1', symbol: 'BTC', name: 'Bitcoin', amount: 0.12, avgPrice: 65000, currentPrice: 68500 },
      { id: '2', symbol: 'ETH', name: 'Ethereum', amount: 1.5, avgPrice: 3200, currentPrice: 3450 }
    ];
  });

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [isEditing, setIsEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem('ff_crypto', JSON.stringify(assets));
  }, [assets]);

  const handleAddOrEdit = (e) => {
    e.preventDefault();
    if (!symbol || !amount || !avgPrice) return;

    const parsedAmount = parseFloat(amount);
    const parsedAvg = parseFloat(avgPrice);
    const parsedCurrent = currentPrice ? parseFloat(currentPrice) : parsedAvg;

    if (isEditing) {
      setAssets(assets.map(a => a.id === isEditing ? { 
        ...a, 
        symbol: symbol.toUpperCase(), 
        name: name || symbol.toUpperCase(), 
        amount: parsedAmount, 
        avgPrice: parsedAvg, 
        currentPrice: parsedCurrent 
      } : a));
      setIsEditing(null);
    } else {
      const newAsset = {
        id: Date.now().toString(),
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        amount: parsedAmount,
        avgPrice: parsedAvg,
        currentPrice: parsedCurrent
      };
      setAssets([...assets, newAsset]);
    }

    setSymbol('');
    setName('');
    setAmount('');
    setAvgPrice('');
    setCurrentPrice('');
  };

  const handleEdit = (asset) => {
    setIsEditing(asset.id);
    setSymbol(asset.symbol);
    setName(asset.name);
    setAmount(asset.amount.toString());
    setAvgPrice(asset.avgPrice.toString());
    setCurrentPrice(asset.currentPrice.toString());
  };

  const handleDelete = (id) => {
    if (confirm("Supprimer cet actif ?")) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const simulateMarket = () => {
    setAssets(assets.map(a => {
      const change = (Math.random() - 0.5) * 0.1; // -5% to +5%
      return { ...a, currentPrice: Math.max(0, Math.round(a.currentPrice * (1 + change) * 100) / 100) };
    }));
  };

  const totalInvested = assets.reduce((sum, a) => sum + (a.amount * a.avgPrice), 0);
  const totalValue = assets.reduce((sum, a) => sum + (a.amount * a.currentPrice), 0);
  const totalProfit = totalValue - totalInvested;
  const totalRoi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🪙 Crypto Portfolio Tracker
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Suivi de vos actifs cryptographiques en temps réel et simulation de portefeuille.
          </p>
        </div>
        <FolderButton toolId="crypto_tracker" toolName="CryptoPortfolio" localStorageKeys={["ff_crypto"]} />
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valeur Totale</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {totalValue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Investi</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
            {totalInvested.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profit / Perte Globale</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: totalProfit >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rendement (ROI)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: totalRoi >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Table of Assets */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Actifs détenus</h2>
            <button onClick={simulateMarket} className="btn-premium btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              ⚡ Simuler fluctuation
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: 12 }}>Actif</th>
                  <th style={{ padding: 12 }}>Quantité</th>
                  <th style={{ padding: 12 }}>Prix Moyen d'achat</th>
                  <th style={{ padding: 12 }}>Prix Actuel</th>
                  <th style={{ padding: 12 }}>Valeur Actuelle</th>
                  <th style={{ padding: 12 }}>P&L</th>
                  <th style={{ padding: 12 }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Aucun actif dans le portefeuille. Utilisez le formulaire pour en ajouter.
                    </td>
                  </tr>
                ) : (
                  assets.map(a => {
                    const cost = a.amount * a.avgPrice;
                    const value = a.amount * a.currentPrice;
                    const pnl = value - cost;
                    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <td style={{ padding: 12 }}>
                          <span style={{ fontWeight: 'bold', color: 'white' }}>{a.symbol}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{a.name}</span>
                        </td>
                        <td style={{ padding: 12 }}>{a.amount}</td>
                        <td style={{ padding: 12 }}>{a.avgPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                        <td style={{ padding: 12 }}>{a.currentPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                        <td style={{ padding: 12, fontWeight: 600 }}>{value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                        <td style={{ padding: 12, color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                        </td>
                        <td style={{ padding: 12 }} className="no-print">
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleEdit(a)} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              Éditer
                            </button>
                            <button onClick={() => handleDelete(a.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
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

        {/* Input Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>
            {isEditing ? "Modifier l'actif" : "Ajouter un actif"}
          </h3>
          <form onSubmit={handleAddOrEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Symbole (ex: BTC, SOL)</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input-premium" required placeholder="BTC" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom complet (facultatif)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" placeholder="Bitcoin" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantité</label>
              <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-premium" required placeholder="0.25" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prix d'achat moyen (CAD)</label>
              <input type="number" step="any" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} className="input-premium" required placeholder="65000" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prix actuel (CAD) (facultatif)</label>
              <input type="number" step="any" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="input-premium" placeholder="68000" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-premium btn-primary" style={{ flex: 1, padding: 10, fontWeight: 'bold' }}>
                {isEditing ? 'Sauvegarder' : 'Ajouter'}
              </button>
              {isEditing && (
                <button type="button" onClick={() => { setIsEditing(null); setSymbol(''); setName(''); setAmount(''); setAvgPrice(''); setCurrentPrice(''); }} className="btn-premium btn-secondary" style={{ padding: 10 }}>
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