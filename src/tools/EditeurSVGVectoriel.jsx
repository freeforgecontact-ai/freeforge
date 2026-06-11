import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function EditeurSVGVectoriel({ goBack }) {
  const [shapes, setShapes] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_svg_editor');
      return saved ? JSON.parse(saved) : [
        { id: '1', type: 'rect', x: 50, y: 50, w: 100, h: 100, fill: '#3b82f6' },
        { id: '2', type: 'circle', cx: 250, cy: 100, r: 50, fill: '#10b981' }
      ];
    } catch (e) {
      console.error("Error reading ff_svg_editor", e);
      return [
        { id: '1', type: 'rect', x: 50, y: 50, w: 100, h: 100, fill: '#3b82f6' }
      ];
    }
  });

  const [selectedShape, setSelectedShape] = useState(null);
  const [fill, setFill] = useState('#3b82f6');
  const [type, setType] = useState('rect');

  // Dragging states
  const [draggedShapeId, setDraggedShapeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedHandle, setDraggedHandle] = useState(null); // { shapeId, type: 'resize' }

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ff_svg_editor', JSON.stringify(shapes));
  }, [shapes]);

  const addShape = () => {
    const newShape = type === 'rect' 
      ? { id: Date.now().toString(), type: 'rect', x: 150, y: 150, w: 80, h: 80, fill }
      : { id: Date.now().toString(), type: 'circle', cx: 200, cy: 200, r: 40, fill };

    setShapes([...shapes, newShape]);
    setSelectedShape(newShape.id);
  };

  const deleteShape = (id) => {
    setShapes(shapes.filter(s => s.id !== id));
    if (selectedShape === id) setSelectedShape(null);
  };

  // Pointer drag events on SVG canvas
  const handlePointerDown = (e, shapeId, handleType = 'move') => {
    e.stopPropagation();
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectedShape(shapeId);

    if (handleType === 'resize') {
      setDraggedHandle({ shapeId });
    } else {
      setDraggedShapeId(shapeId);
      if (shape.type === 'rect') {
        setDragOffset({ x: x - shape.x, y: y - shape.y });
      } else {
        setDragOffset({ x: x - shape.cx, y: y - shape.cy });
      }
    }
  };

  const handlePointerMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedShapeId) {
      setShapes(prev => prev.map(s => {
        if (s.id === draggedShapeId) {
          if (s.type === 'rect') {
            return {
              ...s,
              x: Math.max(0, Math.min(rect.width - s.w, x - dragOffset.x)),
              y: Math.max(0, Math.min(rect.height - s.h, y - dragOffset.y))
            };
          } else {
            return {
              ...s,
              cx: Math.max(s.r, Math.min(rect.width - s.r, x - dragOffset.x)),
              cy: Math.max(s.r, Math.min(rect.height - s.r, y - dragOffset.y))
            };
          }
        }
        return s;
      }));
    } else if (draggedHandle) {
      setShapes(prev => prev.map(s => {
        if (s.id === draggedHandle.shapeId) {
          if (s.type === 'rect') {
            // Drag bottom-right corner to resize width and height
            return {
              ...s,
              w: Math.max(15, x - s.x),
              h: Math.max(15, y - s.y)
            };
          } else {
            // Drag right radius anchor to resize circle radius
            const dx = Math.abs(x - s.cx);
            const dy = Math.abs(y - s.cy);
            const newRadius = Math.max(10, Math.sqrt(dx * dx + dy * dy));
            return {
              ...s,
              r: Math.round(newRadius)
            };
          }
        }
        return s;
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggedShapeId(null);
    setDraggedHandle(null);
  };

  // Code XML SVG Output
  const getSvgCode = () => {
    let code = '<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">\n';
    shapes.forEach(s => {
      if (s.type === 'rect') {
        code += `  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.fill}" />\n`;
      } else {
        code += `  <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}" />\n`;
      }
    });
    code += '</svg>';
    return code;
  };

  // Code React Component JSX Output
  const getReactComponentCode = () => {
    let shapesCode = '';
    shapes.forEach(s => {
      if (s.type === 'rect') {
        shapesCode += `      <rect x={${s.x}} y={${s.y}} width={${s.w}} height={${s.h}} fill="${s.fill}" />\n`;
      } else {
        shapesCode += `      <circle cx={${s.cx}} cy={${s.cy}} r={${s.r}} fill="${s.fill}" />\n`;
      }
    });

    return `import React from 'react';

export default function VectorGraphic(props) {
  return (
    <svg 
      width="400" 
      height="300" 
      viewBox="0 0 400 300" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
\n${shapesCode}    </svg>
  );
}`;
  };

  const handleCopyReact = () => {
    navigator.clipboard.writeText(getReactComponentCode());
    alert('Composant React (JSX) copié dans le presse-papiers !');
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(getSvgCode());
    alert('Code XML SVG copié dans le presse-papiers !');
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📐 Vector SVG Editor
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Concevez des graphiques vectoriels, déplacez et redimensionnez les formes, et exportez des composants React JSX.
          </p>
        </div>
        <FolderButton toolId="svg_editor" toolName="EditeurSVGVectoriel" localStorageKeys={['ff_svg_editor']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* SVG Editor Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 12, borderRadius: 16 }}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <svg 
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ 
                  width: '100%', 
                  height: 350, 
                  backgroundColor: 'rgba(0,0,0,0.2)', 
                  borderRadius: 12,
                  touchAction: 'none',
                  userSelect: 'none'
                }}
              >
                {shapes.map(s => {
                  const isSelected = selectedShape === s.id;
                  if (s.type === 'rect') {
                    return (
                      <g key={s.id}>
                        <rect 
                          x={s.x} 
                          y={s.y} 
                          width={s.w} 
                          height={s.h} 
                          fill={s.fill} 
                          onPointerDown={(e) => handlePointerDown(e, s.id)}
                          stroke={isSelected ? '#ffffff' : 'none'}
                          strokeWidth="2.5"
                          style={{ cursor: 'move' }}
                        />
                        {/* Interactive Resize Handle Point */}
                        {isSelected && (
                          <circle 
                            cx={s.x + s.w} 
                            cy={s.y + s.h} 
                            r="7" 
                            fill="#ffffff" 
                            stroke="#3b82f6" 
                            strokeWidth="2" 
                            onPointerDown={(e) => handlePointerDown(e, s.id, 'resize')}
                            style={{ cursor: 'se-resize' }} 
                          />
                        )}
                      </g>
                    );
                  } else {
                    return (
                      <g key={s.id}>
                        <circle 
                          cx={s.cx} 
                          cy={s.cy} 
                          r={s.r} 
                          fill={s.fill} 
                          onPointerDown={(e) => handlePointerDown(e, s.id)}
                          stroke={isSelected ? '#ffffff' : 'none'}
                          strokeWidth="2.5"
                          style={{ cursor: 'move' }}
                        />
                        {/* Interactive Resize Handle Point */}
                        {isSelected && (
                          <circle 
                            cx={s.cx + s.r} 
                            cy={s.cy} 
                            r="7" 
                            fill="#ffffff" 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            onPointerDown={(e) => handlePointerDown(e, s.id, 'resize')}
                            style={{ cursor: 'ew-resize' }} 
                          />
                        )}
                      </g>
                    );
                  }
                })}
              </svg>
            </div>
          </div>

          {/* Export Code Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* SVG XML Code */}
            <div className="glass-panel" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'white', margin: 0 }}>Code XML SVG</h3>
                <button onClick={handleCopySvg} className="btn-premium btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>Copier</button>
              </div>
              <pre style={{ margin: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: 8, color: '#a7f3d0', fontSize: '0.75rem', overflowX: 'auto', fontFamily: 'monospace', height: 140 }}>
                {getSvgCode()}
              </pre>
            </div>

            {/* React JSX Code */}
            <div className="glass-panel" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'white', margin: 0 }}>Composant React (JSX)</h3>
                <button onClick={handleCopyReact} className="btn-premium btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>Copier</button>
              </div>
              <pre style={{ margin: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: 8, color: '#60a5fa', fontSize: '0.75rem', overflowX: 'auto', fontFamily: 'monospace', height: 140 }}>
                {getReactComponentCode()}
              </pre>
            </div>
          </div>
        </div>

        {/* Shape control panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Outils de dessin</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type de forme</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value="rect">Rectangle</option>
              <option value="circle">Cercle</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur de remplissage</label>
            <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer', marginTop: 4 }} />
          </div>

          <button onClick={addShape} className="btn-premium btn-primary" style={{ padding: 10, fontWeight: 'bold' }}>
            ➕ Ajouter la forme
          </button>

          {selectedShape && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>Forme Sélectionnée</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ajuster la couleur :</label>
                <input 
                  type="color" 
                  value={shapes.find(s => s.id === selectedShape)?.fill || '#ffffff'} 
                  onChange={(e) => {
                    const colorVal = e.target.value;
                    setShapes(prev => prev.map(s => s.id === selectedShape ? { ...s, fill: colorVal } : s));
                  }} 
                  style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} 
                />
              </div>

              <button onClick={() => deleteShape(selectedShape)} className="btn-premium btn-danger" style={{ padding: 10, background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 'bold', justifyContent: 'center' }}>
                🗑️ Supprimer la forme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}