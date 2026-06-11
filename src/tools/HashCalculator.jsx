import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function HashCalculator({ goBack }) {
  const [inputText, setInputText] = useState('');
  const [fileToHash, setFileToHash] = useState(null);
  const [hashes, setHashes] = useState({
    sha1: '',
    sha256: '',
    sha512: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputType, setInputType] = useState('text'); // text, file

  // Helper: Hex converter
  const bufToHex = (buffer) => {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map(value => value.toString(16).padStart(2, '0'))
      .join('');
  };

  // Compute Text Hash
  const computeTextHashes = async () => {
    if (!inputText) {
      setHashes({ sha1: '', sha256: '', sha512: '' });
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);

    try {
      const sha1Buf = await window.crypto.subtle.digest('SHA-1', data);
      const sha256Buf = await window.crypto.subtle.digest('SHA-256', data);
      const sha512Buf = await window.crypto.subtle.digest('SHA-512', data);

      setHashes({
        sha1: bufToHex(sha1Buf),
        sha256: bufToHex(sha256Buf),
        sha512: bufToHex(sha512Buf)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Compute File Hash
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileToHash(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const sha1Buf = await window.crypto.subtle.digest('SHA-1', data);
        const sha256Buf = await window.crypto.subtle.digest('SHA-256', data);
        const sha512Buf = await window.crypto.subtle.digest('SHA-512', data);

        setHashes({
          sha1: bufToHex(sha1Buf),
          sha256: bufToHex(sha256Buf),
          sha512: bufToHex(sha512Buf)
        });
      } catch (err) {
        console.error(err);
        alert("Erreur lors du calcul de l'empreinte du fichier.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (inputType === 'text') {
      computeTextHashes();
    }
  }, [inputText, inputType]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Hash copié !");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Calculateur de Hash (MD5, SHA-256)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Calculez instantanément les empreintes numériques cryptographiques de vos textes et fichiers.</p>
        </div>
        <FolderButton toolId="hash_calculator" toolName="Calculateur de Hash" />
      </div>

      <div className="grid-2">
        {/* Left Column: Input Selection */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Données d'entrée</h2>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => { setInputType('text'); setHashes({ sha1: '', sha256: '', sha512: '' }); }}
              className={`btn-premium ${inputType === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              ✍️ Saisie de Texte
            </button>
            <button 
              onClick={() => { setInputType('file'); setHashes({ sha1: '', sha256: '', sha512: '' }); }}
              className={`btn-premium ${inputType === 'file' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              📁 Glisser-déposer un Fichier
            </button>
          </div>

          {inputType === 'text' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Saisir le texte :</label>
              <textarea 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                className="input-premium"
                placeholder="Tapez ou collez votre texte ici..."
                style={{ minHeight: 140, fontSize: '0.85rem' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '32px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                📁 Choisir un fichier local
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {fileToHash && (
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Fichier : {fileToHash.name} ({(fileToHash.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Calcul de l'empreinte en cours...
            </div>
          )}
        </div>

        {/* Right Column: Display Hashes */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Empreintes (Checksums)</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* SHA-256 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700 }}>SHA-256 (Recommandé) :</span>
                {hashes.sha256 && (
                  <button onClick={() => handleCopy(hashes.sha256)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    📋 Copier
                  </button>
                )}
              </div>
              <div className="hash-result-box">
                <span style={{ color: hashes.sha256 ? '#34d399' : 'var(--text-muted)' }}>
                  {hashes.sha256 || 'Calcul en attente...'}
                </span>
              </div>
            </div>

            {/* SHA-512 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>SHA-512 :</span>
                {hashes.sha512 && (
                  <button onClick={() => handleCopy(hashes.sha512)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    📋 Copier
                  </button>
                )}
              </div>
              <div className="hash-result-box" style={{ padding: '12px', minHeight: 60 }}>
                <span style={{ color: hashes.sha512 ? '#a78bfa' : 'var(--text-muted)', fontSize: '0.75rem', display: 'block', wordBreak: 'break-all' }}>
                  {hashes.sha512 || 'Calcul en attente...'}
                </span>
              </div>
            </div>

            {/* SHA-1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>SHA-1 (Legacy) :</span>
                {hashes.sha1 && (
                  <button onClick={() => handleCopy(hashes.sha1)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    📋 Copier
                  </button>
                )}
              </div>
              <div className="hash-result-box">
                <span style={{ color: hashes.sha1 ? '#fbbf24' : 'var(--text-muted)' }}>
                  {hashes.sha1 || 'Calcul en attente...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
