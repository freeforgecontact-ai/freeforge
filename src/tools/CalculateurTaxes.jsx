import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CalculateurTaxes({ goBack }) {
  const [amount, setAmount] = useState('100');
  const [mode, setMode] = useState('direct'); // 'direct' | 'inverse'
  
  // Results
  const [subtotal, setSubtotal] = useState(0);
  const [tps, setTps] = useState(0);
  const [tvq, setTvq] = useState(0);
  const [total, setTotal] = useState(0);
  
  // History log
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('tax_calc_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate taxes on amount/mode change
  useEffect(() => {
    const value = parseFloat(amount) || 0;
    if (mode === 'direct') {
      const computedTps = value * 0.05;
      const computedTvq = value * 0.09975;
      const computedTotal = value + computedTps + computedTvq;
      
      setSubtotal(value);
      setTps(computedTps);
      setTvq(computedTvq);
      setTotal(computedTotal);
    } else {
      // Inverse calculation
      // Total = Subtotal * 1.14975
      const computedSubtotal = value / 1.14975;
      const computedTps = computedSubtotal * 0.05;
      const computedTvq = computedSubtotal * 0.09975;
      
      setSubtotal(computedSubtotal);
      setTps(computedTps);
      setTvq(computedTvq);
      setTotal(value);
    }
  }, [amount, mode]);

  // Save history helper
  const saveToHistory = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
      amount: parseFloat(amount),
      mode,
      subtotal,
      tps,
      tvq,
      total
    };
    const updated = [newEntry, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem('tax_calc_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tax_calc_history');
  };

  const copyToClipboard = (text, elementId) => {
    navigator.clipboard.writeText(text);
    const element = document.getElementById(elementId);
    if (element) {
      const originalText = element.innerText;
      element.innerText = 'Copié !';
      element.style.color = '#10b981';
      setTimeout(() => {
        element.innerText = originalText;
        element.style.color = '';
      }, 1500);
    }
  };

  const formatCurrency = (val) => {
    return val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
  };

  return (
    <div>
      {/* Top navigation row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Comptabilité</span>
        <FolderButton toolId="taxes" toolName="Calculateur de Taxes" localStorageKeys={['tax_calc_history']} />
      </div>

      <h1 className="page-title">Calculateur de Taxes TPS & TVQ</h1>
      <p className="page-subtitle">Calculs de taxes réguliers et inverses aux taux officiels du Québec (TPS 5% et TVQ 9,975%).</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="responsive-split">
        {/* Main Grid for PC */}
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          
          {/* Card left: Input parameters */}
          <div className="card-premium" style={{ cursor: 'default', gap: 20 }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Paramètres
            </h2>

            {/* Mode selection buttons */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
              <button 
                className={`btn-premium ${mode === 'direct' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: 6 }}
                onClick={() => setMode('direct')}
              >
                Direct (+ Taxes)
              </button>
              <button 
                className={`btn-premium ${mode === 'inverse' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: 6 }}
                onClick={() => setMode('inverse')}
              >
                Inverse (Extraire)
              </button>
            </div>

            {/* Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {mode === 'direct' ? 'Montant hors taxes (Brut)' : 'Montant toutes taxes comprises (TTC)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="input-premium" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  style={{ paddingRight: 40 }}
                />
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>$</span>
              </div>
            </div>

            {/* Save trigger button */}
            <button 
              className="btn-premium btn-primary"
              onClick={saveToHistory}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Enregistrer dans l'historique
            </button>
          </div>

          {/* Card right: Detailed Results */}
          <div className="card-premium" style={{ cursor: 'default', gap: 18 }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
              📊 Résultats détaillés
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Subtotal row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sous-total (Hors taxes)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatCurrency(subtotal)}</div>
                </div>
                <button 
                  id="copy-sub"
                  className="btn-premium btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                  onClick={() => copyToClipboard(subtotal.toFixed(2), 'copy-sub')}
                >
                  Copier
                </button>
              </div>

              {/* TPS Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TPS fédérale (5,00 %)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>{formatCurrency(tps)}</div>
                </div>
                <button 
                  id="copy-tps"
                  className="btn-premium btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                  onClick={() => copyToClipboard(tps.toFixed(2), 'copy-tps')}
                >
                  Copier
                </button>
              </div>

              {/* TVQ Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TVQ provinciale (9,975 %)</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(tvq)}</div>
                </div>
                <button 
                  id="copy-tvq"
                  className="btn-premium btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                  onClick={() => copyToClipboard(tvq.toFixed(2), 'copy-tvq')}
                >
                  Copier
                </button>
              </div>

              {/* Total Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Total (Toutes taxes comprises)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(total)}</div>
                </div>
                <button 
                  id="copy-total"
                  className="btn-premium btn-primary" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 6 }}
                  onClick={() => copyToClipboard(total.toFixed(2), 'copy-total')}
                >
                  Copier
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* History log block */}
        <div className="card-premium" style={{ cursor: 'default', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>🕒 Historique récent des calculs</h3>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Effacer tout
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {history.map(item => (
                <div 
                  key={item.id} 
                  style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.15)', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.8rem', gap: 8 }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                  <span><strong>Base :</strong> {formatCurrency(item.amount)} ({item.mode === 'direct' ? 'Brut' : 'TTC'})</span>
                  <span style={{ color: 'var(--text-secondary)' }}><strong>Sous-total :</strong> {formatCurrency(item.subtotal)}</span>
                  <span style={{ color: 'var(--text-secondary)' }}><strong>Taxes (TPS+TVQ) :</strong> {formatCurrency(item.tps + item.tvq)}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold', justifySelf: 'end' }}>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
              Aucun calcul dans l'historique local.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
