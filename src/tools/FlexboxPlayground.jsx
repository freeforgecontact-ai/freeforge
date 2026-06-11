import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function FlexboxPlayground({ goBack }) {
  const [activeTab, setActiveTab] = useState('flex'); // 'flex' | 'grid'

  // Flexbox states
  const [direction, setDirection] = useState('row');
  const [justify, setJustify] = useState('flex-start');
  const [align, setAlign] = useState('stretch');
  const [wrap, setWrap] = useState('nowrap');

  // Grid states
  const [gridCols, setGridCols] = useState('repeat(3, 1fr)');
  const [gridRows, setGridRows] = useState('auto');
  const [justifyItems, setJustifyItems] = useState('stretch');
  const [alignItems, setAlignItems] = useState('stretch');

  // Common states
  const [gap, setGap] = useState(16);
  const [itemCount, setItemCount] = useState(6);

  const generateCss = () => {
    if (activeTab === 'flex') {
      return `.flex-container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`;
    } else {
      return `.grid-container {
  display: grid;
  grid-template-columns: ${gridCols};
  grid-template-rows: ${gridRows};
  justify-items: ${justifyItems};
  align-items: ${alignItems};
  gap: ${gap}px;
}`;
    }
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
            Concevez et visualisez vos mises en page CSS Flexbox et Grid en direct et exportez le code épuré.
          </p>
        </div>
        <FolderButton toolId="flexbox_playground" toolName="FlexboxPlayground" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }} className="no-print">
        <button 
          onClick={() => setActiveTab('flex')} 
          className={`btn-premium ${activeTab === 'flex' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 'bold' }}
        >
          🔀 Mode Flexbox
        </button>
        <button 
          onClick={() => setActiveTab('grid')} 
          className={`btn-premium ${activeTab === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 'bold' }}
        >
          🕸️ Mode CSS Grid
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        
        {/* Left column: Controls */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>
            {activeTab === 'flex' ? 'Options de Flexbox' : 'Options de CSS Grid'}
          </h2>

          {activeTab === 'flex' ? (
            /* Flexbox controls */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>flex-direction :</label>
                <select value={direction} onChange={(e) => setDirection(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="row">row</option>
                  <option value="row-reverse">row-reverse</option>
                  <option value="column">column</option>
                  <option value="column-reverse">column-reverse</option>
                </select>
              </div>

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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>flex-wrap :</label>
                <select value={wrap} onChange={(e) => setWrap(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="nowrap">nowrap</option>
                  <option value="wrap">wrap</option>
                  <option value="wrap-reverse">wrap-reverse</option>
                </select>
              </div>
            </>
          ) : (
            /* CSS Grid controls */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>grid-template-columns :</label>
                <select value={gridCols} onChange={(e) => setGridCols(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="repeat(3, 1fr)">repeat(3, 1fr)</option>
                  <option value="repeat(2, 1fr)">repeat(2, 1fr)</option>
                  <option value="repeat(4, 1fr)">repeat(4, 1fr)</option>
                  <option value="1fr 2fr 1fr">1fr 2fr 1fr (Asymétrique)</option>
                  <option value="repeat(auto-fill, minmax(100px, 1fr))">repeat(auto-fill, minmax(100px, 1fr))</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>grid-template-rows :</label>
                <select value={gridRows} onChange={(e) => setGridRows(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="auto">auto</option>
                  <option value="repeat(2, 1fr)">repeat(2, 1fr)</option>
                  <option value="100px auto">100px auto</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>justify-items :</label>
                <select value={justifyItems} onChange={(e) => setJustifyItems(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="stretch">stretch</option>
                  <option value="start">start</option>
                  <option value="end">end</option>
                  <option value="center">center</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>align-items :</label>
                <select value={alignItems} onChange={(e) => setAlignItems(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                  <option value="stretch">stretch</option>
                  <option value="start">start</option>
                  <option value="end">end</option>
                  <option value="center">center</option>
                </select>
              </div>
            </>
          )}

          {/* Common controls: Gap and Item count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre d'items :</label>
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{itemCount}</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="12" 
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Prévisualisation interactive</h2>
            
            <div 
              style={activeTab === 'flex' ? {
                display: 'flex',
                flexDirection: direction,
                justifyContent: justify,
                alignItems: align,
                flexWrap: wrap,
                gap: `${gap}px`,
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px dashed var(--border-light)',
                borderRadius: 12,
                minHeight: 300,
                padding: 16,
                transition: 'all 0.25s'
              } : {
                display: 'grid',
                gridTemplateColumns: gridCols,
                gridTemplateRows: gridRows,
                justifyItems: justifyItems,
                alignItems: alignItems,
                gap: `${gap}px`,
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px dashed var(--border-light)',
                borderRadius: 12,
                minHeight: 300,
                padding: 16,
                transition: 'all 0.25s'
              }}
            >
              {Array.from({ length: itemCount }).map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    backgroundColor: `hsla(${(idx * 40) % 360}, 75%, 60%, 0.15)`,
                    border: `1.5px solid hsla(${(idx * 40) % 360}, 75%, 60%, 0.55)`,
                    borderRadius: 8,
                    padding: activeTab === 'flex' ? '24px 32px' : '18px 24px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    minWidth: 50,
                    minHeight: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Generated code */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Code CSS généré</h2>
            <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontSize: '0.85rem', fontFamily: 'monospace', border: '1px solid var(--border-light)', overflowX: 'auto', margin: 0, color: '#10b981', lineHeight: '1.4' }}>
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
