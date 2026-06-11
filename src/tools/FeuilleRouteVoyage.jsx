import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FeuilleRouteVoyage({ goBack }) {
  const [steps, setSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_itinerary');
      return saved ? JSON.parse(saved) : [
        { id: '1', date: '2026-07-01', time: '10:00', title: 'Départ Vol YUL', location: 'Montréal Trudeau', notes: 'Vol AC1234, terminal international.', budget: 0 }
      ];
    } catch (e) {
      console.error("Error reading ff_itinerary", e);
      return [];
    }
  });

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    localStorage.setItem('ff_itinerary', JSON.stringify(steps));
  }, [steps]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!date || !title) return;

    const newStep = {
      id: Date.now().toString(),
      date,
      time,
      title,
      location,
      notes,
      budget: parseFloat(budget) || 0
    };

    setSteps([...steps, newStep].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
    setDate('');
    setTime('');
    setTitle('');
    setLocation('');
    setNotes('');
    setBudget('');
  };

  const handleDelete = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const totalBudget = steps.reduce((sum, s) => sum + (s.budget || 0), 0);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📅 Travel Itinerary Planner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Planifiez la chronologie de votre voyage et conservez une feuille de route accessible hors ligne.
          </p>
        </div>
        <FolderButton toolId="itinerary_planner" toolName="FeuilleRouteVoyage" localStorageKeys={["ff_itinerary"]} />
      </div>

      {/* Summary Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Budget Global Estimé</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {totalBudget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre d'étapes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
            {steps.length} {steps.length > 1 ? 'étapes' : 'étape'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Timeline visualization */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Ligne de Temps</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.length === 0 ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucune étape prévue...</span>
            ) : (
              steps.map(s => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, borderLeft: '3px solid #3b82f6', paddingLeft: 16, position: 'relative' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'white', display: 'block' }}>{s.date}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🕒 {s.time || 'Non spécifié'}</span>
                    {s.budget > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', display: 'block', marginTop: 4 }}>
                        💰 {s.budget.toFixed(2)} $
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>{s.title}</span>
                    {s.location && <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: 2 }}>📍 {s.location}</span>}
                    {s.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>{s.notes}</p>}
                    <button onClick={() => handleDelete(s.id)} className="btn-premium btn-danger" style={{ padding: '2px 6px', fontSize: '0.7rem', marginTop: 8, background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      Retirer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Add Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Nouvelle Étape</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-premium" required style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Heure</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Titre / Activité *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-premium" required placeholder="Départ Vol" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emplacement / Lieu</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input-premium" placeholder="Montréal" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Budget estimé ($ CAD)</label>
              <input type="number" step="0.01" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="input-premium" placeholder="0.00" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Notes additionnelles</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-premium" rows="2" style={{ width: '100%', marginTop: 4, resize: 'none' }} />
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter l'étape
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}