import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function PaletteCouleurs({ goBack }) {
  const [colors, setColors] = useState(() => {
    const saved = localStorage.getItem('ff_palette');
    return saved ? JSON.parse(saved) : [
      { hex: '#3b82f6', locked: false },
      { hex: '#10b981', locked: false },
      { hex: '#f59e0b', locked: false },
      { hex: '#ef4444', locked: false },
      { hex: '#8b5cf6', locked: false }
    ];
  });

  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    localStorage.setItem('ff_palette', JSON.stringify(colors));
  }, [colors]);

  const generateHex = () => {
    const chars = '0123456789abcdef';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += chars[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleGenerate = () => {
    setColors(colors.map(c => c.locked ? c : { hex: generateHex(), locked: false }));
  };

  const toggleLock = (idx) => {
    setColors(colors.map((c, i) => i === idx ? { ...c, locked: !c.locked } : c));
  };

  const copyToClipboard = (hex) => {
    navigator.clipboard.writeText(hex);
    alert('Couleur ' + hex + ' copiée dans le presse-papiers !');
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Downsample to 80x80 to speed up and average colors
      canvas.width = 80;
      canvas.height = 80;
      ctx.drawImage(img, 0, 0, 80, 80);

      const imgData = ctx.getImageData(0, 0, 80, 80).data;
      const counts = {};

      // Sample every 4 pixels (16 values in imgData array)
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 128) continue; // Ignore highly transparent pixels

        // Quantize colors (round to nearest 24) to group similar colors
        const qSize = 24;
        const rQ = Math.round(r / qSize) * qSize;
        const gQ = Math.round(g / qSize) * qSize;
        const bQ = Math.round(b / qSize) * qSize;

        const hex = rgbToHex(rQ, gQ, bQ);
        counts[hex] = (counts[hex] || 0) + 1;
      }

      // Sort colors by popularity
      const sortedColors = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

      // Filter colors that are too close to pure black or pure white if necessary, 
      // or just take the top 5 dominant colors
      const extracted = sortedColors.slice(0, 5);

      setColors(prev => {
        let extIdx = 0;
        return prev.map(c => {
          if (c.locked) return c;
          const nextColor = extracted[extIdx] || generateHex();
          extIdx++;
          return { hex: nextColor, locked: false };
        });
      });
    };
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🎨 Color Palette Extractor & Generator
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez des palettes ou extrayez-les directement de vos images de manière 100% locale.
          </p>
        </div>
        <FolderButton toolId="palette_extractor" toolName="PaletteCouleurs" localStorageKeys={["ff_palette"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr', gap: 24 }}>
        
        {/* Left pane: Palette Display */}
        <div className="glass-panel" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, minHeight: 200 }}>
            {colors.map((c, idx) => (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: c.hex, 
                  borderRadius: 12, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'flex-end', 
                  padding: 16, 
                  position: 'relative', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <button 
                  onClick={() => toggleLock(idx)} 
                  style={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    background: 'rgba(0,0,0,0.5)', 
                    border: 'none', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 28, 
                    height: 28, 
                    cursor: 'pointer', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={c.locked ? "Déverrouiller" : "Verrouiller cette couleur"}
                >
                  {c.locked ? '🔒' : '🔓'}
                </button>
                <div 
                  onClick={() => copyToClipboard(c.hex)} 
                  style={{ 
                    background: 'rgba(0,0,0,0.7)', 
                    padding: '6px 10px', 
                    borderRadius: 6, 
                    cursor: 'pointer', 
                    textAlign: 'center', 
                    fontWeight: 'bold', 
                    fontSize: '0.85rem', 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                  title="Copier le code HEX"
                >
                  {c.hex.toUpperCase()} 📋
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleGenerate} className="btn-premium btn-primary" style={{ padding: '12px 20px', fontWeight: 'bold' }}>
              ⚡ Générer les teintes (non verrouillées)
            </button>

            <label className="btn-premium btn-secondary" style={{ padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              🖼️ Extraire d'une image
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Right pane: Uploaded Image Preview */}
        {imageUrl && (
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Image Chargée</h3>
            <div style={{ 
              borderRadius: 12, 
              overflow: 'hidden', 
              border: '1px solid var(--border-light)', 
              maxWidth: '100%', 
              maxHeight: 240,
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={imageUrl} style={{ maxWidth: '100%', maxHeight: 240, display: 'block', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              Les couleurs dominantes ont été extraites.
            </span>
          </div>
        )}

      </div>
    </div>
  );
}