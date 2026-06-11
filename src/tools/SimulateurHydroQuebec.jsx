import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function SimulateurHydroQuebec({ goBack }) {
  const [watts, setWatts] = useState(1500);
  const [hours, setHours] = useState(4);
  const [count, setCount] = useState(1);

  const calculateCost = () => {
    // Hydro-Quebec Tarif D 2026 rates (estimates)
    // Basic network fee per day: $0.44
    // First 40 kWh per day: 6.5 cents ($0.065) per kWh
    // Excess kWh: 10.4 cents ($0.104) per kWh
    
    const kwhPerDay = (watts * hours * count) / 1000;
    
    // Month calculation (30 days)
    const totalKwh = kwhPerDay * 30;
    const networkFees = 0.44 * 30;
    
    let energyCost = 0;
    const firstTierLimit = 40 * 30; // 1200 kWh per month
    if (totalKwh <= firstTierLimit) {
      energyCost = totalKwh * 0.065;
    } else {
      energyCost = (firstTierLimit * 0.065) + ((totalKwh - firstTierLimit) * 0.104);
    }
    
    const subtotal = energyCost + networkFees;
    const taxes = subtotal * 0.14975; // TPS + TVQ
    return {
      kwh: totalKwh.toFixed(1),
      energy: energyCost.toFixed(2),
      network: networkFees.toFixed(2),
      total: (subtotal + taxes).toFixed(2)
    };
  };

  const cost = calculateCost();

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>⚡ Simulateur Hydro-Québec</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimez le coût de consommation électrique de vos appareils au Tarif D.</p>
        </div>
        <FolderButton toolId="hydro_quebec" toolName="SimulateurHydroQuebec" localStorageKeys={['fe_hydro']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Appareils et Utilisation</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Puissance de l'appareil (Watts) :</label>
              <input type="number" value={watts} onChange={e => setWatts(parseInt(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Heures d'utilisation par jour :</label>
              <input type="number" max="24" value={hours} onChange={e => setHours(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre d'appareils identiques :</label>
              <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Coût Estimé Mensuel</h2>
          
          <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800 }}>Total (Taxes incluses)</span>
            <div style={{ fontSize: '2rem', color: 'white', fontWeight: 800, marginTop: 4 }}>
              {cost.total} $
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Énergie consommée</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{cost.kwh} kWh</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Coût de l'énergie</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{cost.energy} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Frais d'accès réseau</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{cost.network} $</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}