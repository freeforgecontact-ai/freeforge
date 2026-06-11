import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

// Recursive Component to render JSON tree node
function JsonNode({ name, value, isLast = true }) {
  const [collapsed, setCollapsed] = useState(false);

  const getType = (val) => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  };

  const type = getType(value);

  const renderKey = () => {
    if (name === undefined || name === null) return null;
    return <span style={{ color: '#a78bfa', fontWeight: 600 }}>"{name}": </span>;
  };

  if (type === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <div style={{ marginLeft: 16, fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {renderKey()}<span>{"{}"}</span>{!isLast && ','}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: 16, fontSize: '0.85rem', fontFamily: 'monospace' }}>
        <span 
          onClick={() => setCollapsed(!collapsed)} 
          style={{ cursor: 'pointer', userSelect: 'none', marginRight: 4, color: 'var(--text-muted)' }}
        >
          {collapsed ? '▶' : '▼'}
        </span>
        {renderKey()}
        <span>{"{"}</span>
        
        {!collapsed && (
          <div style={{ paddingLeft: 12, borderLeft: '1px dashed rgba(255,255,255,0.05)' }}>
            {keys.map((key, index) => (
              <JsonNode 
                key={key} 
                name={key} 
                value={value[key]} 
                isLast={index === keys.length - 1} 
              />
            ))}
          </div>
        )}
        
        {collapsed && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> ... </span>}
        <span style={{ marginLeft: collapsed ? 0 : 12 }}>{"}"}</span>{!isLast && ','}
      </div>
    );
  }

  if (type === 'array') {
    if (value.length === 0) {
      return (
        <div style={{ marginLeft: 16, fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {renderKey()}<span>{"[]"}</span>{!isLast && ','}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: 16, fontSize: '0.85rem', fontFamily: 'monospace' }}>
        <span 
          onClick={() => setCollapsed(!collapsed)} 
          style={{ cursor: 'pointer', userSelect: 'none', marginRight: 4, color: 'var(--text-muted)' }}
        >
          {collapsed ? '▶' : '▼'}
        </span>
        {renderKey()}
        <span>{"["}</span>
        
        {!collapsed && (
          <div style={{ paddingLeft: 12, borderLeft: '1px dashed rgba(255,255,255,0.05)' }}>
            {value.map((item, index) => (
              <JsonNode 
                key={index} 
                name={null} 
                value={item} 
                isLast={index === value.length - 1} 
              />
            ))}
          </div>
        )}
        
        {collapsed && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> ... </span>}
        <span style={{ marginLeft: collapsed ? 0 : 12 }}>{"]"}</span>{!isLast && ','}
      </div>
    );
  }

  // Primitive values rendering
  const renderValue = () => {
    if (type === 'string') {
      return <span style={{ color: '#10b981' }}>"{value}"</span>;
    }
    if (type === 'number') {
      return <span style={{ color: '#f59e0b' }}>{value}</span>;
    }
    if (type === 'boolean') {
      return <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{value.toString()}</span>;
    }
    if (type === 'null') {
      return <span style={{ color: '#ef4444', fontStyle: 'italic' }}>null</span>;
    }
    return <span>{value.toString()}</span>;
  };

  return (
    <div style={{ marginLeft: 16, paddingLeft: 12, fontSize: '0.85rem', fontFamily: 'monospace' }}>
      {renderKey()}
      {renderValue()}
      {!isLast && ','}
    </div>
  );
}

export default function JsonFormatter({ goBack }) {
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFormat = () => {
    if (!jsonText.trim()) {
      setErrorMsg(null);
      setParsedData(null);
      setIsSuccess(false);
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      setParsedData(parsed);
      setErrorMsg(null);
      setJsonText(JSON.stringify(parsed, null, 2));
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      setErrorMsg(err.message);
      setParsedData(null);
    }
  };

  const handleMinify = () => {
    if (!jsonText.trim()) return;

    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setParsedData(parsed);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err.message);
      setParsedData(null);
    }
  };

  const handleClear = () => {
    setJsonText('');
    setParsedData(null);
    setErrorMsg(null);
  };

  const copyResult = () => {
    if (!jsonText) return;
    navigator.clipboard.writeText(jsonText);
    const btn = document.getElementById('copy-json-btn');
    if (btn) {
      btn.innerText = 'Copié !';
      btn.style.borderColor = '#10b981';
      setTimeout(() => {
        btn.innerText = 'Copier le JSON';
        btn.style.borderColor = '';
      }, 1500);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Code</span>
        <FolderButton toolId="json" toolName="Formatteur JSON" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Formatteur & Arbre JSON</h1>
      <p className="page-subtitle">Validez, mettez en forme vos données JSON et naviguez dans l'arborescence pliante en local.</p>

      <div className="grid-2" style={{ gridTemplateColumns: '45% 55%' }}>
        {/* Editor panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-premium" style={{ cursor: 'default', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Coller le JSON brut</h2>
            
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Ex: {"id":1,"titre":"test","valide":true}'
              style={{
                width: '100%',
                height: '320px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                padding: 16,
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                resize: 'none',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-premium btn-primary" onClick={handleFormat} style={{ flexGrow: 1, justifyContent: 'center' }}>
                Formater & Valider
              </button>
              <button className="btn-premium btn-secondary" onClick={handleMinify}>
                Minifier
              </button>
              <button className="btn-premium btn-secondary" onClick={handleClear} style={{ color: '#ef4444' }}>
                Effacer
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 16, borderRadius: 12, fontSize: '0.85rem', fontFamily: 'monospace' }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Erreur de validation JSON :</strong>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Tree View panel */}
        <div className="card-premium" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Visualisation en Arbre</h2>
            {jsonText && (
              <button id="copy-json-btn" className="btn-premium btn-secondary" onClick={copyResult} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Copier le JSON
              </button>
            )}
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px', padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            {parsedData ? (
              <div style={{ color: 'var(--text-primary)' }}>
                <JsonNode name={null} value={parsedData} isLast={true} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8, padding: '40px 0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{ width: 44, height: 44 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span style={{ fontSize: '0.85rem' }}>Les données structurées s'afficheront ici après validation.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
