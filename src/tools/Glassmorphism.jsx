import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function Glassmorphism({ goBack }) {
  const [blur, setBlur] = useState(16);
  const [opacity, setOpacity] = useState(0.25);
  const [color, setColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderOpacity, setBorderOpacity] = useState(0.12);
  const [borderRadius, setBorderRadius] = useState(16);
  const [shadow, setShadow] = useState(25); // Opacity of drop shadow
  const [neonColor, setNeonColor] = useState('#8b5cf6');
  const [neonGlow, setNeonGlow] = useState(0); // neon outline glow intensity

  // Convert hex color to rgba
  const hexToRgba = (hex, alpha) => {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
      const h = hex.replace('#', '');
      if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
      } else if (h.length === 6) {
        r = parseInt(h.substring(0, 2), 16);
        g = parseInt(h.substring(2, 4), 16);
        b = parseInt(h.substring(4, 6), 16);
      }
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getCssStyles = () => {
    const bgColor = hexToRgba(color, opacity);
    const bColor = hexToRgba(borderColor, borderOpacity);
    const nGlow = neonGlow > 0 ? `, 0 0 ${neonGlow}px ${hexToRgba(neonColor, 0.4)}` : '';
    
    return {
      background: bgColor,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: `${borderRadius}px`,
      border: `1px solid ${bColor}`,
      boxShadow: `0 8px 32px 0 rgba(0, 0, 0, ${shadow / 100})${nGlow}`,
      width: '100%',
      height: '220px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      textAlign: 'center',
      color: '#ffffff',
      transition: 'all 0.1s ease',
      position: 'relative',
      zIndex: 2
    };
  };

  const cssCodeString = () => {
    const nGlow = neonGlow > 0 ? `,\n  0 0 ${neonGlow}px ${hexToRgba(neonColor, 0.4)}` : '';
    return `background: ${hexToRgba(color, opacity)};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: ${borderRadius}px;
border: 1px solid ${hexToRgba(borderColor, borderOpacity)};
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, ${shadow / 100})${nGlow};`;
  };

  const tailwindCodeString = () => {
    const colHex = color.replace('#', '');
    const bHex = borderColor.replace('#', '');
    return `bg-[rgba(${hexToRgba(color, opacity).replace('rgba(', '').replace(')', '')})] \\
backdrop-blur-[${blur}px] \\
rounded-[${borderRadius}px] \\
border \\
border-[rgba(${hexToRgba(borderColor, borderOpacity).replace('rgba(', '').replace(')', '')})] \\
shadow-[0_8px_32px_0_rgba(0,0,0,${shadow/100})]`;
  };

  const copyToClipboard = (text, btnId) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(btnId);
    if (btn) {
      const origText = btn.innerText;
      btn.innerText = 'Copié !';
      btn.style.borderColor = '#10b981';
      setTimeout(() => {
        btn.innerText = origText;
        btn.style.borderColor = '';
      }, 1500);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Design</span>
        <FolderButton toolId="glassmorphism" toolName="Générateur Glassmorphism" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Générateur Glassmorphism</h1>
      <p className="page-subtitle font-sans">Créez des verres translucides stylisés avec ombres et lueurs de contour en direct.</p>

      <div className="grid-2">
        {/* Left column: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-premium" style={{ cursor: 'default', gap: 14 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Personnalisation</h2>

            {/* Blur */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Flou d'arrière-plan ({blur}px)</span>
              </div>
              <input 
                type="range" min="0" max="40" value={blur} 
                onChange={e => setBlur(parseInt(e.target.value))}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Opacity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Opacité du fond ({Math.round(opacity * 100)}%)</span>
              </div>
              <input 
                type="range" min="0" max="100" value={opacity * 100} 
                onChange={e => setOpacity(parseFloat(e.target.value) / 100)}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Border Opacity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Opacité de la bordure ({Math.round(borderOpacity * 100)}%)</span>
              </div>
              <input 
                type="range" min="0" max="100" value={borderOpacity * 100} 
                onChange={e => setBorderOpacity(parseFloat(e.target.value) / 100)}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Radius */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Bords arrondis ({borderRadius}px)</span>
              </div>
              <input 
                type="range" min="0" max="50" value={borderRadius} 
                onChange={e => setBorderRadius(parseInt(e.target.value))}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Shadow opacity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Intensité de l'ombre portée ({shadow}%)</span>
              </div>
              <input 
                type="range" min="0" max="80" value={shadow} 
                onChange={e => setShadow(parseInt(e.target.value))}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Neon outline glow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Intensité du néon ({neonGlow}px)</span>
              </div>
              <input 
                type="range" min="0" max="60" value={neonGlow} 
                onChange={e => setNeonGlow(parseInt(e.target.value))}
                className="slider" style={{ height: 4 }}
              />
            </div>

            {/* Color pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Couleur fond</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Couleur bordure</label>
                <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: 'transparent' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Couleur néon</label>
                <input type="color" value={neonColor} onChange={e => setNeonColor(e.target.value)} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: 'transparent' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Right column: live preview and exports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Live Preview panel */}
          <div 
            style={{ 
              height: 280, 
              width: '100%', 
              borderRadius: 16, 
              background: 'radial-gradient(circle at 30% 20%, #e066ff 0%, #1e1145 50%, #060214 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 30,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Visual background noise behind the glass overlay to clearly verify backdrop blur */}
            <div style={{ position: 'absolute', top: '10%', left: '15%', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #ff007f 0%, #7f00ff 100%)', filter: 'blur(5px)', zIndex: 1 }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #00f0ff 0%, #0072ff 100%)', filter: 'blur(5px)', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 40, background: 'yellow', transform: 'rotate(-15deg)', filter: 'blur(2px)', zIndex: 1 }} />
            
            <div style={getCssStyles()}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>FreeForge Glass</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Aperçu dynamique du rendu acrylique flouté en direct.</p>
            </div>
          </div>

          {/* Code Export panels */}
          <div className="card-premium" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>CSS Standard</span>
              <button 
                id="copy-css-btn" className="btn-premium btn-primary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(cssCodeString(), 'copy-css-btn')}
              >
                Copier
              </button>
            </div>
            <pre style={{ margin: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
              {cssCodeString()}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tailwind CSS classes</span>
              <button 
                id="copy-tw-btn" className="btn-premium btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(tailwindCodeString(), 'copy-tw-btn')}
              >
                Copier
              </button>
            </div>
            <pre style={{ margin: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap' }}>
              {tailwindCodeString()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
