import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function RetroSoundGenerator({ goBack }) {
  const [playStatus, setPlayStatus] = useState('');

  const playSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;

      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'explosion') {
        // Synthesize noise for explosion
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        // Low pass filter
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(10, now + 0.4);
        
        noise.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        noise.start(now);
        noise.stop(now + 0.4);
      }
      
      setPlayStatus(`Son '${type}' joué !`);
      setTimeout(() => setPlayStatus(''), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>👾 8-Bit Retro Sound Generator</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Générez instantanément des effets sonores rétro avec l'API Web Audio.</p>
        </div>
        <FolderButton toolId="sound_generator" toolName="RetroSoundGenerator" />
      </div>

      <div className="glass-panel" style={{ padding: 24, borderRadius: 16, maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Console Audio</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
          <button onClick={() => playSound('jump')} className="btn-premium btn-secondary" style={{ padding: 16, fontSize: '1rem', borderRadius: 10 }}>🦘 Saut (Jump)</button>
          <button onClick={() => playSound('laser')} className="btn-premium btn-secondary" style={{ padding: 16, fontSize: '1rem', borderRadius: 10 }}>🔫 Tir Laser</button>
          <button onClick={() => playSound('coin')} className="btn-premium btn-secondary" style={{ padding: 16, fontSize: '1rem', borderRadius: 10 }}>🪙 Pièce d'or (Coin)</button>
          <button onClick={() => playSound('explosion')} className="btn-premium btn-secondary" style={{ padding: 16, fontSize: '1rem', borderRadius: 10 }}>💥 Explosion</button>
        </div>

        {playStatus && (
          <div style={{ padding: 10, color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {playStatus}
          </div>
        )}
      </div>
    </div>
  );
}