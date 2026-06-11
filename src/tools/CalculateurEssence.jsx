import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CalculateurEssence({ goBack }) {
  const [distance, setDistance] = useState(350);
  const [consumption, setConsumption] = useState(7.5); // L/100km
  const [price, setPrice] = useState(1.62); // $/L
  const [travelers, setTravelers] = useState(3);

  const [output, setOutput] = useState({
    liters: 0,
    totalCost: 0,
    costPerPerson: 0
  });

  useEffect(() => {
    localStorage.setItem('ff_fuel', JSON.stringify({ distance, consumption, price, travelers }));
    calculateFuel();
  }, [distance, consumption, price, travelers]);

  const calculateFuel = () => {
    const liters = (distance * consumption) / 100;
    const totalCost = liters * price;
    const costPerPerson = travelers > 0 ? totalCost / travelers : totalCost;

    setOutput({
      liters,
      totalCost,
      costPerPerson
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
            ⛽ Calculateur Carburant Roadtrip
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Estimez la consommation d'essence et le coût partagé de votre trajet routier.
          </p>
        </div>
        <FolderButton toolId="fuel_calculator" toolName="CalculateurEssence" localStorageKeys={["ff_fuel"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Détails du Trajet</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distance à parcourir (km)</label>
            <input type="number" value={distance} onChange={(e) => setDistance(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consommation moyenne (L/100km)</label>
            <input type="number" step="0.1" value={consumption} onChange={(e) => setConsumption(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prix moyen de l'essence ($/L)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre de voyageurs</label>
            <input type="number" value={travelers} onChange={(e) => setTravelers(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        {/* Outputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Coût Partagé / Personne</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {output.costPerPerson.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Coût Total du Trajet</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
              {output.totalCost.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Litres nécessaires</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
              {output.liters.toFixed(1)} L
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}