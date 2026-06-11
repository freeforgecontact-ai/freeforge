import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function MetronomeBPM({ goBack }) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(false);
  const [taps, setTaps] = useState([]);

  const metronomeRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Initialize or get the single AudioContext instance
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  const playBeep = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A note

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = (60 / bpm) * 1000;
      
      // Play immediately on start
      setBeat(true);
      playBeep();
      setTimeout(() => setBeat(false), 80);

      metronomeRef.current = setInterval(() => {
        setBeat(true);
        playBeep();
        setTimeout(() => setBeat(false), 80);
      }, intervalMs);
    } else {
      clearInterval(metronomeRef.current);
    }

    return () => clearInterval(metronomeRef.current);
  }, [isPlaying, bpm]);

  // Handle Tap Tempo logic
  const handleTap = () => {
    const timeNow = Date.now();
    setTaps(prev => {
      const nextTaps = [...prev, timeNow].slice(-4); // Keep last 4 timestamps
      if (nextTaps.length > 1) {
        let sum = 0;
        for (let i = 1; i < nextTaps.length; i++) {
          sum += nextTaps[i] - nextTaps[i - 1];
        }
        const avgInterval = sum / (nextTaps.length - 1);
        const calculatedBpm = Math.round(60000 / avgInterval);

        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setBpm(calculatedBpm);
        }
      }
      return nextTaps;
    });
  };

  useEffect(() => {
    return () => {
      clearInterval(metronomeRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
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
            🎵 BPM & Tap Tempo Metronome
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Déterminez le tempo en battant la mesure (Tap Tempo) ou glissez le curseur.
          </p>
        </div>
        <FolderButton toolId="metronome" toolName="MetronomeBPM" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, maxWidth: 500, margin: '40px auto', padding: 32 }} className="glass-panel">
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          backgroundColor: beat ? 'var(--secondary)' : 'rgba(255,255,255,0.03)', 
          boxShadow: beat ? '0 0 20px var(--secondary)' : 'none',
          transition: 'all 0.05s ease',
          border: '3px solid var(--border-light)'
        }} />

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3.8rem', fontWeight: 900, color: 'white', letterSpacing: -1 }}>{bpm}</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginLeft: 8, fontWeight: 700 }}>BPM</span>
        </div>

        <input 
          type="range" 
          min="40" 
          max="240" 
          value={bpm} 
          onChange={(e) => setBpm(parseInt(e.target.value, 10))} 
          style={{ width: '90%', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', gap: 12, width: '90%', justifyContent: 'center' }}>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="btn-premium btn-primary" 
            style={{ padding: '12px 28px', fontWeight: 'bold', fontSize: '1rem', flex: 1, justifyContent: 'center' }}
          >
            {isPlaying ? '⏸️ Arrêter' : '▶️ Démarrer'}
          </button>
          
          <button 
            onClick={handleTap} 
            className="btn-premium btn-secondary" 
            style={{ padding: '12px 28px', fontWeight: 'bold', fontSize: '1rem', flex: 1, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            🥁 TAP TEMPO
          </button>
        </div>
        
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          * Cliquez plusieurs fois sur "TAP TEMPO" au rythme de la musique pour synchroniser le BPM.
        </span>
      </div>
    </div>
  );
}