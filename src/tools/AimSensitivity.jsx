import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function AimSensitivity({ goBack }) {
  const [sourceGame, setSourceGame] = useState('cs2');
  const [targetGame, setTargetGame] = useState('valorant');
  const [sens, setSens] = useState(2.0);
  const [dpi, setDpi] = useState(800);

  const yawData = {
    cs2: 0.022,
    valorant: 0.07,
    overwatch: 0.0066,
    apex: 0.022,
    cod: 0.0066
  };

  const getTargetSens = () => {
    const srcYaw = yawData[sourceGame];
    const dstYaw = yawData[targetGame];
    return ((sens * srcYaw) / dstYaw).toFixed(4);
  };

  const getEDPI = () => (sens * dpi).toFixed(0);
  const getCM360 = () => {
    const srcYaw = yawData[sourceGame];
    const degreesPerDot = sens * srcYaw;
    const dotsPer360 = 360 / degreesPerDot;
    const inchesPer360 = dotsPer360 / dpi;
    return (inchesPer360 * 2.54).toFixed(2);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🖱️ Aim Sensitivity Converter</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Convertissez les sensibilités souris inter-jeux.</p>
        </div>
        <FolderButton toolId="sensitivity" toolName="AimSensitivity" localStorageKeys={['fg_sens']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Configuration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jeu Source :</label>
              <select value={sourceGame} onChange={e => setSourceGame(e.target.value)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                <option value="cs2">CS2 / CS:GO / Apex</option>
                <option value="valorant">Valorant</option>
                <option value="overwatch">Overwatch</option>
                <option value="cod">Call of Duty</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jeu Cible :</label>
              <select value={targetGame} onChange={e => setTargetGame(e.target.value)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                <option value="cs2">CS2 / CS:GO / Apex</option>
                <option value="valorant">Valorant</option>
                <option value="overwatch">Overwatch</option>
                <option value="cod">Call of Duty</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sensibilité Source :</label>
              <input type="number" step="0.01" value={sens} onChange={e => setSens(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Souris DPI :</label>
              <input type="number" step="50" value={dpi} onChange={e => setDpi(parseInt(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Résultats</h2>
          
          <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800 }}>Sensibilité Cible</span>
            <div style={{ fontSize: '1.8rem', color: 'white', fontWeight: 800, marginTop: 4 }}>
              {getTargetSens()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>eDPI de Base</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{getEDPI()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rotation (cm/360°)</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{getCM360()} cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}