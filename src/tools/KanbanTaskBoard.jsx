import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function KanbanTaskBoard({ goBack }) {
  const [tasks, setTasks] = useState(() => {
    const val = localStorage.getItem('fl_kanban');
    return val ? JSON.parse(val) : [
      { id: '1', title: 'Concevoir l\'interface', lane: 'todo' },
      { id: '2', title: 'Configurer le monorepo', lane: 'playing' },
      { id: '3', title: 'Planifier les suites', lane: 'done' }
    ];
  });

  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('fl_kanban', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTitle,
      lane: 'todo'
    };
    setTasks([...tasks, newTask]);
    setNewTitle('');
  };

  const moveTask = (id, lane) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, lane } : t));
  };

  const getLaneTasks = (lane) => tasks.filter(t => t.lane === lane);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📋 Kanban Task Board</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Organisez visuellement vos projets locaux par étapes.</p>
        </div>
        <FolderButton toolId="kanban_board" toolName="KanbanTaskBoard" localStorageKeys={['fl_kanban']} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Form */}
        <form onSubmit={handleAddTask} className="glass-panel" style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ajouter une tâche..." className="input-premium" style={{ flex: 1, padding: '10px 14px', borderRadius: 8 }} />
          <button type="submit" className="btn-premium btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 'bold' }}>+ Ajouter</button>
        </form>

        {/* Lanes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {['todo', 'playing', 'done'].map(lane => (
            <div key={lane} className="glass-panel" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 300 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                {lane === 'todo' ? 'À faire' : lane === 'playing' ? 'En cours' : 'Terminé'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getLaneTasks(lane).map(t => (
                  <div key={t.id} style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{t.title}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {lane !== 'todo' && <button onClick={() => moveTask(t.id, lane === 'done' ? 'playing' : 'todo')} className="btn-premium btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', borderRadius: 4 }}>←</button>}
                      {lane !== 'done' && <button onClick={() => moveTask(t.id, lane === 'todo' ? 'playing' : 'done')} className="btn-premium btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', borderRadius: 4, marginLeft: 'auto' }}>→</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}