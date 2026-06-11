import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function CrosshairGenerator({ goBack }) {
  const [color, setColor] = useState('#00ff00');
  const [thickness, setThickness] = useState(2);
  const [size, setSize] = useState(10);
  const [gap, setGap] = useState(4);
  const [dot, setDot] = useState(false);
  const [outline, setOutline] = useState(true);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Draw outline
    if (outline) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = parseInt(thickness) + 2;
      
      // Horizontal left
      ctx.beginPath();
      ctx.moveTo(cx - gap - size, cy);
      ctx.lineTo(cx - gap, cy);
      ctx.stroke();

      // Horizontal right
      ctx.beginPath();
      ctx.moveTo(cx + gap, cy);
      ctx.lineTo(cx + gap + size, cy);
      ctx.stroke();

      // Vertical top
      ctx.beginPath();
      ctx.moveTo(cx, cy - gap - size);
      ctx.lineTo(cx, cy - gap);
      ctx.stroke();

      // Vertical bottom
      ctx.beginPath();
      ctx.moveTo(cx, cy + gap);
      ctx.lineTo(cx, cy + gap + size);
      ctx.stroke();

      if (dot) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, thickness + 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw crosshair lines
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    
    ctx.beginPath();
    ctx.moveTo(cx - gap - size, cy);
    ctx.lineTo(cx - gap, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + gap, cy);
    ctx.lineTo(cx + gap + size, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - gap - size);
    ctx.lineTo(cx, cy - gap);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + gap);
    ctx.lineTo(cx, cy + gap + size);
    ctx.stroke();

    if (dot) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, thickness, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [color, thickness, size, gap, dot, outline]);

  const getValoCode = () => `0;P;c;8;u;${color.replace('#','')};h;0;0l;${size};0v;${size};0o;${gap};0a;1.0;0e;1.5`;
  const getCSCode = () => `cl_crosshairsize ${size}; cl_crosshairthickness ${thickness}; cl_crosshairgap ${gap}; cl_crosshaircolor_r ${parseInt(color.substring(1,3),16)}; cl_crosshaircolor_g ${parseInt(color.substring(3,5),16)}; cl_crosshaircolor_b ${parseInt(color.substring(5,7),16)}`;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'crosshair.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎯 Crosshair Generator & Exporter</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Configurez visuellement vos viseurs de jeu de tir.</p>
        </div>
        <FolderButton toolId="crosshair" toolName="CrosshairGenerator" localStorageKeys={['fg_crosshair']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <canvas ref={canvasRef} width="300" height="300" style={{ backgroundColor: '#111', border: '2px solid var(--border-light)', borderRadius: 12 }} />
          <button onClick={handleDownload} className="btn-premium btn-secondary">💾 Télécharger en PNG</button>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Code Valorant :</label>
              <input readOnly value={getValoCode()} onClick={e => { e.target.select(); navigator.clipboard.writeText(getValoCode()); alert('Code Valorant copié !'); }} className="input-premium" style={{ width: '100%', fontFamily: 'monospace', padding: 8, fontSize: '0.8rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Code CS2 / CS:GO :</label>
              <input readOnly value={getCSCode()} onClick={e => { e.target.select(); navigator.clipboard.writeText(getCSCode()); alert('Code CS2 copié !'); }} className="input-premium" style={{ width: '100%', fontFamily: 'monospace', padding: 8, fontSize: '0.8rem' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Options</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur :</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taille ({size}px) :</label>
            <input type="range" min="1" max="30" value={size} onChange={e => setSize(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Épaisseur ({thickness}px) :</label>
            <input type="range" min="1" max="10" value={thickness} onChange={e => setThickness(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Écartement ({gap}px) :</label>
            <input type="range" min="0" max="20" value={gap} onChange={e => setGap(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={dot} onChange={e => setDot(e.target.checked)} /> Point Central
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={outline} onChange={e => setOutline(e.target.checked)} /> Contour Noir
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}