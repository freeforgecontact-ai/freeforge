import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function GradientsCSS({ goBack }) {
  const [color1, setColor1] = useState('#3b82f6');
  const [color2, setColor2] = useState('#10b981');
  const [angle, setAngle] = useState(135);
  const [type, setType] = useState('linear');

  const cssCode = type === 'linear' 
    ? 'background: linear-gradient(' + angle + 'deg, ' + color1 + ', ' + color2 + ');'
    : 'background: radial-gradient(circle, ' + color1 + ', ' + color2 + ');';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    alert('Code CSS copié dans le presse-papiers !');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🌈 CSS Gradient & Pattern Maker
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Concevez et prévisualisez des dégradés CSS modernes.
          </p>
        </div>
        <FolderButton toolId="gradient_maker" toolName="GradientsCSS" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ 
            borderRadius: 16, 
            height: 250, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            ...(type === 'linear' 
              ? { background: 'linear-gradient(' + angle + 'deg, ' + color1 + ', ' + color2 + ')' }
              : { background: 'radial-gradient(circle, ' + color1 + ', ' + color2 + ')' }
            )
          }} />

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 8 }}>Code CSS Généré</h3>
            <pre style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: 8, color: '#a7f3d0', fontSize: '0.85rem', overflowX: 'auto', fontFamily: 'monospace' }}>
              {cssCode}
            </pre>
            <button onClick={copyToClipboard} className="btn-premium btn-primary" style={{ marginTop: 12, padding: '10px 16px', fontWeight: 'bold' }}>
              📋 Copier le code CSS
            </button>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Ajustements</h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type de dégradé</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setType('linear')} className={'btn-premium ' + (type === 'linear' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1, padding: 8 }}>Linéaire</button>
              <button onClick={() => setType('radial')} className={'btn-premium ' + (type === 'radial' ? 'btn-primary' : 'btn-secondary')} style={{ flex: 1, padding: 8 }}>Radial</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur 1</label>
              <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer', marginTop: 4 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur 2</label>
              <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer', marginTop: 4 }} />
            </div>
          </div>

          {type === 'linear' && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Angle ({angle}°)</label>
              <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}