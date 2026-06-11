import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function VignettesVisualiseur({ goBack }) {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🖼️ Thumbnail Safe Area Visualizer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Validez que vos vignettes YouTube ou réseaux sociaux ne cachent pas d'informations critiques.
          </p>
        </div>
        <FolderButton toolId="thumbnail_visualizer" toolName="VignettesVisualiseur" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Canvas preview */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 480, height: 270, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-light)', overflow: 'hidden', borderRadius: 8 }}>
            {image && <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            
            {/* Safe Area overlays */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '4px 6px', backgroundColor: 'black', color: 'white', fontSize: '0.75rem', borderRadius: 4, fontWeight: 'bold' }}>
              12:34 (Overlay Temps)
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, backgroundColor: 'red' }} />
          </div>
        </div>

        {/* Control panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Options de prévisualisation</h3>

          <div>
            <label style={{ display: 'block', padding: 12, border: '1px dashed var(--border-light)', borderRadius: 8, cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              📥 Charger la vignette (16:9)
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}