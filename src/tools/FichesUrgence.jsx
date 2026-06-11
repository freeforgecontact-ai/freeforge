import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FichesUrgence({ goBack }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('ff_emergency_card');
    return saved ? JSON.parse(saved) : {
      name: 'Jean Tremblay',
      bloodType: 'O+',
      allergies: 'Pénicilline, arachides',
      contactName: 'Sophie Tremblay',
      contactPhone: '514-555-0199',
      policy: 'Assurance Croix-Bleue #123456'
    };
  });

  useEffect(() => {
    localStorage.setItem('ff_emergency_card', JSON.stringify(data));
  }, [data]);

  const handleChange = (field, val) => {
    setData({ ...data, [field]: val });
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🚨 Emergency Card Generator
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez une carte d'urgence imprimable et sécurisée avec vos informations médicales critiques.
          </p>
        </div>
        <FolderButton toolId="emergency_card" toolName="FichesUrgence" localStorageKeys={["ff_emergency_card"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Printable Card Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="glass-panel" style={{ width: 380, padding: 24, borderRadius: 16, border: '2px solid #ef4444', background: 'rgba(239,68,68,0.02)', boxShadow: '0 8px 32px rgba(239,68,68,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>FICHE D'URGENCE MÉDICALE</span>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>NOM COMPLET</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{data.name || 'Non spécifié'}</span>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>GROUPE SANGUIN</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{data.bloodType || 'Non spécifié'}</span>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>ALLERGIES & CONTRE-INDICATIONS</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{data.allergies || 'Aucune connue'}</span>
              </div>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>CONTACT DE SÉCURITÉ</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{data.contactName} ({data.contactPhone})</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>POLICE D'ASSURANCE VOYAGE</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{data.policy || 'Non spécifiée'}</span>
              </div>
            </div>
          </div>

          <button onClick={() => window.print()} className="btn-premium btn-secondary">
            🖨️ Imprimer la fiche
          </button>
        </div>

        {/* Inputs */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Vos Informations</h3>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom Complet</label>
            <input type="text" value={data.name} onChange={(e) => handleChange('name', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Groupe Sanguin</label>
            <input type="text" value={data.bloodType} onChange={(e) => handleChange('bloodType', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allergies</label>
            <input type="text" value={data.allergies} onChange={(e) => handleChange('allergies', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom Contact d'urgence</label>
            <input type="text" value={data.contactName} onChange={(e) => handleChange('contactName', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Téléphone Contact</label>
            <input type="text" value={data.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assurance / Notes</label>
            <input type="text" value={data.policy} onChange={(e) => handleChange('policy', e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>
      </div>
    </div>
  );
}