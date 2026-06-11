import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function DetoureurImages({ goBack }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [tolerance, setTolerance] = useState(30);
  const [keyColor, setKeyColor] = useState('#00ff00'); // green
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b };
  };

  const processChromaKey = () => {
    if (!imageSrc || !originalImageRef.current) return;
    setIsProcessing(true);

    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w;
    canvas.height = h;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const { r: targetR, g: targetG, b: targetB } = hexToRgb(keyColor);
    
    // Max distance in RGB space is sqrt(255^2 * 3) ~ 441.67
    // Map tolerance 1-100 to color threshold
    const threshold = tolerance * 4.4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Euclidean distance
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );

      if (distance <= threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (imageSrc) {
      // Re-trigger calculation when parameters change
      processChromaKey();
    }
  }, [imageSrc, tolerance, keyColor]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `removed_bg_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🟢 Chroma-Key Background Remover
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Supprimez instantanément l'arrière-plan de vos images à fond uni localement dans votre navigateur.
          </p>
        </div>
        <FolderButton toolId="background_remover" toolName="DetoureurImages" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Canvas Area with checkered transparent background */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: 24, 
            borderRadius: 16, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: 320,
            overflow: 'hidden'
          }}
        >
          {imageSrc ? (
            <div style={{ 
              position: 'relative', 
              maxWidth: '100%', 
              border: '2px dashed var(--border-light)', 
              borderRadius: 12, 
              overflow: 'hidden',
              // Checkered background pattern
              backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              backgroundColor: '#111'
            }}>
              {/* Keep a hidden image to read original sizes */}
              <img 
                ref={originalImageRef} 
                src={imageSrc} 
                onLoad={processChromaKey} 
                style={{ display: 'none' }} 
              />
              
              <canvas 
                ref={canvasRef} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 400,
                  display: 'block' 
                }} 
              />
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Importez une image à droite pour démarrer le détourage.
            </div>
          )}
        </div>

        {/* Parameters */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Options de détourage</h3>

          <div>
            <label style={{ display: 'block', padding: 12, border: '1px dashed var(--border-light)', borderRadius: 8, cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', hover: { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
              🖼️ Charger une image
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Couleur à supprimer (Chroma Key) :
            </label>
            <input 
              type="color" 
              value={keyColor} 
              onChange={(e) => setKeyColor(e.target.value)} 
              style={{ width: '100%', height: 44, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Tolérance de détourage</span>
              <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{tolerance}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={tolerance} 
              onChange={(e) => setTolerance(parseInt(e.target.value, 10))} 
              style={{ width: '100%', marginTop: 8 }} 
            />
          </div>

          <button 
            onClick={handleDownload} 
            disabled={!imageSrc || isProcessing} 
            className="btn-premium btn-primary" 
            style={{ padding: 12, fontWeight: 'bold', width: '100%', justifyContent: 'center' }}
          >
            💾 Télécharger en PNG transparent
          </button>
        </div>

      </div>
    </div>
  );
}