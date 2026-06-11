import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function TypographyPairer({ goBack }) {
  const [titleFont, setTitleFont] = useState('Playfair Display');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [size, setSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.4);

  const fontPairs = [
    { title: 'Playfair Display', body: 'Inter', desc: 'Élégant & Moderne' },
    { title: 'Montserrat', body: 'Lora', desc: 'Équilibré & Littéraire' },
    { title: 'Oswald', body: 'Roboto', desc: 'Impactant & Technique' },
    { title: 'Outfit', body: 'Source Sans 3', desc: 'Sleek & Tech contemporain' },
    { title: 'Cinzel', body: 'Fauna One', desc: 'Classique & Artistique' }
  ];

  // Dynamic Google Font Loader
  useEffect(() => {
    const linkId = 'google-fonts-pairer';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    // Format family names for Google Fonts API
    const cleanTitle = titleFont.replace(/\s+/g, '+');
    const cleanBody = bodyFont.replace(/\s+/g, '+');
    
    link.href = `https://fonts.googleapis.com/css2?family=${cleanTitle}:wght@700;800&family=${cleanBody}:wght@400;500&display=swap`;
  }, [titleFont, bodyFont]);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🔤 Typography Pairer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Explorez des combinaisons de polices Google Fonts réelles et prévisualisez la lisibilité de vos mises en page (Connexion requise).
          </p>
        </div>
        <FolderButton toolId="typo_pairer" toolName="TypographyPairer" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Preview Sandbox */}
        <div className="glass-panel" style={{ padding: 32, borderRadius: 16 }}>
          <h2 style={{ 
            fontFamily: `"${titleFont}", sans-serif`, 
            fontSize: size + 'px', 
            fontWeight: 800, 
            color: 'white', 
            lineHeight: lineHeight 
          }}>
            Voici un titre de démonstration en {titleFont}
          </h2>
          
          <p style={{ 
            fontFamily: `"${bodyFont}", sans-serif`, 
            fontSize: '1rem', 
            color: 'var(--text-secondary)', 
            marginTop: 16, 
            lineHeight: 1.6 
          }}>
            Ceci est un paragraphe de prévisualisation en <strong>{bodyFont}</strong>. Ajustez les tailles, hauteurs de lignes et changez de paires de polices pour évaluer la lisibilité générale du design en direct.
          </p>

          <p style={{ 
            fontFamily: `"${bodyFont}", sans-serif`, 
            fontSize: '0.95rem', 
            color: 'var(--text-muted)', 
            marginTop: 12, 
            lineHeight: 1.6,
            fontStyle: 'italic'
          }}>
            "La typographie est l'art et la technique d'organiser les caractères afin de rendre la langue écrite lisible, claire et visuellement attrayante."
          </p>
        </div>

        {/* Adjustments */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Paires Recommandées</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fontPairs.map((pair, idx) => (
              <button 
                key={idx} 
                onClick={() => { setTitleFont(pair.title); setBodyFont(pair.body); }}
                className={`btn-premium ${titleFont === pair.title && bodyFont === pair.body ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textAlign: 'left', padding: 12, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 8 }}
              >
                <span style={{ fontWeight: 'bold' }}>{pair.title} + {pair.body}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{pair.desc}</span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Taille du titre :</span>
              <span style={{ fontWeight: 'bold' }}>{size}px</span>
            </label>
            <input type="range" min="20" max="64" value={size} onChange={(e) => setSize(parseInt(e.target.value, 10))} style={{ width: '100%', marginTop: 8 }} />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Hauteur de ligne :</span>
              <span style={{ fontWeight: 'bold' }}>{lineHeight}</span>
            </label>
            <input type="range" min="1.0" max="2.0" step="0.05" value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}