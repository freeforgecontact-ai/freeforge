import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function TravelChecklist({ goBack }) {
  const [climate, setClimate] = useState('cold');
  const [list, setList] = useState([]);

  const defaultItems = {
    cold: ['Manteau chaud', 'Tuque et gants', 'Bottes antidérapantes', 'Chaussettes de laine', 'Passeport', 'Assurance Voyage'],
    hot: ['Maillot de bain', 'Crème solaire', 'Lunettes de soleil', 'Chapeau / Casquette', 'Sandales', 'Passeport']
  };

  const handleGenerate = () => {
    setList(defaultItems[climate].map(item => ({ name: item, checked: false })));
  };

  const handleToggle = (idx) => {
    setList(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎒 Checklist de Voyage Dynamique</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Préparez vos valises intelligemment en fonction du climat de destination.</p>
        </div>
        <FolderButton toolId="travel_checklist" toolName="TravelChecklist" localStorageKeys={['fl_travel']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Options</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Climat :</label>
            <select value={climate} onChange={e => setClimate(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="cold">Froid / Hivernal</option>
              <option value="hot">Chaud / Tropical</option>
            </select>
          </div>

          <button onClick={handleGenerate} className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', marginTop: 8 }}>⚡ Générer la valise</button>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Ma Valise</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.length > 0 ? list.map((item, idx) => (
              <label 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: item.checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                <input type="checkbox" checked={item.checked} onChange={() => handleToggle(idx)} />
                <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'white' }}>
                  {item.name}
                </span>
              </label>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Générez une checklist pour commencer.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}