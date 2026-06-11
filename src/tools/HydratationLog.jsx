import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function HydratationLog({ goBack }) {
  const [target, setTarget] = useState(2000); // 2L
  const [current, setCurrent] = useState(() => {
    const saved = localStorage.getItem('ff_water');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('ff_water', current.toString());
  }, [current]);

  const addWater = (amount) => {
    setCurrent(prev => Math.min(target, prev + amount));
  };

  const resetLog = () => {
    setCurrent(0);
  };

  const percentage = Math.min(100, (current / target) * 100);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            💧 Water Intake Log
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Suivez et enregistrez votre consommation quotidienne d'eau pour rester hydraté.
          </p>
        </div>
        <FolderButton toolId="water_intake" toolName="HydratationLog" localStorageKeys={["ff_water"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'center' }}>
        {/* Visual column filling up */}
        <div className="glass-panel" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ 
            width: 140, 
            height: 240, 
            border: '4px solid var(--border-light)', 
            borderRadius: 12, 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.01)'
          }}>
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              width: '100%', 
              height: percentage + '%', 
              backgroundColor: '#3b82f6', 
              transition: 'height 0.4s ease-out' 
            }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{current}</span>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}> / {target} ml</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => addWater(250)} className="btn-premium btn-secondary" style={{ padding: '8px 16px' }}>+250ml</button>
            <button onClick={() => addWater(500)} className="btn-premium btn-secondary" style={{ padding: '8px 16px' }}>+500ml</button>
            <button onClick={resetLog} className="btn-premium btn-danger" style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Réinitialiser</button>
          </div>
        </div>

        {/* Target setting */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Objectif Journalier</h3>
          <input type="number" step="100" value={target} onChange={(e) => setTarget(Math.max(100, parseInt(e.target.value) || 100))} className="input-premium" style={{ width: '100%', fontSize: '1.2rem', textAlign: 'center', padding: 8 }} />
        </div>
      </div>
    </div>
  );
}