import React, { useState, useRef, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function PhotosVoyage({ goBack }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [format, setFormat] = useState('square'); // square, story, original
  const [exportFormat, setExportFormat] = useState('image/jpeg'); // image/jpeg, image/webp
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setPreviewSrc(null);
    }
  };

  const processImage = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      let targetWidth = imgWidth;
      let targetHeight = imgHeight;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = imgWidth;
      let sourceHeight = imgHeight;

      if (format === 'square') {
        // 1:1 Aspect Ratio
        const size = Math.min(imgWidth, imgHeight);
        sourceWidth = size;
        sourceHeight = size;
        sourceX = (imgWidth - size) / 2;
        sourceY = (imgHeight - size) / 2;
        targetWidth = 1080;
        targetHeight = 1080;
      } else if (format === 'story') {
        // 9:16 Aspect Ratio
        const targetRatio = 9 / 16;
        if (imgWidth / imgHeight > targetRatio) {
          sourceWidth = imgHeight * targetRatio;
          sourceHeight = imgHeight;
          sourceX = (imgWidth - sourceWidth) / 2;
          sourceY = 0;
        } else {
          sourceWidth = imgWidth;
          sourceHeight = imgWidth / targetRatio;
          sourceX = 0;
          sourceY = (imgHeight - sourceHeight) / 2;
        }
        targetWidth = 1080;
        targetHeight = 1920;
      } else {
        // Original aspect ratio
        targetWidth = imgWidth;
        targetHeight = imgHeight;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw and crop
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );

      // Generate preview URL
      const dataUrl = canvas.toDataURL(exportFormat, quality / 100);
      setPreviewSrc(dataUrl);
      setIsProcessing(false);
    };
  };

  useEffect(() => {
    if (imageSrc) {
      processImage();
    }
  }, [imageSrc, format, exportFormat, quality]);

  const handleDownload = () => {
    if (!previewSrc) return;
    const ext = exportFormat === 'image/webp' ? 'webp' : 'jpg';
    const link = document.createElement('a');
    link.href = previewSrc;
    link.download = `travel_compressed_${Date.now()}.${ext}`;
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
            📸 Photo Compress for Social Media
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Redimensionnez, cadrez et compressez vos photos localement et instantanément sur canvas.
          </p>
        </div>
        <FolderButton toolId="photo_compress" toolName="PhotosVoyage" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Preview Sandbox */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, position: 'relative' }}>
          {previewSrc ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              <div style={{ 
                border: '1px solid var(--border-light)', 
                borderRadius: 12, 
                overflow: 'hidden',
                maxWidth: '100%',
                maxHeight: 300,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src={previewSrc} style={{ maxWidth: '100%', maxHeight: 300, display: 'block', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Aperçu du traitement actif
              </span>
            </div>
          ) : imageSrc && isProcessing ? (
            <div style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Traitement en cours...</div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Importez une photo à droite pour démarrer le traitement.
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Options de compression</h3>

          <div>
            <label style={{ display: 'block', padding: 12, border: '1px dashed var(--border-light)', borderRadius: 8, cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', hover: { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
              🖼️ Charger une photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Format de cadrage (Crop)</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="input-premium" style={{ width: '100%' }}>
              <option value="original">Format Original (Pas de recadrage)</option>
              <option value="square">Carré Instagram (1:1)</option>
              <option value="story">Story / Reel / TikTok (9:16)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Format d'exportation</label>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="input-premium" style={{ width: '100%' }}>
              <option value="image/jpeg">JPEG (.jpg)</option>
              <option value="image/webp">WEBP (.webp)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Qualité de compression</span>
              <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{quality}%</span>
            </div>
            <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} style={{ width: '100%', marginTop: 8 }} />
          </div>

          <button 
            onClick={handleDownload} 
            disabled={!previewSrc} 
            className="btn-premium btn-primary" 
            style={{ padding: 12, fontWeight: 'bold', width: '100%', justifyContent: 'center' }}
          >
            💾 Télécharger l'image
          </button>
        </div>
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}