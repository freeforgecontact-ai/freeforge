import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function DevisesHorsLigne({ goBack }) {
  const [rates, setRates] = useState(() => {
    const saved = localStorage.getItem('ff_currencies');
    return saved ? JSON.parse(saved) : { USD: 0.73, EUR: 0.67, GBP: 0.58, JPY: 115 };
  });

  const [cadAmount, setCadAmount] = useState(100);

  useEffect(() => {
    localStorage.setItem('ff_currencies', JSON.stringify(rates));
  }, [rates]);

  const handleRateChange = (curr, val) => {
    setRates({ ...rates, [curr]: Math.max(0, parseFloat(val) || 0) });
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ✈️ Offline Currency Converter
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Convertissez instantanément vos montants sans connexion internet en configurant vos propres taux de change.
          </p>
        </div>
        <FolderButton toolId="offline_currencies" toolName="DevisesHorsLigne" localStorageKeys={["ff_currencies"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Converters list */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Conversion de base</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Montant en Dollars Canadiens (CAD)</label>
              <input type="number" value={cadAmount} onChange={(e) => setCadAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4, fontSize: '1.1rem' }} />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(rates).map(([curr, rate]) => {
                const converted = cadAmount * rate;
                return (
                  <div key={curr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 'bold', color: 'white' }}>{curr}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>
                      {converted.toLocaleString('fr-CA', { maximumFractionDigits: 2 })} {curr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Exchange Rates Config */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Configurer les taux (1 CAD = ...)</h3>
          {Object.entries(rates).map(([curr, rate]) => (
            <div key={curr}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{curr}</label>
              <input type="number" step="0.0001" value={rate} onChange={(e) => handleRateChange(curr, e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}