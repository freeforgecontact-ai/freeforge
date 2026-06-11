import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function HorairesEtudes({ goBack }) {
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('ff_student_schedule');
    return saved ? JSON.parse(saved) : [
      { id: '1', day: 'Lundi', time: '09:00 - 12:00', label: 'Programmation Web', room: 'Local 412', color: '#3b82f6' },
      { id: '2', day: 'Mercredi', time: '13:30 - 16:30', label: 'Mathématiques Appliquées', room: 'Pavillon Principal', color: '#10b981' }
    ];
  });

  const [day, setDay] = useState('Lundi');
  const [time, setTime] = useState('');
  const [label, setLabel] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    localStorage.setItem('ff_student_schedule', JSON.stringify(schedule));
  }, [schedule]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!time || !label) return;

    const newSlot = {
      id: Date.now().toString(),
      day,
      time,
      label,
      room,
      color
    };

    setSchedule([...schedule, newSlot]);
    setTime('');
    setLabel('');
    setRoom('');
  };

  const handleDelete = (id) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📅 Class & Schedule Planner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Organisez votre emploi du temps hebdomadaire de cours et de sessions d'étude.
          </p>
        </div>
        <FolderButton toolId="student_schedule" toolName="HorairesEtudes" localStorageKeys={["ff_student_schedule"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Weekly visualizer */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Emploi du temps de la semaine</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {days.map(d => {
              const items = schedule.filter(s => s.day === d);
              return (
                <div key={d} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center' }}>{d}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {items.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: 6 }}>Aucune plage prévue</span>
                    ) : (
                      items.map(item => (
                        <div key={item.id} style={{ 
                          backgroundColor: item.color, 
                          color: 'white', 
                          padding: '8px 12px', 
                          borderRadius: 8, 
                          fontSize: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          minWidth: 150,
                          position: 'relative'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>{item.label}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>🕒 {item.time}</span>
                          {item.room && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>📍 {item.room}</span>}
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            style={{ 
                              position: 'absolute', 
                              top: 4, 
                              right: 4, 
                              background: 'none', 
                              border: 'none', 
                              color: 'white', 
                              cursor: 'pointer', 
                              fontSize: '0.8rem',
                              opacity: 0.7 
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Plages à planifier</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jour de la semaine</label>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Heure / Plage (ex: 09:00 - 12:00)</label>
              <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className="input-premium" required placeholder="09:00 - 12:00" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Matière / Cours</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="input-premium" required placeholder="Programmation Web" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Local / Salle (Facultatif)</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="input-premium" placeholder="Local 412" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur thématique</label>
              <select value={color} onChange={(e) => setColor(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value="#3b82f6">Bleu</option>
                <option value="#10b981">Vert</option>
                <option value="#f59e0b">Orange</option>
                <option value="#ef4444">Rouge</option>
                <option value="#8b5cf6">Violet</option>
              </select>
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter au planning
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}