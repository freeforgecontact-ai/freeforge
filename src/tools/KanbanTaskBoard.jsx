import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function KanbanTaskBoard({ goBack }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const val = localStorage.getItem('fl_kanban');
      return val ? JSON.parse(val) : [
        { id: '1', title: 'Concevoir l\'interface', lane: 'todo' },
        { id: '2', title: 'Configurer le monorepo', lane: 'playing' },
        { id: '3', title: 'Planifier les suites', lane: 'done' }
      ];
    } catch (e) {
      console.error("Error reading fl_kanban", e);
      return [];
    }
  });

  const [newTitle, setNewTitle] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeDragOverLane, setActiveDragOverLane] = useState(null);

  useEffect(() => {
    localStorage.setItem('fl_kanban', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      lane: 'todo'
    };
    setTasks([...tasks, newTask]);
    setNewTitle('');
  };

  const moveTask = (id, lane) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, lane } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getLaneTasks = (lane) => tasks.filter(t => t.lane === lane);

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, lane) => {
    e.preventDefault();
    if (activeDragOverLane !== lane) {
      setActiveDragOverLane(lane);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetLane) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTask(taskId, targetLane);
    }
    setDraggedTaskId(null);
    setActiveDragOverLane(null);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📋 Kanban Task Board</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Organisez visuellement vos projets locaux par étapes avec le glisser-déposer HTML5.</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {['todo', 'playing', 'done'].map(lane => {
            const isOver = activeDragOverLane === lane;
            return (
              <div 
                key={lane} 
                className="glass-panel" 
                onDragOver={e => handleDragOver(e, lane)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, lane)}
                style={{ 
                  padding: 18, 
                  borderRadius: 16, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12, 
                  minHeight: 400,
                  backgroundColor: isOver ? 'rgba(255, 255, 255, 0.08)' : '',
                  border: isOver ? '1.5px dashed var(--color-primary, #3b82f6)' : '1px solid var(--border-light)',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease'
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)', paddingBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{lane === 'todo' ? 'À faire' : lane === 'playing' ? 'En cours' : 'Terminé'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 10 }}>{getLaneTasks(lane).length}</span>
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                  {getLaneTasks(lane).map(t => (
                    <div 
                      key={t.id} 
                      draggable 
                      onDragStart={e => handleDragStart(e, t.id)}
                      style={{ 
                        padding: 12, 
                        backgroundColor: 'rgba(255,255,255,0.03)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: 8, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 10,
                        cursor: 'grab',
                        transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                      onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', color: 'white', lineHeight: 1.4, wordBreak: 'break-word' }}>{t.title}</span>
                        <button 
                          onClick={() => deleteTask(t.id)} 
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                          title="Supprimer la tâche"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Control buttons for tactile / fallback navigation */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 6 }}>
                        {lane !== 'todo' && (
                          <button 
                            type="button"
                            onClick={() => moveTask(t.id, lane === 'done' ? 'playing' : 'todo')} 
                            className="btn-premium btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem', borderRadius: 4 }}
                          >
                            ← Déplacer
                          </button>
                        )}
                        {lane !== 'done' && (
                          <button 
                            type="button"
                            onClick={() => moveTask(t.id, lane === 'todo' ? 'playing' : 'done')} 
                            className="btn-premium btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem', borderRadius: 4, marginLeft: 'auto' }}
                          >
                            Avancer →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {getLaneTasks(lane).length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 8, padding: 16 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Déposez une tâche ici</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}