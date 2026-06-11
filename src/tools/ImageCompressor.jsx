import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';
import JSZip from 'jszip';

export default function ImageCompressor({ goBack }) {
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('image/jpeg'); // 'image/jpeg' | 'image/png' | 'image/webp'
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newImages = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      preview: URL.createObjectURL(file),
      compressedSize: null,
      compressedBlob: null,
      status: 'pending' // 'pending' | 'success' | 'error'
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target && target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setIsCompressing(false);
    setCompressProgress(0);
  };

  const compressSingleImage = (imgObj) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(imgObj.file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          ctx.drawImage(img, 0, 0);
          
          const mimeType = format;
          const q = mimeType === 'image/png' ? undefined : quality / 100;
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                ...imgObj,
                compressedSize: blob.size,
                compressedBlob: blob,
                status: 'success'
              });
            } else {
              resolve({
                ...imgObj,
                status: 'error'
              });
            }
          }, mimeType, q);
        };
        img.onerror = () => {
          resolve({
            ...imgObj,
            status: 'error'
          });
        };
      };
    });
  };

  const compressAll = async () => {
    if (images.length === 0) return;
    setIsCompressing(true);
    setCompressProgress(0);

    const updatedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const result = await compressSingleImage(img);
      updatedImages.push(result);
      setCompressProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setImages(updatedImages);
    setIsCompressing(false);
  };

  const downloadAll = async () => {
    const successImages = images.filter(img => img.status === 'success' && img.compressedBlob);
    if (successImages.length === 0) return;

    if (successImages.length === 1) {
      // Download single file directly
      const img = successImages[0];
      downloadSingle(img);
      return;
    }

    // Zip and download
    const zip = new JSZip();
    const ext = format.split('/')[1];

    successImages.forEach(img => {
      const baseName = img.name.substring(0, img.name.lastIndexOf('.')) || img.name;
      zip.file(`${baseName}_compressed.${ext}`, img.compressedBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'freeforge_images.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadSingle = (img) => {
    if (!img.compressedBlob) return;
    const ext = format.split('/')[1];
    const baseName = img.name.substring(0, img.name.lastIndexOf('.')) || img.name;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(img.compressedBlob);
    link.download = `${baseName}_compressed.${ext}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const formatSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSavedPercentage = (orig, comp) => {
    if (!orig || !comp) return 0;
    const saved = orig - comp;
    return Math.round((saved / orig) * 100);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Image</span>
        <FolderButton toolId="compressor" toolName="Compresseur d'Images" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Compresseur d'Images</h1>
      <p className="page-subtitle">Redimensionnez et réduisez le poids de vos images instantanément dans votre navigateur.</p>

      <div className="grid-2">
        {/* Left Side: Upload & settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('image-upload-input').click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="dropzone-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Glissez-déposez vos images ici</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ou cliquez pour explorer vos fichiers</p>
            </div>
            <input 
              id="image-upload-input"
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="card-premium" style={{ cursor: 'default' }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Paramètres de compression</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <label style={{ fontWeight: 600 }}>Qualité : {quality}%</label>
                <span style={{ color: 'var(--text-muted)' }}>Non applicable au format PNG</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={quality} 
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="slider"
                style={{ width: '100%', height: 4 }}
                disabled={format === 'image/png'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Format de sortie :</label>
              <select 
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="input-premium select-premium"
              >
                <option value="image/jpeg">JPEG (Recommandé pour photos)</option>
                <option value="image/webp">WebP (Qualité/Taille optimale)</option>
                <option value="image/png">PNG (Compression sans perte)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                className="btn-premium btn-primary" 
                onClick={compressAll}
                disabled={images.length === 0 || isCompressing}
                style={{ flexGrow: 1, justifyContent: 'center' }}
              >
                {isCompressing ? `Compression (${compressProgress}%)` : 'Tout Compresser'}
              </button>
              {images.length > 0 && (
                <button className="btn-premium btn-secondary" onClick={clearAll} style={{ color: '#ef4444' }}>
                  Vider
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Image list / preview */}
        <div className="card-premium" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Fichiers ({images.length})</h2>
            {images.some(img => img.status === 'success') && (
              <button className="btn-premium btn-primary" onClick={downloadAll} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Télécharger tout (ZIP)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {images.length > 0 ? (
              images.map(img => (
                <div 
                  key={img.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}
                >
                  <img src={img.preview} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                  
                  <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</span>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>{formatSize(img.size)}</span>
                      {img.status === 'success' && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{formatSize(img.compressedSize)}</span>
                          <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0 4px', borderRadius: 4 }}>
                            -{getSavedPercentage(img.size, img.compressedSize)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {img.status === 'success' ? (
                      <button 
                        className="action-btn"
                        style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)' }}
                        onClick={() => downloadSingle(img)}
                        title="Télécharger"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    ) : img.status === 'error' ? (
                      <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Échec</span>
                    ) : (
                      <button 
                        className="action-btn"
                        onClick={() => removeImage(img.id)}
                        title="Retirer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px 0', textCenter: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{ width: 48, height: 48, marginBottom: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ fontSize: '0.85rem' }}>Aucune image sélectionnée</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
