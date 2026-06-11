import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function CartesVoeux({ goBack }) {
  const [text, setText] = useState('Bonne Fête !');
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#6366f1');
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw decorative card elements
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // Draw message text
    ctx.fillStyle = color;
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }, [text, color, bgColor]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'carte_voeux.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎨 Concepteur de Cartes de Vœux</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Concevez et téléchargez des cartes d'invitation personnalisées.</p>
        </div>
        <FolderButton toolId="greeting_card" toolName="CartesVoeux" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <canvas ref={canvasRef} width="400" height="300" style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
          <button onClick={handleDownload} className="btn-premium btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 'bold' }}>💾 Télécharger en PNG</button>
        </div>

        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Options de création</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Message de vœux :</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur du texte :</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur de la carte :</label>
            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
          </div>
        </div>
      </div>
    </div>
  );
}