import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function RgbLightSync({ goBack }) {
  const [effect, setEffect] = useState('wave'); // 'wave', 'breath', 'static'
  const [color, setColor] = useState('#ff00ea');
  const [speed, setSpeed] = useState(2);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (effect === 'static') return;
    const timer = setInterval(() => {
      setTick(prev => (prev + speed) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, [effect, speed]);

  const getLEDStyle = (index) => {
    if (effect === 'static') {
      return { backgroundColor: color, boxShadow: `0 0 15px ${color}` };
    }
    if (effect === 'breath') {
      const alpha = Math.sin((tick * Math.PI) / 180);
      const absAlpha = Math.abs(alpha).toFixed(2);
      return { 
        backgroundColor: color, 
        opacity: absAlpha, 
        boxShadow: `0 0 15px rgba(${parseInt(color.substring(1,3),16)}, ${parseInt(color.substring(3,5),16)}, ${parseInt(color.substring(5,7),16)}, ${absAlpha})`
      };
    }
    // Wave
    const hue = (tick + index * 15) % 360;
    const waveColor = `hsl(${hue}, 100%, 50%)`;
    return { backgroundColor: waveColor, boxShadow: `0 0 15px ${waveColor}` };
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🌈 RGB Light Sync Designer</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Simulez et configurez des profils LED RGB.</p>
        </div>
        <FolderButton toolId="rgb_designer" toolName="RgbLightSync" localStorageKeys={['fg_rgb']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', alignSelf: 'flex-start' }}>Simulateur de clavier</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 8, width: '100%', maxWidth: 600, padding: 12, backgroundColor: '#09090d', border: '1px solid var(--border-light)', borderRadius: 12 }}>
            {Array.from({ length: 45 }).map((_, idx) => (
              <div 
                key={idx} 
                style={{
                  height: 24,
                  borderRadius: 4,
                  transition: 'background-color 0.1s, opacity 0.1s',
                  ...getLEDStyle(idx)
                }} 
              />
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Options</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Effet :</label>
            <select value={effect} onChange={e => setEffect(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="wave">Vague Arc-en-Ciel</option>
              <option value="breath">Respiration</option>
              <option value="static">Statique</option>
            </select>
          </div>

          {effect !== 'wave' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur :</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
            </div>
          )}

          {effect !== 'static' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vitesse ({speed}) :</label>
              <input type="range" min="1" max="10" value={speed} onChange={e => setSpeed(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}