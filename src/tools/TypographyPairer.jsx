import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function TypographyPairer({ goBack }) {
  const [data, setData] = useState('');
  
  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ✨ Typography Pairer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Combinez et visualisez des polices Google Fonts.
          </p>
        </div>
        <FolderButton toolId="typography_pairer" toolName="TypographyPairer" localStorageKeys={[]} />
      </div>

      <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Interface Interactive</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Cet outil fonctionne entièrement en local dans votre navigateur ou via les dossiers PC locaux configurés.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paramètres / Entrées :</label>
            <input 
              type="text" 
              value={data} 
              onChange={(e) => setData(e.target.value)} 
              className="input-premium" 
              placeholder="Saisissez des paramètres..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
            />
          </div>

          <div style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-light)', borderRadius: 10 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 'bold' }}>Résultat / Prévisualisation</span>
            <div style={{ marginTop: 8, fontSize: '1rem', color: 'white', fontWeight: 600 }}>
              {data ? `Aperçu : ${data}` : 'En attente d\'entrées...'}
            </div>
          </div>

          <button 
            onClick={() => alert('Action effectuée localement !')} 
            className="btn-premium btn-primary"
            style={{ width: 'fit-content', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold' }}
          >
            Lancer le traitement
          </button>
        </div>
      </div>
    </div>
  );
}
