import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function FlexboxPlayground({ goBack }) {
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [wrap, setWrap] = useState('nowrap');
  const [gap, setGap] = useState(16);
  const [itemCount, setItemCount] = useState(4);

  const generateCss = () => {
    return `.flex-container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`;
  };

  const handleCopyCss = () => {
    navigator.clipboard.writeText(generateCss());
    alert('Code CSS copié !');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔲 Flexbox & Grid Playground
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Concevez et visualisez vos mises en page CSS Flexbox en direct et exportez le code épuré.
          </p>
        </div>
        <FolderButton toolId="flexbox_playground" toolName="FlexboxPlayground" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left column: Controls */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Options de Flexbox</h2>

          {/* flex-direction */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>flex-direction :</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="row">row</option>
              <option value="row-reverse">row-reverse</option>
              <option value="column">column</option>
              <option value="column-reverse">column-reverse</option>
            </select>
          </div>

          {/* justify-content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>justify-content :</label>
            <select value={justify} onChange={(e) => setJustify(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="space-between">space-between</option>
              <option value="space-around">space-around</option>
              <option value="space-evenly">space-evenly</option>
            </select>
          </div>

          {/* align-items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>align-items :</label>
            <select value={align} onChange={(e) => setAlign(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="stretch">stretch</option>
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="baseline">baseline</option>
            </select>
          </div>

          {/* flex-wrap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>flex-wrap :</label>
            <select value={wrap} onChange={(e) => setWrap(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="nowrap">nowrap</option>
              <option value="wrap">wrap</option>
              <option value="wrap-reverse">wrap-reverse</option>
            </select>
          </div>

          {/* gap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>gap :</label>
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{gap}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="64" 
              value={gap} 
              onChange={(e) => setGap(parseInt(e.target.value))} 
              style={{ width: '100%' }}
            />
          </div>

          {/* Item count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre d'items :</label>
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{itemCount}</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="10" 
              value={itemCount} 
              onChange={(e) => setItemCount(parseInt(e.target.value))} 
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Right column: Preview & Code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Visual container */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Prévisualisation interactive</h2>
            <div 
              style={{
                display: 'flex',
                flexDirection: direction,
                justifyContent: justify,
                alignItems: align,
                flexWrap: wrap,
                gap: `${gap}px`,
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px dashed var(--border-light)',
                borderRadius: 12,
                minHeight: 260,
                padding: 16,
                transition: 'all 0.2s'
              }}
            >
              {Array.from({ length: itemCount }).map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    backgroundColor: `hsla(${(idx * 50) % 360}, 70%, 55%, 0.15)`,
                    border: `1.5px solid hsla(${(idx * 50) % 360}, 70%, 55%, 0.5)`,
                    borderRadius: 8,
                    padding: '24px 32px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    minWidth: 60,
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Generated code */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Code CSS généré</h2>
            <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontSize: '0.8rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', overflowX: 'auto', margin: 0, color: '#10b981' }}>
              {generateCss()}
            </pre>
            <button onClick={handleCopyCss} className="btn-premium btn-secondary" style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>
              📋 Copier le code CSS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
