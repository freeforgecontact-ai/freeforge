import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function CookingConverter({ goBack }) {
  // Unit converter states
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('cup');

  // Portion scaler states
  const [recipeText, setRecipeText] = useState(
    "200g de farine\n3 gros oeufs\n1.5 tasses de lait\n1/2 cuillère à café de sel\n100g de pépites de chocolat"
  );
  const [initialPortions, setInitialPortions] = useState(4);
  const [targetPortions, setTargetPortions] = useState(6);

  const convert = () => {
    if (unit === 'cup') {
      return { ml: (amount * 250).toFixed(0), tbsp: (amount * 16).toFixed(0) };
    }
    // ml
    return { cup: (amount / 250).toFixed(2), tbsp: (amount / 15).toFixed(1) };
  };

  const results = convert();

  // Helper to parse and scale numbers in recipe lines
  const factor = targetPortions / initialPortions || 1;

  const parseAndScale = (text, scaleFactor) => {
    return text.split('\n').map((line, idx) => {
      const regex = /(\d+(?:\.\d+)?|\d+\/\d+)/g;
      let match;
      const parts = [];
      let lastIndex = 0;

      while ((match = regex.exec(line)) !== null) {
        // Add normal text before match
        parts.push({ type: 'text', content: line.substring(lastIndex, match.index) });

        const originalStr = match[0];
        let originalValue = 0;

        if (originalStr.includes('/')) {
          const [num, den] = originalStr.split('/');
          originalValue = (parseFloat(num) || 0) / (parseFloat(den) || 1);
        } else {
          originalValue = parseFloat(originalStr) || 0;
        }

        const scaledValue = originalValue * scaleFactor;
        
        let formattedValue = '';
        if (Number.isInteger(scaledValue)) {
          formattedValue = scaledValue.toString();
        } else {
          formattedValue = parseFloat(scaledValue.toFixed(2)).toString();
        }

        parts.push({ type: 'number', original: originalStr, scaled: formattedValue });
        lastIndex = regex.lastIndex;
      }
      
      parts.push({ type: 'text', content: line.substring(lastIndex) });
      return { id: idx, parts };
    });
  };

  const scaledLines = parseAndScale(recipeText, factor);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🍳 Convertisseur & Scaler de Cuisine
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Convertissez les mesures et redimensionnez des listes d'ingrédients complètes de façon interactive.
          </p>
        </div>
        <FolderButton toolId="cooking_converter" toolName="CookingConverter" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Unit Converter Card */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>📏 Convertisseur d'Unités</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantité :</label>
              <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="input-premium" style={{ width: '100%', padding: 10 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unité :</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="input-premium" style={{ width: '100%', padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
                <option value="cup">Tasse (Cup)</option>
                <option value="ml">Millilitre (ml)</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Équivalents réels :</span>
            {unit === 'cup' ? (
              <>
                <div style={{ fontSize: '1.1rem' }}>💧 <strong>{results.ml} ml</strong></div>
                <div style={{ fontSize: '1.1rem' }}>🥄 <strong>{results.tbsp} cuillères à table</strong></div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.1rem' }}>🥣 <strong>{results.cup} Tasse(s)</strong></div>
                <div style={{ fontSize: '1.1rem' }}>🥄 <strong>{results.tbsp} cuillères à table</strong></div>
              </>
            )}
          </div>
        </div>

        {/* Recipe Portions Scaler Card */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>👥 Multiplicateur de Portions</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portions Initiales :</label>
              <input 
                type="number" 
                min="1" 
                value={initialPortions} 
                onChange={e => setInitialPortions(Math.max(1, parseInt(e.target.value) || 1))} 
                className="input-premium" 
                style={{ width: '100%', padding: 8, textAlign: 'center' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portions Souhaitées :</label>
              <input 
                type="number" 
                min="1" 
                value={targetPortions} 
                onChange={e => setTargetPortions(Math.max(1, parseInt(e.target.value) || 1))} 
                className="input-premium" 
                style={{ width: '100%', padding: 8, textAlign: 'center' }} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '4px 0' }}>
            <span>Facteur d'échelle :</span>
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>× {factor.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Saisir la liste d'ingrédients :</label>
            <textarea 
              value={recipeText} 
              onChange={e => setRecipeText(e.target.value)} 
              className="input-premium" 
              rows="6" 
              placeholder="Saisissez vos ingrédients..."
              style={{ width: '100%', padding: 12, resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
              Ingrédients Recalculés :
            </span>
            <div 
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                border: '1px solid var(--border-light)', 
                borderRadius: 8, 
                padding: 12, 
                minHeight: 120, 
                maxHeight: 200, 
                overflowY: 'auto', 
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}
            >
              {scaledLines.map(line => (
                <div key={line.id} style={{ minHeight: 18 }}>
                  {line.parts.map((part, pIdx) => (
                    part.type === 'text' ? (
                      <span key={pIdx} style={{ color: 'var(--text-secondary)' }}>{part.content}</span>
                    ) : (
                      <strong key={pIdx} style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0 2px', borderRadius: 3 }}>
                        {part.scaled}
                      </strong>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}