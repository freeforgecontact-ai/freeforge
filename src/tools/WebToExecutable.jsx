import React, { useState } from 'react';
import JSZip from 'jszip';
import FolderButton from '../components/FolderButton';

export default function WebToExecutable({ goBack }) {
  const [appName, setAppName] = useState('MonAppForge');
  const [packageId, setPackageId] = useState('com.freeforge.monapp');
  const [targetType, setTargetType] = useState('exe'); // 'exe' or 'apk'
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      // Allow html, css, js, json, png, jpg, jpeg, svg, gif, etc.
      const ext = file.name.split('.').pop().toLowerCase();
      return ['html', 'htm', 'css', 'js', 'json', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'ico', 'zip'].includes(ext);
    });

    if (validFiles.length === 0) {
      setErrorText("Aucun fichier web valide (.html, .css, .js, .png, etc.) n'a été détecté.");
      return;
    }

    setErrorText('');
    setFiles(prev => {
      // Deduplicate by file path/name
      const merged = [...prev];
      validFiles.forEach(nf => {
        if (!merged.find(f => f.name === nf.name)) {
          merged.push(nf);
        }
      });
      return merged;
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setErrorText('');
  };

  const handleCompile = async () => {
    if (files.length === 0) {
      setErrorText("Veuillez ajouter au moins un fichier web (index.html requis).");
      return;
    }

    const hasIndexHtml = files.some(f => f.name.toLowerCase() === 'index.html');
    
    // If we only have a zip file, it doesn't need index.html verification directly, but we assume it is correct inside.
    const isSingleZip = files.length === 1 && files[0].name.endsWith('.zip');
    
    if (!hasIndexHtml && !isSingleZip) {
      setErrorText("Votre lot de fichiers doit obligatoirement inclure un fichier nommé 'index.html' qui servira de point d'entrée.");
      return;
    }

    setLoading(true);
    setErrorText('');
    setStatusText("Préparation du package d'actifs...");

    try {
      let zipBase64 = '';

      if (isSingleZip) {
        // Zip upload: read directly
        setStatusText("Lecture de l'archive ZIP...");
        const reader = new FileReader();
        const readPromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier ZIP"));
        });
        reader.readAsDataURL(files[0]);
        zipBase64 = await readPromise;
      } else {
        // Multi-file upload: create zip programmatically
        setStatusText("Génération de l'archive ZIP en mémoire...");
        const zip = new JSZip();
        
        const filePromises = files.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              // Write the binary data to zip
              zip.file(file.name, reader.result);
              resolve();
            };
            reader.onerror = () => reject(new Error(`Impossible de lire le fichier ${file.name}`));
            reader.readAsArrayBuffer(file);
          });
        });

        await Promise.all(filePromises);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
        });
        reader.readAsDataURL(zipBlob);
        zipBase64 = await base64Promise;
      }

      if (targetType === 'exe') {
        setStatusText("Compilation de l'exécutable Windows sur le serveur...");
        const response = await fetch('/api/package-exe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appName,
            zipBase64
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || "Échec de la compilation locale. Vérifiez que csc.exe est présent.");
        }

        setStatusText("Téléchargement de votre exécutable...");
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${appName}.exe`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setStatusText("Génération du projet Android Gradle sur le serveur...");
        const response = await fetch('/api/package-apk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appName,
            packageId,
            zipBase64
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Échec de la génération du package Android.");
        }

        setStatusText("Téléchargement du projet Android (ZIP)...");
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${appName}_android_project.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setStatusText("Opération réussie !");
      setTimeout(() => setStatusText(''), 3000);

    } catch (err) {
      console.error(err);
      setErrorText(err.message || "Une erreur est survenue lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📦 WebToExecutable Compiler
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Compilez instantanément vos applications HTML/CSS/JS locales en exécutables natifs Windows (.exe) ou générez le projet Android (.apk).
          </p>
        </div>
        <FolderButton toolId="web_executable" toolName="WebToExecutable" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left Side: Upload & Files */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>1. Fichiers sources web</h2>
          
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12,
              padding: '32px 16px',
              textAlign: 'center',
              background: dragActive ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.01)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input 
              id="file-upload-input"
              type="file" 
              multiple 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept=".html,.htm,.css,.js,.json,.png,.jpg,.jpeg,.svg,.gif,.ico,.zip"
            />
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>
              Glissez-déposez vos fichiers ici, ou cliquez pour parcourir
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Fichiers HTML, CSS, JS, Images, ICO ou un fichier .zip contenant l'ensemble.
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Fichiers ajoutés ({files.length}) :
                </span>
                <button onClick={clearFiles} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Tout effacer
                </button>
              </div>

              <div style={{ maxRank: '300px', overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--border-light)' }}>
                {files.map((file, i) => {
                  const isIndex = file.name.toLowerCase() === 'index.html';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: isIndex ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 6, border: `1px solid ${isIndex ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{file.name.endsWith('.zip') ? '📦' : '📄'}</span>
                        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: isIndex ? '#10b981' : 'white', fontWeight: isIndex ? 'bold' : 'normal' }}>
                          {file.name}
                        </span>
                        {isIndex && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, backgroundColor: '#10b981', color: 'black', fontWeight: 'bold' }}>
                            Point d'entrée
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Options & Compiler */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>2. Configuration</h2>

          {/* Target type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Type de package cible :</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button" 
                className={`btn-premium ${targetType === 'exe' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: 12, borderRadius: 10, justifyContent: 'center' }}
                onClick={() => setTargetType('exe')}
              >
                🪟 Windows (.exe)
              </button>
              <button 
                type="button" 
                className={`btn-premium ${targetType === 'apk' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: 12, borderRadius: 10, justifyContent: 'center' }}
                onClick={() => setTargetType('apk')}
              >
                🤖 Android (.apk / ZIP)
              </button>
            </div>
          </div>

          {/* App Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nom de l'application :</label>
              <input 
                type="text" 
                value={appName} 
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Ex. SuperApp"
                className="input-premium"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8 }}
              />
            </div>

            {targetType === 'apk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ID du Package (Android) :</label>
                <input 
                  type="text" 
                  value={packageId} 
                  onChange={(e) => setPackageId(e.target.value)}
                  placeholder="Ex. com.monentreprise.app"
                  className="input-premium"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontFamily: 'monospace' }}
                />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 8 }}>
            {/* Compile button */}
            <button 
              type="button" 
              onClick={handleCompile}
              disabled={loading}
              className="btn-premium btn-primary"
              style={{ width: '100%', padding: 14, borderRadius: 10, fontSize: '1rem', fontWeight: 'bold', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" /> Compilation en cours...
                </span>
              ) : (
                targetType === 'exe' ? '🚀 Compiler en Windows EXE' : '📦 Générer le Projet Android'
              )}
            </button>

            {statusText && (
              <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#93c5fd', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner-small" /> {statusText}
              </div>
            )}

            {errorText && (
              <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: '0.8rem', lineHeight: 1.4 }}>
                ⚠️ {errorText}
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {targetType === 'exe' ? (
              <>
                <strong>Note Windows :</strong> Le serveur backend compilera votre code HTML avec le compilateur natif C# de Windows (<code>csc.exe</code>). L'exécutable généré inclut un mini serveur web intégré et charge le navigateur Edge local sécurisé sans affichage d'URL.
              </>
            ) : (
              <>
                <strong>Note Android :</strong> Cet outil génère une archive complète d'un projet Android Studio natif (Gradle + Java WebView). Vous pouvez compiler l'APK sur votre machine locale en exécutant <code>build.bat</code> ou en ouvrant le projet dans Android Studio.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
