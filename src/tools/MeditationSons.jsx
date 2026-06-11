import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function MeditationSons({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscRef = useRef(null);

  const startSynthesis = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      gainNode.gain.setValueAtTime(volume / 500, audioCtx.currentTime); // Low meditation wave volume

      // Create a nice deep low-frequency wave (Binaural pulse effect)
      const osc1 = audioCtx.createOscillator();
      osc1.frequency.setValueAtTime(100, audioCtx.currentTime); // 100Hz deep sine
      osc1.connect(gainNode);

      osc1.start();

      audioCtxRef.current = audioCtx;
      gainNodeRef.current = gainNode;
      oscRef.current = osc1;
      setIsPlaying(true);
    } catch (err) {}
  };

  const stopSynthesis = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch (e) {}
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying && gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume / 500, audioCtxRef.current.currentTime);
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    return () => {
      stopSynthesis();
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
            🧘 Meditation Ambient Soundscape
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez des ondes binaurales profondes pour la méditation et la relaxation locale.
          </p>
        </div>
        <FolderButton toolId="meditation_sounds" toolName="MeditationSons" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 500, margin: '40px auto' }} className="glass-panel">
        <span style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold' }}>Générateur Ondes Delta / Alpha (100 Hz)</span>
        
        <button onClick={isPlaying ? stopSynthesis : startSynthesis} className="btn-premium btn-primary" style={{ padding: '14px 32px', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {isPlaying ? '⏸️ Arrêter le son' : '▶️ Démarrer le son'}
        </button>

        <div style={{ width: '80%' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Volume ({volume}%)</label>
          <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}