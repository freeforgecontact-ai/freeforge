import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function HabitTrackerGrid({ goBack }) {
  const [habits, setHabits] = useState(() => {
    const val = localStorage.getItem('fl_habits');
    return val ? JSON.parse(val) : [
      { id: '1', name: 'Boire de l\'eau', history: [true, false, true, true, false] },
      { id: '2', name: 'Méditer', history: [false, true, true, false, true] }
    ];
  });

  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    localStorage.setItem('fl_habits', JSON.stringify(habits));
  }, [habits]);

  const handleToggleHabit = (habitId, dayIdx) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const hist = [...h.history];
        hist[dayIdx] = !hist[dayIdx];
        return { ...h, history: hist };
      }
      return h;
    }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newHabitName) return;
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName,
      history: Array.from({ length: 7 }).map(() => false)
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📅 Habit Tracker Grid</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Suivez vos habitudes de manière visuelle et restez régulier.</p>
        </div>
        <FolderButton toolId="habit_tracker" toolName="HabitTrackerGrid" localStorageKeys={['fl_habits']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Grille d'Habitudes (Semaine en cours)</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', gap: 8, textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>Habitude</div>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day}>{day}</div>)}
            </div>

            {/* Habit rows */}
            {habits.map(h => (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{h.name}</span>
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleToggleHabit(h.id, idx)}
                    style={{
                      height: 34,
                      borderRadius: 6,
                      backgroundColor: h.history[idx] ? '#10b981' : 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {h.history[idx] ? '✓' : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleAdd} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Nouvelle habitude</h2>
          <input type="text" required value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="Titre (ex: Sport, Lecture)" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>Ajouter</button>
        </form>
      </div>
    </div>
  );
}