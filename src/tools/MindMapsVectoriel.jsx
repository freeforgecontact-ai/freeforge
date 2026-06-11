import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function MindMapsVectoriel({ goBack }) {
  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_student_mindmap');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.nodes.length > 0) {
          return parsed.nodes;
        }
      }
      return [
        { id: '1', text: 'Sujet Principal', x: 250, y: 180, color: '#3b82f6' },
        { id: '2', text: 'Idée A', x: 100, y: 80, color: '#10b981' },
        { id: '3', text: 'Idée B', x: 400, y: 80, color: '#f59e0b' }
      ];
    } catch (e) {
      console.error("Error reading ff_student_mindmap", e);
      return [
        { id: '1', text: 'Sujet Principal', x: 250, y: 180, color: '#3b82f6' }
      ];
    }
  });
  
  const [links, setLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_student_mindmap');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.links) {
          return parsed.links;
        }
      }
      return [
        { from: '1', to: '2' },
        { from: '1', to: '3' }
      ];
    } catch (e) {
      return [];
    }
  });

  const [text, setText] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Sync state to local storage
  useEffect(() => {
    const data = { nodes, links };
    localStorage.setItem('ff_student_mindmap', JSON.stringify(data));
  }, [nodes, links]);

  const handleAddNode = () => {
    if (!text.trim()) return;
    const newId = Date.now().toString();
    const newNode = {
      id: newId,
      text: text.trim(),
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      color
    };

    setNodes([...nodes, newNode]);
    if (selectedNode) {
      setLinks([...links, { from: selectedNode, to: newId }]);
    }
    setText('');
  };

  const handleDeleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setLinks(links.filter(l => l.from !== id && l.to !== id));
    if (selectedNode === id) setSelectedNode(null);
    if (draggedNodeId === id) setDraggedNodeId(null);
  };

  // Pointer drag events on SVG
  const handlePointerDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setDraggedNodeId(nodeId);
    setDragOffset({ x: x - node.x, y: y - node.y });
    setSelectedNode(nodeId);
  };

  const handlePointerMove = (e) => {
    if (!draggedNodeId) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setNodes(prev => prev.map(n => {
      if (n.id === draggedNodeId) {
        return {
          ...n,
          x: Math.max(60, Math.min(rect.width - 60, x - dragOffset.x)),
          y: Math.max(30, Math.min(rect.height - 30, y - dragOffset.y))
        };
      }
      return n;
    }));
  };

  const handlePointerUp = () => {
    setDraggedNodeId(null);
  };

  // SVG Export function
  const handleExportSVG = () => {
    const svgElement = document.getElementById('mindmap-svg-render');
    if (!svgElement) return;

    // Create a clone to export cleanly
    const clone = svgElement.cloneNode(true);
    // Remove interactive pointer styles
    clone.style.cursor = 'default';
    clone.style.backgroundColor = '#0f172a'; // enforce slate background for visual fidelity
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carte_mentale.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🧠 Mind Map Vectoriel
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Créez des schémas d'idées vectoriels interactifs, faites glisser les bulles à la souris et exportez-les.
          </p>
        </div>
        <FolderButton toolId="mindmap" toolName="MindMapsVectoriel" localStorageKeys={['ff_student_mindmap']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Interactive Mind Map Area */}
        <div className="glass-panel" style={{ padding: 12, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ position: 'relative' }}>
            <svg 
              id="mindmap-svg-render"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ 
                width: '100%', 
                height: 480, 
                backgroundColor: 'rgba(0,0,0,0.15)', 
                borderRadius: 12,
                touchAction: 'none',
                userSelect: 'none'
              }}
            >
              {/* Draw connections */}
              {links.map((link, idx) => {
                const fromNode = nodes.find(n => n.id === link.from);
                const toNode = nodes.find(n => n.id === link.to);
                if (!fromNode || !toNode) return null;
                return (
                  <line 
                    key={idx} 
                    x1={fromNode.x} 
                    y1={fromNode.y} 
                    x2={toNode.x} 
                    y2={toNode.y} 
                    stroke="rgba(255,255,255,0.25)" 
                    strokeWidth="3" 
                  />
                );
              })}

              {/* Draw nodes */}
              {nodes.map(n => {
                const isSelected = selectedNode === n.id;
                const width = Math.max(110, n.text.length * 8 + 24);
                const height = 36;
                return (
                  <g 
                    key={n.id} 
                    onPointerDown={(e) => handlePointerDown(e, n.id)} 
                    style={{ cursor: 'grab' }}
                  >
                    <rect 
                      x={n.x - width / 2} 
                      y={n.y - height / 2} 
                      width={width} 
                      height={height} 
                      rx={10} 
                      ry={10}
                      fill={n.color} 
                      stroke={isSelected ? '#ffffff' : 'none'} 
                      strokeWidth="3.5" 
                      opacity="0.95" 
                    />
                    <text 
                      x={n.x} 
                      y={n.y + 4} 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="11" 
                      fontWeight="bold"
                    >
                      {n.text}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            <button 
              onClick={handleExportSVG} 
              className="btn-premium btn-secondary" 
              style={{ position: 'absolute', top: 12, right: 12, padding: '6px 12px', fontSize: '0.8rem' }}
            >
              📥 Exporter au format SVG
            </button>
          </div>
        </div>

        {/* Form and Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Contrôles</h2>

          <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nœud parent sélectionné :</span>
            <div style={{ marginTop: 4, fontWeight: 'bold', color: '#10b981' }}>
              {nodes.find(n => n.id === selectedNode)?.text || 'Aucun (créera un nœud flottant)'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              * Cliquez sur un nœud dans le canevas pour le lier au suivant ou le supprimer.
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom de l'idée</label>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="input-premium" placeholder="Ex: Rédiger le rapport" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Couleur du nœud</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value="#3b82f6">Bleu</option>
              <option value="#10b981">Vert</option>
              <option value="#f59e0b">Jaune/Orange</option>
              <option value="#ef4444">Rouge</option>
              <option value="#8b5cf6">Violet</option>
            </select>
          </div>

          <button onClick={handleAddNode} className="btn-premium btn-primary" style={{ padding: 10, fontWeight: 'bold' }}>
            ➕ Ajouter le nœud
          </button>

          {selectedNode && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Actions sur le nœud sélectionné :</span>
              <button 
                onClick={() => handleDeleteNode(selectedNode)} 
                className="btn-premium btn-danger" 
                style={{ padding: 10, background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 'bold', justifyContent: 'center' }}
              >
                🗑️ Supprimer le nœud
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}