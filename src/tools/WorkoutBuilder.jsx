import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function WorkoutBuilder({ goBack }) {
  const [exercises, setExercises] = useState([
    { id: '1', name: 'Jumping Jacks', duration: 30 },
    { id: '2', name: 'Repos', duration: 15 },
    { id: '3', name: 'Squats', duration: 30 },
    { id: '4', name: 'Repos', duration: 15 },
    { id: '5', name: 'Planche', duration: 30 }
  ]);
  
  const [activeIdx, setActiveIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || activeIdx === null) return;
    if (timeLeft <= 0) {
      // Go to next exercise
      if (activeIdx < exercises.length - 1) {
        const next = activeIdx + 1;
        setActiveIdx(next);
        setTimeLeft(exercises[next].duration);
        speak(exercises[next].name);
      } else {
        setIsRunning(false);
        setActiveIdx(null);
        speak("Entraînement complété ! Bravo !");
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, activeIdx]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
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
      speak(exercises[0].name);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🏃 Workout Builder & Timer</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Créez vos circuits et laissez la synthèse vocale vous guider.</p>
        </div>
        <FolderButton toolId="workout" toolName="WorkoutBuilder" localStorageKeys={['fl_workout']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {activeIdx !== null ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>Activité courante</div>
              <div style={{ fontSize: '2.5rem', color: 'white', fontWeight: 800, marginTop: 8 }}>{exercises[activeIdx].name}</div>
              <div style={{ fontSize: '5rem', color: 'white', fontWeight: 800, margin: '20px 0' }}>{timeLeft}s</div>
            </div>
          ) : (
            <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Cliquez sur Commencer pour débuter le circuit.</div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleStart} className="btn-premium btn-primary" style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 'bold' }}>
              {isRunning ? '▶ Reprendre' : '⚡ Commencer'}
            </button>
            <button onClick={() => setIsRunning(false)} className="btn-premium btn-secondary" style={{ padding: '12px 24px', borderRadius: 8 }}>⏸ Pause</button>
            <button onClick={() => { setIsRunning(false); setActiveIdx(null); }} className="btn-premium btn-secondary" style={{ padding: '12px 24px', borderRadius: 8, color: '#ef4444' }}>⏹ Stop</button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Circuit d'exercices</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.map((ex, idx) => (
              <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, backgroundColor: activeIdx === idx ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeIdx === idx ? '#10b981' : 'var(--border-light)'}`, borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 'bold', color: activeIdx === idx ? '#10b981' : 'white' }}>{idx + 1}. {ex.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{ex.duration}s</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}