import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function HydratationLog({ goBack }) {
  const [target, setTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_water_target');
      return saved ? parseInt(saved, 10) : 2000;
    } catch { return 2000; }
  });
  
  const [current, setCurrent] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_water');
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });

  const [reminderActive, setReminderActive] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_water_reminder_active');
      return saved === 'true';
    } catch { return false; }
  });

  const [reminderInterval, setReminderInterval] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_water_reminder_interval');
      return saved ? parseInt(saved, 10) : 60; // default 60 minutes
    } catch { return 60; }
  });

  const [timeLeft, setTimeLeft] = useState(reminderInterval * 60);

  const timerRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ff_water', current.toString());
  }, [current]);

  useEffect(() => {
    localStorage.setItem('ff_water_target', target.toString());
  }, [target]);

  useEffect(() => {
    localStorage.setItem('ff_water_reminder_active', reminderActive.toString());
    localStorage.setItem('ff_water_reminder_interval', reminderInterval.toString());
    setTimeLeft(reminderInterval * 60);
  }, [reminderActive, reminderInterval]);

  // Audio Drop Sound Synthesizer (Web Audio API)
  const playDropSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Fast pitch sweep from 400Hz to 1500Hz to simulate water drop "plip"
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.error("Failed to play drop audio:", e);
    }
  };

  // Browser Notification helper
  const triggerNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification("💧 FreeForge Hydratation", {
          body: "Il est temps de boire un verre d'eau pour rester en forme !",
          icon: "/favicon.ico"
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification("💧 FreeForge Hydratation", {
              body: "Il est temps de boire un verre d'eau !",
              icon: "/favicon.ico"
            });
          }
        });
      }
    }
  };

  // Reminder Timer ticking
  useEffect(() => {
    if (!reminderActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          playDropSound();
          triggerNotification();
          return reminderInterval * 60; // Reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reminderActive, reminderInterval]);

  const addWater = (amount) => {
    setCurrent(prev => Math.min(target * 2, prev + amount));
    playDropSound();
  };

  const resetLog = () => {
    if (confirm("Voulez-vous réinitialiser votre suivi d'eau d'aujourd'hui ?")) {
      setCurrent(0);
    }
  };

  const percentage = Math.min(100, (current / target) * 100);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            💧 Water Intake Log & Reminders
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Suivez votre consommation quotidienne d'eau et recevez des rappels sonores locaux configurables.
          </p>
        </div>
        <FolderButton toolId="water_intake" toolName="HydratationLog" localStorageKeys={["ff_water", "ff_water_target", "ff_water_reminder_active", "ff_water_reminder_interval"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Visual column filling up */}
        <div className="glass-panel" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', alignSelf: 'flex-start', margin: 0 }}>Remplissage Actuel</h2>
          <div style={{ 
            width: 140, 
            height: 240, 
            border: '4px solid var(--border-light)', 
            borderRadius: 12, 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.01)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              width: '100%', 
              height: percentage + '%', 
              backgroundColor: '#3b82f6', 
              backgroundImage: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
              transition: 'height 0.4s ease-out',
              boxShadow: 'inset 0 10px 20px rgba(255,255,255,0.3)'
            }} />
            
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              fontSize: '1.4rem', 
              fontWeight: 800, 
              color: percentage > 50 ? 'white' : '#60a5fa',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              zIndex: 2
            }}>
              {Math.round(percentage)}%
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#60a5fa' }}>{current}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}> / {target} ml</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => addWater(250)} className="btn-premium btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>+ 250ml 🥛</button>
            <button onClick={() => addWater(500)} className="btn-premium btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>+ 500ml 💧</button>
            <button onClick={() => addWater(100)} className="btn-premium btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>+ 100ml ☕</button>
            <button onClick={resetLog} className="btn-premium btn-danger" style={{ padding: '8px 14px', fontSize: '0.85rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Target setting */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12, marginTop: 0 }}>Objectif Quotidien</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input 
                type="number" 
                step="100" 
                min="500"
                max="10000"
                value={target} 
                onChange={(e) => setTarget(Math.max(500, parseInt(e.target.value, 10) || 500))} 
                className="input-premium" 
                style={{ flex: 1, fontSize: '1.2rem', textAlign: 'center', padding: 8 }} 
              />
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ml</span>
            </div>
          </div>

          {/* Audio Reminder */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>🔔 Rappel d'Hydratation</h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
              <input 
                type="checkbox" 
                checked={reminderActive} 
                onChange={e => setReminderActive(e.target.checked)} 
                style={{ width: 18, height: 18 }}
              />
              Activer les rappels d'eau
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Intervalle de rappel :</label>
              <select 
                value={reminderInterval} 
                disabled={!reminderActive}
                onChange={e => setReminderInterval(parseInt(e.target.value, 10))} 
                className="input-premium"
                style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
              >
                <option value="1">Toutes les 1 Minute (Test)</option>
                <option value="15">Toutes les 15 Minutes</option>
                <option value="30">Toutes les 30 Minutes</option>
                <option value="60">Chaque heure (60 min)</option>
                <option value="120">Toutes les 2 heures (120 min)</option>
              </select>
            </div>

            {reminderActive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prochain rappel dans :</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#60a5fa' }}>{formatTime(timeLeft)}</span>
              </div>
            )}
            
            <button onClick={playDropSound} className="btn-premium btn-secondary" style={{ width: '100%', padding: 8, fontSize: '0.8rem' }}>
              🔊 Tester le signal sonore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}