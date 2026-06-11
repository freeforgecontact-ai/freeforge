import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';
import { ID3Writer } from 'browser-id3-writer';

export default function Id3Editor({ goBack }) {
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Tag States
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  
  // Cover Art States
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    setFileName(file.name);

    // Set default title from filename (remove extension)
    const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setTitle(defaultTitle);
    setArtist('');
    setAlbum('');
    setGenre('');
    setYear('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearAll = () => {
    setAudioFile(null);
    setFileName('');
    setTitle('');
    setArtist('');
    setAlbum('');
    setGenre('');
    setYear('');
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview('');
  };

  // Convert File object to ArrayBuffer helper
  const fileToArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const saveTags = async () => {
    if (!audioFile) return;

    try {
      const audioBuffer = await fileToArrayBuffer(audioFile);
      const writer = new ID3Writer(audioBuffer);

      // Write standard text frames
      if (title.trim()) writer.setFrame('TIT2', title.trim()); // Title
      if (artist.trim()) writer.setFrame('TPE1', [artist.trim()]); // Artist
      if (album.trim()) writer.setFrame('TALB', album.trim()); // Album
      if (genre.trim()) writer.setFrame('TCON', [genre.trim()]); // Genre
      if (year.trim()) writer.setFrame('TYER', year.trim()); // Year

      // Embed Album Cover Art if selected
      if (coverFile) {
        const coverBuffer = await fileToArrayBuffer(coverFile);
        writer.setFrame('APIC', {
          type: 3, // Front cover
          data: coverBuffer,
          description: 'Cover art',
          useAltMime: false
        });
      }

      // Compile tag and generate new tagged MP3 file
      writer.addTag();
      const taggedBlob = writer.getBlob();

      // Download tagged file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(taggedBlob);
      const ext = audioFile.name.substring(audioFile.name.lastIndexOf('.')) || '.mp3';
      const baseName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.')) || audioFile.name;
      link.download = `${baseName}_tagged${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      alert('Tags enregistrés avec succès ! Le fichier audio modifié a été téléchargé.');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement des tags. Assurez-vous d'avoir importé un fichier MP3 valide.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Audio</span>
        <FolderButton toolId="id3" toolName="Éditeur de Tags ID3" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Éditeur de Tags ID3</h1>
      <p className="page-subtitle font-sans">Modifiez les métadonnées de vos pistes audio (Artiste, Titre, Jaquette) directement en local.</p>

      <div className="grid-2">
        {/* Left column: File import and cover select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!audioFile ? (
            <div 
              className="dropzone"
              onClick={() => document.getElementById('audio-tag-upload').click()}
              style={{ padding: 48 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="dropzone-icon" style={{ width: 48, height: 48 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Glissez votre fichier MP3 ici</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ou cliquez pour explorer</p>
              </div>
              <input 
                id="audio-tag-upload"
                type="file" 
                accept="audio/mp3, audio/mpeg" 
                onChange={handleAudioChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="card-premium" style={{ cursor: 'default', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Fichier chargé</span>
                <button className="btn-premium btn-secondary" onClick={clearAll} style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}>
                  Retirer
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-all' }}>🎧 {fileName}</p>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Jaquette de l'album (Cover Art)</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 90, 
                      height: 90, 
                      borderRadius: 8, 
                      background: coverPreview ? `url(${coverPreview}) center/cover no-repeat` : 'var(--bg-dark-3)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {!coverPreview && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{ width: 28, height: 28, color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <button 
                    className="btn-premium btn-secondary"
                    onClick={() => document.getElementById('cover-image-upload').click()}
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    Choisir une image
                  </button>
                  <input 
                    id="cover-image-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleCoverChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Form fields for ID3 tags */}
        <div className="card-premium" style={{ cursor: 'default', gap: 16 }}>
          <h2 className="card-title" style={{ fontSize: '1rem' }}>Tags Métadonnées</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Titre de la piste</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Never Gonna Give You Up" 
                className="input-premium"
                disabled={!audioFile}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Artiste</label>
              <input 
                type="text" 
                value={artist} 
                onChange={e => setArtist(e.target.value)}
                placeholder="Ex: Rick Astley" 
                className="input-premium"
                disabled={!audioFile}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Album</label>
              <input 
                type="text" 
                value={album} 
                onChange={e => setAlbum(e.target.value)}
                placeholder="Ex: Whenever You Need Somebody" 
                className="input-premium"
                disabled={!audioFile}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Genre</label>
                <input 
                  type="text" 
                  value={genre} 
                  onChange={e => setGenre(e.target.value)}
                  placeholder="Ex: Pop, Dance" 
                  className="input-premium"
                  disabled={!audioFile}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Année</label>
                <input 
                  type="text" 
                  value={year} 
                  onChange={e => setYear(e.target.value)}
                  placeholder="Ex: 1987" 
                  className="input-premium"
                  disabled={!audioFile}
                />
              </div>
            </div>
          </div>

          <button 
            className="btn-premium btn-primary"
            onClick={saveTags}
            disabled={!audioFile}
            style={{ marginTop: 12, justifyContent: 'center' }}
          >
            Enregistrer & Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
