import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function MediaConverter({ goBack }) {
  const [files, setFiles] = useState([]);
  const [targetFormats, setTargetFormats] = useState({}); // file.id -> targetFormat
  const [fileOptions, setFileOptions] = useState({}); // file.id -> { resolution: 'original', quality: 80, imageWidth: '', imageHeight: '', audioBitrate: '192k' }

  // Batch Job State
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState(null);
  const [backendFiles, setBackendFiles] = useState([]); // files list from backend job

  const pollIntervalRef = useRef(null);

  // File type checkers
  const isVideoFile = (filename) => {
    return !!filename.match(/\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v|3gp)$/i);
  };
  const isAudioFile = (filename) => {
    return !!filename.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (selectedFiles) => {
    const newFiles = selectedFiles.map(file => {
      const id = 'local-' + Date.now() + '-' + Math.round(Math.random() * 1e5);
      
      // Default formats based on extension
      let defaultFormat = 'png';
      if (isVideoFile(file.name)) {
        defaultFormat = 'mp4';
      } else if (isAudioFile(file.name)) {
        defaultFormat = 'mp3';
      } else if (file.name.match(/\.gif$/i)) {
        defaultFormat = 'gif';
      }

      // Initialize default options
      setTargetFormats(prev => ({ ...prev, [id]: defaultFormat }));
      setFileOptions(prev => ({
        ...prev,
        [id]: {
          resolution: 'original',
          quality: 80,
          imageWidth: '',
          imageHeight: '',
          audioBitrate: '192k'
        }
      }));

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleRemoveFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
    setTargetFormats(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFileOptions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleOptionChange = (fileId, key, val) => {
    setFileOptions(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [key]: val
      }
    }));
  };

  const handleStartConversion = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setJobId(null);
    setJobProgress(0);
    setJobStatus(null);
    setBackendFiles([]);

    try {
      // 1. Upload files to backend
      const formData = new FormData();
      files.forEach(f => {
        formData.append('files', f.file);
      });

      const uploadRes = await fetch('http://localhost:3001/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Erreur lors du téléversement des fichiers.");
      }

      const { files: uploadedFiles } = await uploadRes.json();
      setIsUploading(false);
      setIsConverting(true);

      // 2. Map local options with uploaded file structures
      const filesPayload = uploadedFiles.map((uf, idx) => {
        const localFile = files[idx];
        return {
          id: uf.id,
          path: uf.path,
          originalName: uf.originalName,
          targetFormat: targetFormats[localFile.id]
        };
      });

      const optionsPayload = {};
      uploadedFiles.forEach((uf, idx) => {
        const localFile = files[idx];
        optionsPayload[uf.id] = fileOptions[localFile.id];
      });

      // 3. Start conversion job
      const convertRes = await fetch('http://localhost:3001/api/media/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesPayload,
          options: optionsPayload
        })
      });

      if (!convertRes.ok) {
        throw new Error("Impossible d'initier le job de conversion.");
      }

      const { jobId: newJobId } = await convertRes.json();
      setJobId(newJobId);
      
      // Start polling
      startPolling(newJobId);

    } catch (err) {
      alert("La conversion a échoué : " + err.message);
      setIsUploading(false);
      setIsConverting(false);
    }
  };

  const startPolling = (jobId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/media/job/${jobId}`);
        if (!res.ok) throw new Error("Erreur de statut du job.");
        
        const job = await res.json();
        setJobProgress(job.progress);
        setJobStatus(job.status);
        setBackendFiles(job.files || []);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setIsConverting(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleDownload = (fileId) => {
    window.open(`http://localhost:3001/api/media/download/${fileId}`, '_blank');
  };

  const handleDownloadZip = () => {
    if (!jobId) return;
    window.open(`http://localhost:3001/api/media/download-zip/${jobId}`, '_blank');
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const clearQueue = () => {
    if (isUploading || isConverting) return;
    setFiles([]);
    setTargetFormats({});
    setFileOptions({});
    setJobId(null);
    setJobProgress(0);
    setJobStatus(null);
    setBackendFiles([]);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🎞️ Convertisseur de Médias en Lot (Batch Converter)
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Convertissez et redimensionnez en lot vos images, vidéos et fichiers audio 100% localement via FFmpeg.
          </p>
        </div>
        <FolderButton toolId="media_converter" toolName="MediaConverter" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        
        {/* Upload Zone */}
        {files.length === 0 && (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ 
              border: '2px dashed var(--border-light)', 
              borderRadius: 16, 
              padding: '60px 20px', 
              textAlign: 'center', 
              backgroundColor: 'rgba(255,255,255,0.01)', 
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onClick={() => document.getElementById('media-picker').click()}
          >
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: 16 }}>📁</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>Glissez-déposez des images ou vidéos ici</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 6 }}>Ou cliquez pour parcourir les fichiers de votre ordinateur</p>
            <input 
              id="media-picker"
              type="file" 
              multiple 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
        )}

        {/* Files queue and status */}
        {files.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
            
            {/* Queue List */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0 }}>File d'attente ({files.length} fichiers)</h2>
                <button 
                  onClick={clearQueue} 
                  disabled={isUploading || isConverting}
                  className="btn-premium btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444' }}
                >
                  Tout vider
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                {files.map((f, idx) => {
                  const isVid = isVideoFile(f.name);
                  const isAud = isAudioFile(f.name);
                  const activeFormat = targetFormats[f.id] || 'png';
                  const options = fileOptions[f.id] || {};

                  // Find status from backend if job is active
                  const backendFile = backendFiles.find(bf => bf.originalName === f.name);
                  const status = backendFile ? backendFile.status : 'pending';
                  const progress = backendFile ? backendFile.progress : 0;
                  const error = backendFile ? backendFile.error : null;

                  return (
                    <div 
                      key={f.id} 
                      style={{ 
                        padding: 16, 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      {/* Top row: Info & Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: 'white', display: 'block', wordBreak: 'break-all' }}>{idx + 1}. {f.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {formatSize(f.size)} | {isVid ? 'Vidéo' : isAud ? 'Audio' : 'Image'}
                          </span>
                        </div>
                        
                        {!isUploading && !isConverting && (
                          <button 
                            onClick={() => handleRemoveFile(f.id)} 
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                            title="Supprimer"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Middle row: File Configuration */}
                      {!isUploading && !isConverting && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                          
                          {/* Target Format selector */}
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Format cible :</label>
                            <select 
                              value={activeFormat} 
                              onChange={e => setTargetFormats(prev => ({ ...prev, [f.id]: e.target.value }))}
                              className="input-premium"
                              style={{ width: '100%', padding: 6, borderRadius: 6, marginTop: 4, fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
                            >
                              {isVid ? (
                                <>
                                  <option value="mp4">MP4 (H.264)</option>
                                  <option value="webm">WEBM (VP9)</option>
                                  <option value="mkv">MKV</option>
                                  <option value="avi">AVI</option>
                                  <option value="mov">MOV</option>
                                  <option value="gif">GIF (Animé)</option>
                                  <option value="mp3">Extraire MP3</option>
                                  <option value="wav">Extraire WAV</option>
                                </>
                              ) : isAud ? (
                                <>
                                  <option value="mp3">MP3</option>
                                  <option value="wav">WAV</option>
                                </>
                              ) : (
                                <>
                                  <option value="png">PNG</option>
                                  <option value="jpg">JPEG</option>
                                  <option value="webp">WEBP</option>
                                  <option value="gif">GIF</option>
                                  <option value="bmp">BMP</option>
                                  <option value="tiff">TIFF</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Resolution Option for Videos */}
                          {isVid && activeFormat !== 'mp3' && activeFormat !== 'wav' && (
                            <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Résolution :</label>
                              <select 
                                value={options.resolution || 'original'} 
                                onChange={e => handleOptionChange(f.id, 'resolution', e.target.value)}
                                className="input-premium"
                                style={{ width: '100%', padding: 6, borderRadius: 6, marginTop: 4, fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
                              >
                                <option value="original">Originale</option>
                                <option value="1080p">1080p (FHD)</option>
                                <option value="720p">720p (HD)</option>
                                <option value="480p">480p (SD)</option>
                              </select>
                            </div>
                          )}

                          {/* Image resize options */}
                          {!isVid && !isAud && (
                            <>
                              <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Largeur (px) :</label>
                                <input 
                                  type="number" 
                                  placeholder="Auto" 
                                  value={options.imageWidth || ''} 
                                  onChange={e => handleOptionChange(f.id, 'imageWidth', e.target.value)}
                                  className="input-premium"
                                  style={{ width: '100%', padding: '4px 8px', borderRadius: 6, marginTop: 4, fontSize: '0.8rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hauteur (px) :</label>
                                <input 
                                  type="number" 
                                  placeholder="Auto" 
                                  value={options.imageHeight || ''} 
                                  onChange={e => handleOptionChange(f.id, 'imageHeight', e.target.value)}
                                  className="input-premium"
                                  style={{ width: '100%', padding: '4px 8px', borderRadius: 6, marginTop: 4, fontSize: '0.8rem' }}
                                />
                              </div>
                            </>
                          )}

                        </div>
                      )}

                      {/* Conversion active status row */}
                      {(isUploading || isConverting || status !== 'pending') && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                            <span>
                              {status === 'pending' && 'En attente...'}
                              {status === 'processing' && `Conversion en cours (${progress}%)`}
                              {status === 'completed' && 'Conversion terminée ✓'}
                              {status === 'failed' && `Échec : ${error}`}
                            </span>
                            {status === 'completed' && (
                              <button 
                                onClick={() => handleDownload(backendFile.id)} 
                                className="btn-premium btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: 4 }}
                              >
                                Télécharger 📥
                              </button>
                            )}
                          </div>
                          
                          {status === 'processing' && (
                            <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s ease' }} />
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0 }}>Actions globales</h2>
              
              {!isUploading && !isConverting ? (
                <button 
                  onClick={handleStartConversion} 
                  className="btn-premium btn-primary" 
                  style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}
                >
                  ⚡ Lancer la conversion
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    {isUploading ? 'Téléversement des fichiers...' : `Traitement du lot : ${jobProgress}%`}
                  </p>
                </div>
              )}

              {/* Job Global progress bar */}
              {(isConverting || jobStatus === 'completed' || jobStatus === 'failed') && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                    <span>Progression globale</span>
                    <span style={{ fontWeight: 'bold' }}>{jobProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${jobProgress}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.2s ease' }} />
                  </div>
                  
                  {jobStatus === 'completed' && (
                    <button 
                      onClick={handleDownloadZip} 
                      className="btn-premium btn-secondary" 
                      style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      📦 Télécharger tout (.ZIP)
                    </button>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>ℹ️ Formats supportés :</span>
                <span>• Vidéo : MP4, WEBM, MKV, AVI, MOV</span>
                <span>• Image : PNG, JPEG, WEBP, GIF, BMP, TIFF</span>
                <span>• Audio : MP3, WAV</span>
                <span style={{ marginTop: 6, fontStyle: 'italic' }}>*La conversion s'exécute à 100% en tâche de fond sur votre serveur local.</span>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
