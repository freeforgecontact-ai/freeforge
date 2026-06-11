import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function OmbragesCSS({ goBack }) {
  const [shadows, setShadows] = useState([
    { id: '1', hOffset: 4, vOffset: 4, blur: 8, color: '#000000', opacity: 0.5 }
  ]);
  const [activeShadowId, setActiveShadowId] = useState('1');
  const [demoText, setDemoText] = useState('Texte Ombré');

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getFullTextShadow = () => {
    return shadows.map(s => `${s.hOffset}px ${s.vOffset}px ${s.blur}px ${hexToRgba(s.color, s.opacity)}`).join(', ');
  };

  const shadowCss = `text-shadow: ${getFullTextShadow()};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shadowCss);
    alert("Code CSS de l'ombrage copié !");
  };

  const activeShadow = shadows.find(s => s.id === activeShadowId) || shadows[0];

  const updateActiveShadow = (key, value) => {
    setShadows(prev => prev.map(s => s.id === activeShadowId ? { ...s, [key]: value } : s));
  };

  const addLayer = () => {
    const newId = Date.now().toString();
    const newLayer = {
      id: newId,
      hOffset: 2,
      vOffset: 2,
      blur: 4,
      color: '#3b82f6',
      opacity: 0.6
    };
    setShadows([...shadows, newLayer]);
    setActiveShadowId(newId);
  };

  const deleteLayer = (id) => {
    if (shadows.length <= 1) {
      alert("Il doit y avoir au moins une couche d'ombrage.");
      return;
    }
    const filtered = shadows.filter(s => s.id !== id);
    setShadows(filtered);
    if (activeShadowId === id) {
      setActiveShadowId(filtered[0].id);
    }
  };

  // Preset generators
  const applyPreset3D = () => {
    setShadows([
      { id: '1', hOffset: 1, vOffset: 1, blur: 0, color: '#cccccc', opacity: 1 },
      { id: '2', hOffset: 2, vOffset: 2, blur: 0, color: '#c9c9c9', opacity: 1 },
      { id: '3', hOffset: 3, vOffset: 3, blur: 0, color: '#bbbbbb', opacity: 1 },
      { id: '4', hOffset: 4, vOffset: 4, blur: 0, color: '#b9b9b9', opacity: 1 },
      { id: '5', hOffset: 5, vOffset: 5, blur: 0, color: '#aaaaaa', opacity: 1 },
      { id: '6', hOffset: 6, vOffset: 6, blur: 1, color: '#000000', opacity: 0.3 }
    ]);
    setActiveShadowId('1');
  };

  const applyPresetNeon = () => {
    setShadows([
      { id: '1', hOffset: 0, vOffset: 0, blur: 4, color: '#ffffff', opacity: 1 },
      { id: '2', hOffset: 0, vOffset: 0, blur: 10, color: '#00ffff', opacity: 1 },
      { id: '3', hOffset: 0, vOffset: 0, blur: 20, color: '#00ffff', opacity: 0.8 },
      { id: '4', hOffset: 0, vOffset: 0, blur: 30, color: '#ff00ff', opacity: 0.7 }
    ]);
    setActiveShadowId('1');
  };

  const applyPresetLongShadow = () => {
    const list = [];
    for (let i = 1; i <= 18; i++) {
      list.push({
        id: i.toString(),
        hOffset: i,
        vOffset: i,
        blur: 0,
        color: '#3b82f6',
        opacity: Math.max(0.02, 0.7 - (i * 0.04))
      });
    }
    setShadows(list);
    setActiveShadowId('1');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🌘 CSS Text Shadow Engine
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez et visualisez des ombrages de texte complexes en cumulant plusieurs couches.
          </p>
        </div>
        <FolderButton toolId="shadow_engine" toolName="OmbragesCSS" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 40, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', backgroundColor: '#0f172a' }}>
            <input 
              type="text" 
              value={demoText} 
              onChange={e => setDemoText(e.target.value)} 
              className="input-premium"
              style={{ fontSize: '1rem', padding: '6px 12px', width: 220, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}
            />
            
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              color: 'white',
              textAlign: 'center',
              textShadow: getFullTextShadow(),
              transition: 'all 0.15s',
              margin: '20px 0'
            }}>
              {demoText}
            </div>

            <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <pre style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-light)', borderRadius: 8, color: '#a7f3d0', fontSize: '0.85rem', overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {shadowCss}
              </pre>
              <button onClick={copyToClipboard} className="btn-premium btn-primary" style={{ marginTop: 12, padding: '10px 16px', fontWeight: 'bold' }}>
                📋 Copier le code CSS
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="glass-panel" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: 0 }}>Styles Prédéfinis (Presets)</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={applyPreset3D} className="btn-premium btn-secondary" style={{ flex: 1, padding: 8, fontSize: '0.8rem' }}>🧱 Effet 3D</button>
              <button onClick={applyPresetNeon} className="btn-premium btn-secondary" style={{ flex: 1, padding: 8, fontSize: '0.8rem' }}>💡 Néon Rose/Cyan</button>
              <button onClick={applyPresetLongShadow} className="btn-premium btn-secondary" style={{ flex: 1, padding: 8, fontSize: '0.8rem' }}>↗️ Long Shadow</button>
            </div>
          </div>
        </div>

        {/* Configurations Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Layer Manager */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: 0 }}>Couches d'ombrage ({shadows.length})</h3>
              <button onClick={addLayer} className="btn-premium btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>+ Ajouter</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
              {shadows.map((s, idx) => {
                const isActive = s.id === activeShadowId;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => setActiveShadowId(s.id)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '6px 10px', 
                      backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', 
                      border: `1.5px solid ${isActive ? '#3b82f6' : 'var(--border-light)'}`, 
                      borderRadius: 8, 
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: 'white' }}>
                      Couche #{idx + 1} ({s.hOffset}px, {s.vOffset}px)
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLayer(s.id); }} 
                      className="btn-premium btn-danger" 
                      style={{ padding: '2px 6px', fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Layer Editor Slider Inputs */}
          {activeShadow && (
            <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3b82f6', margin: 0 }}>Configuration Couche Active</h3>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Offset Horizontal ({activeShadow.hOffset}px)</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="40" 
                  value={activeShadow.hOffset} 
                  onChange={(e) => updateActiveShadow('hOffset', parseInt(e.target.value))} 
                  style={{ width: '100%', marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Offset Vertical ({activeShadow.vOffset}px)</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="40" 
                  value={activeShadow.vOffset} 
                  onChange={(e) => updateActiveShadow('vOffset', parseInt(e.target.value))} 
                  style={{ width: '100%', marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Flou ({activeShadow.blur}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={activeShadow.blur} 
                  onChange={(e) => updateActiveShadow('blur', parseInt(e.target.value))} 
                  style={{ width: '100%', marginTop: 4 }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Opacité ({Math.round(activeShadow.opacity * 100)}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={activeShadow.opacity * 100} 
                  onChange={(e) => updateActiveShadow('opacity', parseFloat(e.target.value) / 100)} 
                  style={{ width: '100%', marginTop: 4 }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Couleur de l'ombrage :</label>
                <input 
                  type="color" 
                  value={activeShadow.color} 
                  onChange={(e) => updateActiveShadow('color', e.target.value)} 
                  style={{ width: '100%', height: 36, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer', marginTop: 4 }} 
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}