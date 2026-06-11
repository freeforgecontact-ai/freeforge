import React, { useState } from 'react';
import JSZip from 'jszip';
import FolderButton from '../components/FolderButton';

export default function ZipArchiver({ goBack }) {
  const [mode, setMode] = useState('compress'); // compress, extract
  const [filesToCompress, setFilesToCompress] = useState([]);
  const [zipName, setZipName] = useState('archive');
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [extractedZipName, setExtractedZipName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compression Handler
  const handleFilesToCompressUpload = (e) => {
    const files = Array.from(e.target.files);
    const mapped = files.map(file => ({
      name: file.name,
      size: file.size,
      fileObject: file
    }));
    setFilesToCompress(prev => [...prev, ...mapped]);
    e.target.value = null;
  };

  const removeFileFromCompressList = (idx) => {
    setFilesToCompress(prev => prev.filter((_, i) => i !== idx));
  };

  const createZip = async () => {
    if (filesToCompress.length === 0) return;
    setIsProcessing(true);
    
    try {
      const zip = new JSZip();
      filesToCompress.forEach(f => {
        zip.file(f.name, f.fileObject);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${zipName.replace(/\.zip$/i, '') || 'archive'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'archive ZIP.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Extraction Handler
  const handleZipToExtractUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExtractedZipName(file.name);
    setIsProcessing(true);
    setExtractedFiles([]);

    try {
      const zip = await JSZip.loadAsync(file);
      const filesArr = [];
      
      // We read files metadata
      const promises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          promises.push(
            zipEntry.async('blob').then(blob => {
              filesArr.push({
                name: zipEntry.name,
                blob: blob,
                size: blob.size
              });
            })
          );
        }
      });
      
      await Promise.all(promises);
      setExtractedFiles(filesArr);
    } catch (err) {
      console.error(err);
      alert("Fichier ZIP invalide ou protégé par mot de passe.");
    } finally {
      setIsProcessing(false);
    }
    e.target.value = null;
  };

  const downloadExtractedFile = (file) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.blob);
    link.download = file.name.split('/').pop(); // Get filename only
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const extractAllFiles = () => {
    extractedFiles.forEach(downloadExtractedFile);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Compresseur & Extracteur ZIP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Compressez plusieurs fichiers en ZIP ou extrayez une archive locale de façon ultra-rapide.</p>
        </div>
        <FolderButton toolId="zip_archiver" toolName="Gestionnaire ZIP" />
      </div>

      <div className="grid-2">
        {/* Left Column: Toggle Mode & Inputs */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Opération</h2>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => setMode('compress')} 
              className={`btn-premium ${mode === 'compress' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              📦 Créer un ZIP (Compresser)
            </button>
            <button 
              onClick={() => setMode('extract')} 
              className={`btn-premium ${mode === 'extract' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            >
              🔓 Extraire un ZIP (Décompresser)
            </button>
          </div>

          {mode === 'compress' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Nom de l'archive finale :</label>
                <input 
                  type="text" 
                  value={zipName} 
                  onChange={(e) => setZipName(e.target.value)} 
                  className="input-premium"
                  placeholder="nom_archive"
                />
              </div>

              <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                📁 Ajouter des fichiers
                <input type="file" multiple onChange={handleFilesToCompressUpload} style={{ display: 'none' }} />
              </label>

              {filesToCompress.length > 0 && (
                <button onClick={createZip} className="btn-premium btn-primary" style={{ justifyContent: 'center', marginTop: 10 }} disabled={isProcessing}>
                  {isProcessing ? 'Génération...' : '📦 Télécharger l\'archive ZIP'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                📁 Sélectionner l'archive .zip
                <input type="file" accept=".zip" onChange={handleZipToExtractUpload} style={{ display: 'none' }} />
              </label>
              {extractedZipName && (
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Archive chargée : {extractedZipName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Files List & Actions */}
        <div className="card-premium" style={{ gap: 18 }}>
          {mode === 'compress' ? (
            <>
              <h2 className="card-title">Fichiers à zipper ({filesToCompress.length})</h2>
              
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {filesToCompress.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Aucun fichier sélectionné. Ajoutez des fichiers à l'aide du bouton de gauche.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Nom</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Taille</th>
                          <th style={{ padding: '8px 12px', width: 60 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {filesToCompress.map((f, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 180 }}>{f.name}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatSize(f.size)}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <button onClick={() => removeFileFromCompressList(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title">Fichiers dans l'archive ({extractedFiles.length})</h2>
                {extractedFiles.length > 0 && (
                  <button onClick={extractAllFiles} className="btn-premium btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                    📂 Extraire tout
                  </button>
                )}
              </div>

              <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {extractedFiles.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Chargez une archive ZIP pour en inspecter les fichiers internes.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Nom</th>
                          <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Taille</th>
                          <th style={{ padding: '8px 12px', width: 80 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {extractedFiles.map((f, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 180 }}>{f.name}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatSize(f.size)}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <button 
                                onClick={() => downloadExtractedFile(f)} 
                                className="btn-premium" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4, backgroundColor: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
                              >
                                Téléch.
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
