import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function BudgetPersonnel({ goBack }) {
  const [income, setIncome] = useState(3000);
  const [needs, setNeeds] = useState(1400);
  const [wants, setWants] = useState(800);
  const [savings, setSavings] = useState(500);

  const getPercent = (val) => income > 0 ? ((val / income) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>💰 Budget Personnel (50/30/20)</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gérez vos finances basées sur les objectifs Besoins, Désirs, Épargne.</p>
        </div>
        <FolderButton toolId="budget_personal" toolName="BudgetPersonnel" localStorageKeys={['fl_budget']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Flux Mensuel</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Revenus Net Mensuel ($) :</label>
              <input type="number" value={income} onChange={e => setIncome(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Besoins (Logement, Factures, Épicerie) :</label>
              <input type="number" value={needs} onChange={e => setNeeds(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Désirs (Sorties, Cadeaux, Abonnements) :</label>
              <input type="number" value={wants} onChange={e => setWants(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Épargne & Dettes (CELI, Placements, Prêts) :</label>
              <input type="number" value={savings} onChange={e => setSavings(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8 }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Analyse de Répartition</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Besoins ({getPercent(needs)}%)</span>
                <span>Cible: 50%</span>
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(getPercent(needs), 100)}%`, height: '100%', backgroundColor: '#3b82f6' }} />
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#eab308', fontWeight: 'bold' }}>Désirs ({getPercent(wants)}%)</span>
                <span>Cible: 30%</span>
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(getPercent(wants), 100)}%`, height: '100%', backgroundColor: '#eab308' }} />
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Épargne ({getPercent(savings)}%)</span>
                <span>Cible: 20%</span>
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(getPercent(savings), 100)}%`, height: '100%', backgroundColor: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}