import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function WorkoutBuilder({ goBack }) {
  const [exercises, setExercises] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_workout');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Jumping Jacks', duration: 30 },
        { id: '2', name: 'Repos', duration: 15 },
        { id: '3', name: 'Squats', duration: 30 },
        { id: '4', name: 'Repos', duration: 15 },
        { id: '5', name: 'Planche', duration: 30 }
      ];
    } catch (e) {
      console.error("Error reading fl_workout", e);
      return [];
    }
  });
  
  // Exercise form inputs
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);

  const [activeIdx, setActiveIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Sync exercises to localStorage
  useEffect(() => {
    localStorage.setItem('fl_workout', JSON.stringify(exercises));
  }, [exercises]);

  // Audio guiding timer engine
  useEffect(() => {
    if (!isRunning || activeIdx === null || exercises.length === 0) return;
    
    if (timeLeft <= 0) {
      const nextIdx = activeIdx + 1;
      if (nextIdx < exercises.length) {
        setActiveIdx(nextIdx);
        setTimeLeft(exercises[nextIdx].duration);
        speak(exercises[nextIdx].name);
      } else {
        // Workout finished
        setIsRunning(false);
        setActiveIdx(null);
        speak("Entraînement complété ! Félicitations !");
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
      // Warning beep or count down for last 3 seconds
      if (timeLeft === 4) {
        speak("3");
      } else if (timeLeft === 3) {
        speak("2");
      } else if (timeLeft === 2) {
        speak("1");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, activeIdx, exercises]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-CA';
      window.speechSynthesis.speak(u);
    }
  };

  const handleStart = () => {
    if (exercises.length === 0) return;
    setIsRunning(true);
    if (activeIdx === null) {
      setActiveIdx(0);
      setTimeLeft(exercises[0].duration);
      speak("Commençons avec " + exercises[0].name);
    } else {
      speak("Reprise");
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    speak("Pause");
  };

  const handleStop = () => {
    setIsRunning(false);
    setActiveIdx(null);
    setTimeLeft(0);
    speak("Entraînement arrêté");
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newEx = {
      id: Date.now().toString(),
      name: newName.trim(),
      duration: Math.max(5, parseInt(newDuration, 10) || 30)
    };
    setExercises([...exercises, newEx]);
    setNewName('');
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    if (isRunning) {
      handleStop();
    }
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const newExs = [...exercises];
    const temp = newExs[idx];
    newExs[idx] = newExs[idx - 1];
    newExs[idx - 1] = temp;
    setExercises(newExs);
    if (isRunning) handleStop();
  };

  const moveDown = (idx) => {
    if (idx === exercises.length - 1) return;
    const newExs = [...exercises];
    const temp = newExs[idx];
    newExs[idx] = newExs[idx + 1];
    newExs[idx + 1] = temp;
    setExercises(newExs);
    if (isRunning) handleStop();
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🏃 Workout Builder & Timer</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Créez vos circuits d'entraînement personnalisés et laissez la synthèse vocale fr-CA vous guider.</p>
        </div>
        <FolderButton toolId="workout" toolName="WorkoutBuilder" localStorageKeys={['fl_workout']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Workout Timer Player */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 350 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', alignSelf: 'flex-start', margin: 0 }}>Chronomètre Circuit</h2>
          
          {activeIdx !== null && exercises[activeIdx] ? (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                EXERCICE {activeIdx + 1} SUR {exercises.length}
              </div>
              <div style={{ fontSize: '2.2rem', color: 'white', fontWeight: 800, marginTop: 8, wordBreak: 'break-word' }}>
                {exercises[activeIdx].name}
              </div>
              
              {/* Giant visual timer */}
              <div style={{ 
                width: 160, 
                height: 160, 
                borderRadius: '50%', 
                border: '4px solid rgba(255,255,255,0.05)', 
                borderTopColor: '#10b981',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '24px auto',
                fontSize: '3.5rem',
                fontWeight: 800,
                color: 'white',
                animation: isRunning ? 'spin 10s linear infinite' : 'none'
              }}>
                {timeLeft}s
              </div>

              {activeIdx + 1 < exercises.length && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Suivant : {exercises[activeIdx + 1].name} ({exercises[activeIdx + 1].duration}s)
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>⚡</span>
              <p style={{ fontSize: '1.1rem', color: 'white', fontWeight: 'bold', margin: 0 }}>Prêt à vous entraîner ?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>Configurez votre circuit à droite puis cliquez sur démarrer.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
            {!isRunning ? (
              <button onClick={handleStart} className="btn-premium btn-primary" style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 'bold' }}>
                {activeIdx !== null ? '▶ Reprendre' : '⚡ Commencer'}
              </button>
            ) : (
              <button onClick={handlePause} className="btn-premium btn-secondary" style={{ padding: '12px 24px', borderRadius: 8 }}>
                ⏸ Pause
              </button>
            )}
            <button onClick={handleStop} className="btn-premium btn-secondary" style={{ padding: '12px 24px', borderRadius: 8, color: '#ef4444' }} disabled={activeIdx === null}>
              ⏹ Stop
            </button>
          </div>
        </div>

        {/* Workout Circuit Editor */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>Éditeur de Circuit ({exercises.length} étapes)</h2>
          
          {/* Add exercise form */}
          <form onSubmit={handleAddExercise} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input 
              type="text" 
              required 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Nom (ex: Pompes)" 
              className="input-premium" 
              style={{ flex: 2, minWidth: 140, padding: 8, borderRadius: 6 }} 
            />
            <input 
              type="number" 
              min="5" 
              max="600" 
              value={newDuration} 
              onChange={e => setNewDuration(Math.max(5, parseInt(e.target.value) || 30))} 
              className="input-premium" 
              style={{ flex: 1, minWidth: 60, padding: 8, borderRadius: 6 }} 
              placeholder="Durée"
            />
            <button type="submit" className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 6, fontWeight: 'bold' }}>
              + Ajouter
            </button>
          </form>

          {/* List of exercises */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto', paddingRight: 4 }}>
            {exercises.length > 0 ? exercises.map((ex, idx) => (
              <div 
                key={ex.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 10, 
                  backgroundColor: activeIdx === idx ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.01)', 
                  border: `1px solid ${activeIdx === idx ? '#10b981' : 'var(--border-light)'}`, 
                  borderRadius: 8, 
                  fontSize: '0.85rem' 
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold', color: activeIdx === idx ? '#10b981' : 'white' }}>
                    {idx + 1}. {ex.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ex.duration} secondes</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'white', cursor: 'pointer', fontSize: '0.9rem', padding: 4 }} title="Monter">▲</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === exercises.length - 1} style={{ border: 'none', background: 'transparent', color: idx === exercises.length - 1 ? 'rgba(255,255,255,0.1)' : 'white', cursor: 'pointer', fontSize: '0.9rem', padding: 4 }} title="Descendre">▼</button>
                  <button onClick={() => handleRemoveExercise(ex.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', marginLeft: 4 }} title="Supprimer">×</button>
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Aucun exercice dans le circuit. Créez-en un ci-dessus.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}