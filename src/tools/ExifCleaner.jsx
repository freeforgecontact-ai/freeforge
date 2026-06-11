import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function ExifCleaner({ goBack }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Mock/extract basic info
    setFileDetails({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    });
  };

  const cleanMetadata = () => {
    if (!imagePreview || !imageFile) return;
    setIsCleaning(true);

    const img = new Image();
    img.src = imagePreview;
    img.onload = () => {
      // By drawing to a canvas and exporting, all original EXIF metadata is stripped
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const cleanUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = cleanUrl;
        link.download = `clean_${imageFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsCleaning(false);
        alert("Fichier nettoyé avec succès ! Les métadonnées EXIF et GPS ont été purgées.");
      }, imageFile.type);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Nettoyeur de Métadonnées (Exif)</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Purger les coordonnées GPS, la marque de l'appareil et les tags sensibles de vos photos.</p>
        </div>
        <FolderButton toolId="exif_cleaner" toolName="Nettoyeur Exif" />
      </div>

      <div className="grid-2">
        {/* Left Column: Image Import */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Importer l'image</h2>
          
          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            📷 Choisir une photo
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>

          {imagePreview && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'black', maxHeight: 280, display: 'flex', justifyContent: 'center' }}>
              <img src={imagePreview} alt="Aperçu" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Propriétés & Métadonnées</h2>
          
          {fileDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Nom du fichier :</span>
                  <span style={{ fontWeight: 600 }}>{fileDetails.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taille du fichier :</span>
                  <span style={{ fontWeight: 600 }}>{fileDetails.size}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Type MIME :</span>
                  <span style={{ fontWeight: 600 }}>{fileDetails.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dernière modification :</span>
                  <span style={{ fontWeight: 600 }}>{fileDetails.lastModified}</span>
                </div>
              </div>

              <div className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', width: 'fit-content' }}>
                ⚠️ Présence potentielle de tags GPS / EXIF
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                En cliquant sur le bouton ci-dessous, l'image sera redessinée dans un espace tampon en mémoire. Tous les en-têtes contenant les informations d'appareil photo, les coordonnées géographiques et l'historique d'édition seront définitivement effacés.
              </p>

              <button onClick={cleanMetadata} className="btn-premium btn-primary" style={{ justifyContent: 'center', marginTop: 8 }} disabled={isCleaning}>
                {isCleaning ? 'Nettoyage en cours...' : '🗑️ Purger les métadonnées & Télécharger'}
              </button>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Veuillez charger une image pour analyser les métadonnées.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
