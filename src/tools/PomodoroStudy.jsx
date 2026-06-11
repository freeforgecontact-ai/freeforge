import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function PomodoroStudy({ goBack }) {
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  // Persist completed sessions count
  const [completedSessions, setCompletedSessions] = useState(() => {
    const saved = localStorage.getItem('ff_student_pomodoro');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [bgNoiseActive, setBgNoiseActive] = useState(false);

  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const noiseGainRef = useRef(null);

  // Sync session counter to local storage
  useEffect(() => {
    localStorage.setItem('ff_student_pomodoro', completedSessions.toString());
  }, [completedSessions]);

  useEffect(() => {
    setTimeLeft(mode === 'work' ? workTime * 60 : breakTime * 60);
  }, [workTime, breakTime, mode]);

  // Handle Metronome / Alarm Audio Context Beep
  const triggerAlarmBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
      
      setTimeout(() => ctx.close(), 1200);
    } catch (err) {
      console.error(err);
    }
  };

  // Focus Background Noise Synthesizer
  const startBackgroundNoise = () => {
    try {
      if (noiseSourceRef.current) return; // Already running

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Warm lowpass filter to make it a soft focus rumble (around 350Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      const gain = ctx.createGain();
      gain.gain.value = 0.08; // quiet background level

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();

      noiseSourceRef.current = source;
      noiseGainRef.current = gain;
    } catch (e) {
      console.error(e);
    }
  };

  const stopBackgroundNoise = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    noiseGainRef.current = null;
  };

  // Sync background noise to timer state
  useEffect(() => {
    if (isRunning && bgNoiseActive && mode === 'work') {
      startBackgroundNoise();
    } else {
      stopBackgroundNoise();
    }
  }, [isRunning, bgNoiseActive, mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            triggerAlarmBeep();

            if (mode === 'work') {
              setCompletedSessions(c => c + 1);
              setMode('break');
              alert("Session de travail terminée ! C'est l'heure de la pause.");
            } else {
              setMode('work');
              alert("Pause terminée ! Retour au travail.");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? workTime * 60 : breakTime * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopBackgroundNoise();
    };
  }, []);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ⏱️ Pomodoro Study Engine
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Concentrez-vous efficacement avec des cycles de travail alternés et un bruit de fond relaxant.
          </p>
        </div>
        <FolderButton toolId="pomodoro" toolName="PomodoroStudy" localStorageKeys={['ff_student_pomodoro']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'center' }}>
        {/* Main Clock */}
        <div className="glass-panel" style={{ padding: 48, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ 
            width: 220, 
            height: 220, 
            borderRadius: '50%', 
            border: '8px solid ' + (mode === 'work' ? '#3b82f6' : '#10b981'), 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3.5rem', 
            fontWeight: 800,
            color: 'white',
            background: 'rgba(255,255,255,0.01)',
            boxShadow: '0 0 25px ' + (mode === 'work' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)')
          }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: mode === 'work' ? '#3b82f6' : '#10b981' }}>
            {mode === 'work' ? '📚 Session de Travail' : '☕ Pause méritée'}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={toggleTimer} className="btn-premium btn-primary" style={{ padding: '12px 28px', fontWeight: 'bold' }}>
              {isRunning ? '⏸️ Pause' : '▶️ Démarrer'}
            </button>
            <button onClick={resetTimer} className="btn-premium btn-secondary" style={{ padding: '12px 24px' }}>
              🔄 Réinitialiser
            </button>
          </div>
        </div>

        {/* Adjustments & Stats */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>Paramètres</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Durée de travail (minutes)</label>
            <input type="number" value={workTime} onChange={(e) => setWorkTime(Math.max(1, parseInt(e.target.value, 10) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Durée de pause (minutes)</label>
            <input type="number" value={breakTime} onChange={(e) => setBreakTime(Math.max(1, parseInt(e.target.value, 10) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input 
                type="checkbox" 
                checked={bgNoiseActive} 
                onChange={() => setBgNoiseActive(!bgNoiseActive)}
                style={{ width: 18, height: 18, accentColor: 'var(--secondary)' }}
              />
              <span style={{ color: 'white', fontWeight: 600 }}>🔊 Activer le bruit rose de focus</span>
            </label>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              * Un léger bruit blanc basse fréquence se lance automatiquement pendant les phases d'étude.
            </span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sessions terminées :</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>{completedSessions}</div>
            </div>
            <button 
              onClick={() => setCompletedSessions(0)} 
              className="btn-premium btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}