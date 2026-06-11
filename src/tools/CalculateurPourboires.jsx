import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function CalculateurPourboires({ goBack }) {
  const [bill, setBill] = useState(60.0);
  const [tipPercent, setTipPercent] = useState(15);
  const [people, setPeople] = useState(2);

  const calculate = () => {
    // In Quebec, tip is calculated BEFORE taxes.
    // Subtotal before tax is roughly bill / 1.14975
    const subtotal = bill / 1.14975;
    const tipAmount = subtotal * (tipPercent / 100);
    const totalWithTip = bill + tipAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      tip: tipAmount.toFixed(2),
      total: totalWithTip.toFixed(2),
      perPerson: (totalWithTip / people).toFixed(2)
    };
  };

  const results = calculate();

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🍽️ Calculateur de Pourboires & Partage</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculez le pourboire avant taxes au Québec et divisez l'addition.</p>
        </div>
        <FolderButton toolId="tip_calculator" toolName="CalculateurPourboires" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Facture de la table</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Montant Facture TTC ($) :</label>
              <input type="number" value={bill} onChange={e => setBill(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pourboire ({tipPercent}%) :</label>
              <input type="range" min="10" max="25" value={tipPercent} onChange={e => setTipPercent(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre de convives :</label>
              <input type="number" value={people} onChange={e => setPeople(parseInt(e.target.value) || 1)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Répartition</h2>
          
          <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800 }}>Par personne</span>
            <div style={{ fontSize: '2rem', color: 'white', fontWeight: 800, marginTop: 4 }}>
              {results.perPerson} $
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sous-total avant taxes</span>
              <span style={{ color: 'white' }}>{results.subtotal} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pourboire Total</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{results.tip} $</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total avec Pourboire</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{results.total} $</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}