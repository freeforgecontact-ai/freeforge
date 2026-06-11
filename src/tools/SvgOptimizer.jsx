import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function SvgOptimizer({ goBack }) {
  const [svgCode, setSvgCode] = useState('');
  const [optimizedSvg, setOptimizedSvg] = useState('');
  const [colorOverride, setColorOverride] = useState('#8b5cf6');
  const [strokeOverride, setStrokeOverride] = useState('');
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Clean and optimize SVG XML code using regexes
  const optimizeSvg = (rawSvg) => {
    if (!rawSvg) return '';

    let clean = rawSvg;

    // 1. Remove XML declarations and doctype
    clean = clean.replace(/<\?xml[\s\S]*?\?>/gi, '');
    clean = clean.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    // 2. Remove comments
    clean = clean.replace(/<!--[\s\S]*?-->/g, '');

    // 3. Remove editor metadata (Inkscape, Illustrator, Sodipodi)
    clean = clean.replace(/<metadata>[\s\S]*?<\/metadata>/gi, '');
    clean = clean.replace(/sodipodi:docname="[\s\S]*?"/gi, '');
    clean = clean.replace(/inkscape:version="[\s\S]*?"/gi, '');
    clean = clean.replace(/xmlns:svg="[\s\S]*?"/gi, '');
    clean = clean.replace(/xmlns:sodipodi="[\s\S]*?"/gi, '');
    clean = clean.replace(/xmlns:inkscape="[\s\S]*?"/gi, '');
    
    // 4. Remove empty attributes and namespaces prefixes
    clean = clean.replace(/sodipodi:\w+="[\s\S]*?"/gi, '');
    clean = clean.replace(/inkscape:\w+="[\s\S]*?"/gi, '');

    // 5. Clean whitespaces & line breaks
    clean = clean.replace(/\r?\n|\r/g, ' ');
    clean = clean.replace(/\s+/g, ' ');

    return clean.trim();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setSvgCode(content);
      setOptimizedSvg(optimizeSvg(content));
    };
    reader.readAsText(file);
  };

  const applyColorOverrides = (code) => {
    if (!code) return '';
    let updated = code;
    
    // Apply fill color override if defined
    if (colorOverride) {
      // If SVG has fill="...", replace it. Otherwise, add fill to root SVG node
      if (updated.includes('fill=')) {
        updated = updated.replace(/fill="[^"]*"/gi, `fill="${colorOverride}"`);
      } else {
        updated = updated.replace(/<svg/i, `<svg fill="${colorOverride}"`);
      }
    }

    // Apply stroke override if defined
    if (strokeOverride) {
      if (updated.includes('stroke=')) {
        updated = updated.replace(/stroke="[^"]*"/gi, `stroke="${strokeOverride}"`);
      } else {
        updated = updated.replace(/<svg/i, `<svg stroke="${strokeOverride}"`);
      }
    }

    return updated;
  };

  const getPreviewSvg = () => {
    let raw = optimizedSvg || svgCode;
    if (!raw) return '';
    
    let processed = applyColorOverrides(raw);
    
    // Apply scale & rotation styles to SVG tag
    const transformStyle = `style="transform: scale(${scale / 100}) rotate(${rotation}deg); transform-origin: center; transition: transform 0.2s ease;"`;
    processed = processed.replace(/<svg/i, `<svg ${transformStyle}`);
    
    return processed;
  };

  // Convert SVG code to a clean React component string
  const getReactComponentString = () => {
    let raw = applyColorOverrides(optimizedSvg || svgCode);
    if (!raw) return '';

    // Convert attributes to camelCase for React
    let jsx = raw
      .replace(/fill-rule=/g, 'fillRule=')
      .replace(/clip-rule=/g, 'clipRule=')
      .replace(/stroke-width=/g, 'strokeWidth=')
      .replace(/stroke-linecap=/g, 'strokeLinecap=')
      .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
      .replace(/class=/g, 'className=');

    // Extract inside elements of <svg>...</svg>
    const svgContentMatch = jsx.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const svgContent = svgContentMatch ? svgContentMatch[1] : '';

    // Extract viewBox
    const viewBoxMatch = jsx.match(/viewBox="([^"]*)"/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

    return `import React from 'react';

export default function MyIcon(props) {
  return (
    <svg 
      viewBox="${viewBox}" 
      fill="${colorOverride || 'currentColor'}" 
      width="1em" 
      height="1em" 
      {...props}
    >
      ${svgContent.trim()}
    </svg>
  );
}`;
  };

  const copyText = (text, btnId) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.innerText = 'Copié !';
      btn.style.borderColor = '#10b981';
      setTimeout(() => {
        btn.innerText = btnId === 'copy-svg-btn' ? 'Copier le SVG' : 'Copier React Component';
        btn.style.borderColor = '';
      }, 1500);
    }
  };

  const downloadSvg = () => {
    const raw = applyColorOverrides(optimizedSvg);
    if (!raw) return;
    const blob = new Blob([raw], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'freeforge_icon.svg';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        setSvgCode(content);
        setOptimizedSvg(optimizeSvg(content));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Vectoriel</span>
        <FolderButton toolId="svg" toolName="Optimiseur SVG" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Optimiseur & Coloriseur SVG</h1>
      <p className="page-subtitle">Nettoyez le code XML inutile de vos fichiers SVG, ajustez leurs couleurs et générez des composants React.</p>

      <div className="grid-2">
        {/* Left side: Upload and settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('svg-upload-input').click()}
            style={{ padding: 32 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="dropzone-icon" style={{ width: 44, height: 44 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>Glissez un fichier SVG ici</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ou cliquez pour explorer</p>
            </div>
            <input 
              id="svg-upload-input"
              type="file" 
              accept=".svg" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="card-premium" style={{ cursor: 'default', gap: 16 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Personnalisation & Teinte</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Couleur Remplissage (fill)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={colorOverride} onChange={e => setColorOverride(e.target.value)} style={{ width: 36, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} />
                  <input type="text" value={colorOverride} onChange={e => setColorOverride(e.target.value)} className="input-premium" style={{ padding: '4px 8px', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Couleur Contour (stroke)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="color" value={strokeOverride || '#000000'} onChange={e => setStrokeOverride(e.target.value)} style={{ width: 36, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} />
                  <input type="text" value={strokeOverride} placeholder="Transparent" onChange={e => setStrokeOverride(e.target.value)} className="input-premium" style={{ padding: '4px 8px', fontSize: '0.8rem' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Échelle ({scale}%)</label>
                <input type="range" min="10" max="200" value={scale} onChange={e => setScale(parseInt(e.target.value))} className="slider" style={{ height: 4 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rotation ({rotation}°)</label>
                <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="slider" style={{ height: 4 }} />
              </div>
            </div>

            {optimizedSvg && (
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button className="btn-premium btn-primary" onClick={downloadSvg} style={{ flexGrow: 1, justifyContent: 'center' }}>
                  Télécharger SVG Optimisé
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side: SVG preview & source exports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Live Preview Box */}
          <div 
            style={{ 
              height: 240, 
              width: '100%', 
              backgroundColor: 'rgba(0,0,0,0.4)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Checkerboard grid background for transparent SVGs */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' }} />
            
            {svgCode ? (
              <div 
                dangerouslySetInnerHTML={{ __html: getPreviewSvg() }} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', zIndex: 1 }}
              />
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 1 }}>Aucun SVG à prévisualiser</span>
            )}
          </div>

          {/* Export Code Cards */}
          {(optimizedSvg || svgCode) && (
            <div className="card-premium" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>SVG Nettoyé & Optimisé</span>
                <button 
                  id="copy-svg-btn" className="btn-premium btn-primary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => copyText(applyColorOverrides(optimizedSvg), 'copy-svg-btn')}
                >
                  Copier le SVG
                </button>
              </div>
              <pre style={{ margin: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid var(--border-light)', whiteSpace: 'nowrap', maxHeight: 80 }}>
                {applyColorOverrides(optimizedSvg)}
              </pre>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Composant React (JSX)</span>
                <button 
                  id="copy-react-btn" className="btn-premium btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => copyText(getReactComponentString(), 'copy-react-btn')}
                >
                  Copier React Component
                </button>
              </div>
              <pre style={{ margin: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid var(--border-light)', whiteSpace: 'pre-wrap', maxHeight: 110 }}>
                {getReactComponentString()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
