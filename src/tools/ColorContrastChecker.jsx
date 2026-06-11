import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function ColorContrastChecker({ goBack }) {
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#3b82f6');
  const [ratio, setRatio] = useState(0);
  const [blindnessMode, setBlindnessMode] = useState('normal'); // 'normal', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'

  // Relative luminance helper
  const getLuminance = (hex) => {
    let color = hex.substring(1);
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const r = parseInt(color.substring(0, 2), 16) / 255;
    const g = parseInt(color.substring(2, 4), 16) / 255;
    const b = parseInt(color.substring(4, 6), 16) / 255;

    const transform = (v) => {
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
  };

  const calculateContrast = () => {
    const l1 = getLuminance(fgColor);
    const l2 = getLuminance(bgColor);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
  };

  useEffect(() => {
    try {
      const cr = calculateContrast();
      setRatio(parseFloat(cr));
    } catch (e) {
      setRatio(1);
    }
  }, [fgColor, bgColor]);

  // WCAG status
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  const getSvgFilter = () => {
    // Return SVG color matrices for color blindness simulation
    if (blindnessMode === 'protanopia') {
      return "matrix(0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0)";
    }
    if (blindnessMode === 'deuteranopia') {
      return "matrix(0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0)";
    }
    if (blindnessMode === 'tritanopia') {
      return "matrix(0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0)";
    }
    if (blindnessMode === 'achromatopsia') {
      return "matrix(0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0)";
    }
    return '';
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      {/* SVG filter definition for colorblindness */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="colorblind-simulator">
            {blindnessMode !== 'normal' && (
              <feColorMatrix type="matrix" values={getSvgFilter()} />
            )}
          </filter>
        </defs>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🎨 Contraste de Couleur & Accessibilité WCAG
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Vérifiez la lisibilité de vos interfaces selon les normes WCAG 2.1 et simulez les déficiences visuelles 100% localement.
          </p>
        </div>
        <FolderButton toolId="color_contrast" toolName="ColorContrastChecker" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Colors Picker Column */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Couleurs de test</h2>

          {/* Foreground */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur du texte (Premier plan) :</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                type="color" 
                value={fgColor} 
                onChange={(e) => setFgColor(e.target.value)}
                style={{ width: 44, height: 38, border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
              />
              <input 
                type="text" 
                value={fgColor} 
                onChange={(e) => setFgColor(e.target.value)}
                className="input-premium"
                style={{ flex: 1, padding: 8, borderRadius: 6, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Background */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur d'arrière-plan :</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: 44, height: 38, border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
              />
              <input 
                type="text" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="input-premium"
                style={{ flex: 1, padding: 8, borderRadius: 6, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Deficiencies simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Simuler le Daltonisme :</label>
            <select value={blindnessMode} onChange={(e) => setBlindnessMode(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="normal">Normal (Aucun filtre)</option>
              <option value="deuteranopia">Deutéranopie (Vert-Rouge)</option>
              <option value="protanopia">Protanopie (Rouge)</option>
              <option value="tritanopia">Tritanopie (Bleu-Jaune)</option>
              <option value="achromatopsia">Achromatopsie (Monochrome)</option>
            </select>
          </div>
        </div>

        {/* Right column: Results and Previews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ratio Circle */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 70%)',
              border: `4px solid ${ratio >= 4.5 ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{ratio}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ratio</span>
            </div>

            {/* WCAG Compliance cards */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border-light)', backgroundColor: aaNormal ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal (AA - 4.5:1)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: aaNormal ? '#10b981' : '#ef4444', marginTop: 4 }}>
                  {aaNormal ? '✓ CONFORME' : '✗ ÉCHEC'}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border-light)', backgroundColor: aaaNormal ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal (AAA - 7:1)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: aaaNormal ? '#10b981' : '#ef4444', marginTop: 4 }}>
                  {aaaNormal ? '✓ CONFORME' : '✗ ÉCHEC'}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border-light)', backgroundColor: aaLarge ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Large (AA - 3:1)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: aaLarge ? '#10b981' : '#ef4444', marginTop: 4 }}>
                  {aaLarge ? '✓ CONFORME' : '✗ ÉCHEC'}
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border-light)', backgroundColor: aaaLarge ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Large (AAA - 4.5:1)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: aaaLarge ? '#10b981' : '#ef4444', marginTop: 4 }}>
                  {aaaLarge ? '✓ CONFORME' : '✗ ÉCHEC'}
                </div>
              </div>
            </div>
          </div>

          {/* Preview panel (affected by the SVG filter) */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Rendu visuel (Simulé)</h2>
            <div 
              style={{
                backgroundColor: bgColor,
                color: fgColor,
                padding: 24,
                borderRadius: 10,
                filter: blindnessMode !== 'normal' ? 'url(#colorblind-simulator)' : 'none',
                transition: 'all 0.1s'
              }}
            >
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px 0', color: 'inherit' }}>Texte Large (Exemple de titre)</h3>
              <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.5, color: 'inherit' }}>
                Ceci est un paragraphe de texte normal (taille standard). Il permet de valider le contraste réel et la lisibilité globale de la palette de couleurs sélectionnée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
