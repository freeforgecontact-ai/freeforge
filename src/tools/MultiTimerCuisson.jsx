import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function MultiTimerCuisson({ goBack }) {
  const [timers, setTimers] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_cooking_timers');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Pâtes 🍝', limit: 480, current: 480, running: false },
        { id: '2', name: 'Steak 🥩', limit: 180, current: 180, running: false }
      ];
    } catch (e) {
      console.error("Error reading ff_cooking_timers", e);
      return [];
    }
  });

  const [activeAlarmName, setActiveAlarmName] = useState(null);

  // New timer input states
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ff_cooking_timers', JSON.stringify(timers));
  }, [timers]);

  // Main countdown tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (!t.running) return t;
        if (t.current <= 1) {
          // Trigger alarm state
          setActiveAlarmName(t.name);
          return { ...t, current: 0, running: false };
        }
        return { ...t, current: t.current - 1 };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Web Audio chime player
  const playAlarmBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch A5
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      // Double beep pattern
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + 0.25);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  // Repeated alarm loop when a timer reaches zero
  useEffect(() => {
    if (!activeAlarmName) return;

    playAlarmBeep();
    const timerId = setInterval(playAlarmBeep, 1500);

    return () => clearInterval(timerId);
  }, [activeAlarmName]);

  const handleStartStop = (id) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, running: !t.running } : t));
  };

  const handleReset = (id) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, current: t.limit, running: false } : t));
  };

  const handleAddTimer = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const totalSecs = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    if (totalSecs <= 0) {
      alert("Veuillez entrer une durée supérieure à 0.");
      return;
    }

    const newTimerObj = {
      id: Date.now().toString(),
      name: name.trim(),
      limit: totalSecs,
      current: totalSecs,
      running: false
    };

    setTimers([...timers, newTimerObj]);
    setName('');
    setMinutes(10);
    setSeconds(0);
  };

  const handleDeleteTimer = (id) => {
    setTimers(timers.filter(t => t.id !== id));
  };

  const handleStopAlarm = () => {
    setActiveAlarmName(null);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ⏰ Multi-Timer de Cuisson
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Gérez vos temps de cuisson parallèles avec alarmes sonores configurables en local.
          </p>
        </div>
        <FolderButton toolId="cooking_timer" toolName="MultiTimerCuisson" localStorageKeys={['ff_cooking_timers']} />
      </div>

      {/* Alarm Alert Bar */}
      {activeAlarmName && (
        <div 
          className="animate-pulse"
          style={{ 
            padding: 16, 
            backgroundColor: '#ef4444', 
            borderRadius: 12, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 20, 
            color: 'white', 
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
          }}
        >
          <span>⚠️ ALARME : "{activeAlarmName}" est prêt !</span>
          <button 
            onClick={handleStopAlarm} 
            className="btn-premium btn-secondary" 
            style={{ padding: '6px 12px', color: '#ef4444', backgroundColor: 'white', fontWeight: 'bold' }}
          >
            🔕 Éteindre l'alarme
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Active Timers List */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white', margin: 0 }}>Minuteurs Actifs</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
            {timers.length === 0 ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun minuteur configuré.</span>
            ) : (
              timers.map(t => (
                <div 
                  key={t.id} 
                  style={{ 
                    padding: 18, 
                    backgroundColor: t.current === 0 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.01)', 
                    border: `1px solid ${t.current === 0 ? '#ef4444' : 'var(--border-light)'}`, 
                    borderRadius: 10, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 12,
                    position: 'relative'
                  }}
                >
                  <button 
                    onClick={() => handleDeleteTimer(t.id)} 
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                    title="Supprimer"
                  >
                    ✕
                  </button>

                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{t.name}</span>
                  <div style={{ fontSize: '3rem', fontFamily: 'monospace', fontWeight: 800, color: t.current === 0 ? '#ef4444' : 'white' }}>
                    {formatTime(t.current)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handleStartStop(t.id)} 
                      disabled={t.current === 0}
                      className="btn-premium btn-primary" 
                      style={{ padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }}
                    >
                      {t.running ? '⏸ Pause' : '▶ Commencer'}
                    </button>
                    <button 
                      onClick={() => handleReset(t.id)} 
                      className="btn-premium btn-secondary" 
                      style={{ padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }}
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Timer Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: 0, marginBottom: 16 }}>Nouveau Minuteur</h3>
          
          <form onSubmit={handleAddTimer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Étiquette / Nom :</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="ex: Poulet au four 🍗" 
                className="input-premium" 
                style={{ width: '100%', padding: 8, marginTop: 4 }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minutes :</label>
                <input 
                  type="number" 
                  min="0" 
                  max="180" 
                  value={minutes} 
                  onChange={e => setMinutes(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="input-premium" 
                  style={{ width: '100%', padding: 8, marginTop: 4, textAlign: 'center' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Secondes :</label>
                <input 
                  type="number" 
                  min="0" 
                  max="59" 
                  value={seconds} 
                  onChange={e => setSeconds(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="input-premium" 
                  style={{ width: '100%', padding: 8, marginTop: 4, textAlign: 'center' }} 
                />
              </div>
            </div>

            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold', justifyContent: 'center' }}>
              💾 Créer le minuteur
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}