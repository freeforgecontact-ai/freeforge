import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function JournalMoodTracker({ goBack }) {
  const [entries, setEntries] = useState(() => {
    const val = localStorage.getItem('fl_journal');
    return val ? JSON.parse(val) : [];
  });
  
  const [text, setText] = useState('');
  const [mood, setMood] = useState('🙂');

  useEffect(() => {
    localStorage.setItem('fl_journal', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!text) return;
    const newEntry = {
      id: Date.now().toString(),
      text,
      mood,
      date: new Date().toLocaleString('fr-FR')
    };
    setEntries([newEntry, ...entries]);
    setText('');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📓 Journal Intime Local & Mood Tracker</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notez vos pensées et suivez votre humeur en toute confidentialité.</p>
        </div>
        <FolderButton toolId="journal_intime" toolName="JournalMoodTracker" localStorageKeys={['fl_journal']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleAddEntry} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Nouvelle note de journal</h2>
            
            <div style={{ display: 'flex', gap: 10 }}>
              {['🙂', '😀', '😐', '🙁', '😡'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(m)}
                  style={{
                    fontSize: '1.5rem',
                    padding: 8,
                    borderRadius: 8,
                    border: mood === m ? '1.5px solid #10b981' : '1px solid var(--border-light)',
                    backgroundColor: mood === m ? 'rgba(16,185,129,0.1)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Écrivez vos pensées du jour..." className="input-premium" style={{ width: '100%', height: 120, padding: 10, borderRadius: 8, fontSize: '0.9rem', lineHeight: 1.5 }} />
            <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>💾 Enregistrer</button>
          </form>

          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Notes passées</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {entries.length > 0 ? entries.map(e => (
                <div key={e.id} style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <span>{e.date}</span>
                    <span>Humeur: {e.mood}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{e.text}</p>
                </div>
              )) : (
                <div style={{ padding: 16, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucune note enregistrée.</div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Suivi d'Humeur</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {Array.from({ length: 28 }).map((_, idx) => {
              const entry = entries[idx];
              return (
                <div 
                  key={idx} 
                  style={{
                    height: 36,
                    borderRadius: 6,
                    backgroundColor: entry ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}
                  title={entry ? entry.date : 'Jour vide'}
                >
                  {entry ? entry.mood : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}