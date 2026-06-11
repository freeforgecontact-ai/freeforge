import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function Base64Encoder({ goBack }) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('base64'); // 'base64', 'url', 'html'
  const [fileInfo, setFileInfo] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleEncode = (text, currentMode = mode) => {
    try {
      if (!text) {
        setOutputText('');
        return;
      }
      if (currentMode === 'base64') {
        // UTF-8 safe base64 encoding
        const bytes = new TextEncoder().encode(text);
        const binString = String.fromCodePoint(...bytes);
        setOutputText(btoa(binString));
      } else if (currentMode === 'url') {
        setOutputText(encodeURIComponent(text));
      } else if (currentMode === 'html') {
        const temp = document.createElement('div');
        temp.textContent = text;
        setOutputText(temp.innerHTML);
      }
    } catch (err) {
      setOutputText('Erreur d\'encodage : ' + err.message);
    }
  };

  const handleDecode = (text, currentMode = mode) => {
    try {
      if (!text) {
        setOutputText('');
        return;
      }
      if (currentMode === 'base64') {
        const binString = atob(text);
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        setOutputText(new TextDecoder().decode(bytes));
      } else if (currentMode === 'url') {
        setOutputText(decodeURIComponent(text));
      } else if (currentMode === 'html') {
        const temp = document.createElement('div');
        temp.innerHTML = text;
        setOutputText(temp.textContent || temp.innerText || '');
      }
    } catch (err) {
      setOutputText('Erreur de décodage : ' + err.message);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    setFileInfo(null);
    handleEncode(val);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFileInfo(null);
    handleEncode(inputText, newMode);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      setFileInfo({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type || 'Inconnu'
      });
      setInputText(`[Fichier importé : ${file.name}]`);
      setOutputText(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    alert('Résultat copié dans le presse-papiers !');
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileInfo ? `${fileInfo.name}.base64.txt` : 'freeforge_encoded.txt';
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
            🔏 Encodeur / Décodeur Universel
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Encodez et décodez instantanément du texte ou des fichiers locaux en Base64, URL ou entités HTML.
          </p>
        </div>
        <FolderButton toolId="encoder" toolName="Base64Encoder" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Input Panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Entrée</h2>
            
            {/* Mode selection */}
            <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
              {['base64', 'url', 'html'].map(m => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: mode === m ? '#10b981' : 'transparent',
                    color: mode === m ? 'black' : 'var(--text-muted)'
                  }}
                >
                  {m === 'base64' ? 'Base64' : m === 'url' ? 'URL' : 'HTML'}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File area (only shown for base64) */}
          {mode === 'base64' && (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '16px',
                textAlign: 'center',
                background: dragActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
              onClick={() => document.getElementById('base64-file-input').click()}
            >
              <input 
                id="base64-file-input"
                type="file" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
              />
              📄 Glissez un fichier ici pour l'encoder directement en Base64
            </div>
          )}

          {fileInfo && (
            <div style={{ padding: 10, backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>📁 {fileInfo.name} ({fileInfo.size})</span>
              <span style={{ color: 'var(--text-muted)' }}>Type: {fileInfo.type}</span>
            </div>
          )}

          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="Écrivez ou collez votre texte ici..."
            className="input-premium"
            style={{ width: '100%', height: 200, padding: 12, borderRadius: 8, fontSize: '0.9rem', lineHeight: 1.5, flex: 1 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => handleEncode(inputText)} 
              className="btn-premium btn-primary" 
              style={{ flex: 1, padding: 12, borderRadius: 8, justifyContent: 'center', fontWeight: 'bold' }}
            >
              🔒 Encodage
            </button>
            <button 
              onClick={() => handleDecode(inputText)} 
              className="btn-premium btn-secondary" 
              style={{ flex: 1, padding: 12, borderRadius: 8, justifyContent: 'center', fontWeight: 'bold' }}
            >
              🔓 Décodage
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Résultat</h2>
            {outputText && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Taille: {outputText.length} octets
              </span>
            )}
          </div>

          <textarea
            readOnly
            value={outputText}
            placeholder="Le texte encodé ou décodé apparaîtra ici..."
            className="input-premium"
            style={{ width: '100%', height: 236, padding: 12, borderRadius: 8, fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: 1.5, flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
            onClick={(e) => { if (outputText) e.target.select(); }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              disabled={!outputText}
              onClick={handleCopy} 
              className="btn-premium btn-secondary" 
              style={{ flex: 1, padding: 12, borderRadius: 8, justifyContent: 'center', fontWeight: 'bold' }}
            >
              📋 Copier
            </button>
            <button 
              disabled={!outputText}
              onClick={handleDownload} 
              className="btn-premium btn-secondary" 
              style={{ flex: 1, padding: 12, borderRadius: 8, justifyContent: 'center', fontWeight: 'bold' }}
            >
              💾 Télécharger (.txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
