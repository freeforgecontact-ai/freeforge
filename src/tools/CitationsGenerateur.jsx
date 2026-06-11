import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function CitationsGenerateur({ goBack }) {
  const [style, setStyle] = useState('APA');
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [url, setUrl] = useState('');

  const [generated, setGenerated] = useState('');

  const generateCitation = (e) => {
    e.preventDefault();
    if (!title) return;

    let citation = '';
    const cleanAuthor = author ? author.trim() : 'Inconnu';
    const cleanYear = year ? year.trim() : 's.d.';
    const cleanTitle = title.trim();
    const cleanPub = publisher ? publisher.trim() : '';

    if (style === 'APA') {
      citation = cleanAuthor + '. (' + cleanYear + '). ' + cleanTitle + '.' + (cleanPub ? ' ' + cleanPub + '.' : '') + (url ? ' Récupéré de ' + url : '');
    } else if (style === 'MLA') {
      citation = cleanAuthor + '. "' + cleanTitle + '." ' + (cleanPub ? cleanPub + ', ' : '') + cleanYear + '.' + (url ? ' ' + url : '');
    } else if (style === 'Chicago') {
      citation = cleanAuthor + '. "' + cleanTitle + '." ' + (cleanPub ? cleanPub + ', ' : '') + cleanYear + '.';
    }

    setGenerated(citation);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
    alert("Citation copiée dans le presse-papiers !");
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📚 Générateur de Citations Bibliographiques
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Formatez instantanément vos citations académiques selon les normes APA, MLA ou Chicago.
          </p>
        </div>
        <FolderButton toolId="citation_generator" toolName="CitationsGenerateur" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Output Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12, color: 'white' }}>Citation Générée</h2>
            <div style={{ 
              padding: 20, 
              backgroundColor: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-light)', 
              borderRadius: 8,
              minHeight: 80,
              fontSize: '1.05rem',
              color: generated ? 'white' : 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              {generated || "Remplissez les champs de droite pour générer une citation bibliographique..."}
            </div>

            {generated && (
              <button onClick={copyToClipboard} className="btn-premium btn-primary" style={{ marginTop: 16, padding: '10px 16px', fontWeight: 'bold' }}>
                📋 Copier la citation
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Métadonnées du document</h3>
          <form onSubmit={generateCitation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Style de citation</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value="APA">APA (7e édition)</option>
                <option value="MLA">MLA (9e édition)</option>
                <option value="Chicago">Chicago Author-Date</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auteur (Nom, Prénom)</label>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-premium" placeholder="Tremblay, Jean" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Titre du document / de l'article</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-premium" required placeholder="Les algorithmes locaux de traitement" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Éditeur / Revue</label>
              <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} className="input-premium" placeholder="Presses de l'Université Laval" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Année de publication</label>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} className="input-premium" placeholder="2025" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>URL / DOI (Facultatif)</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-premium" placeholder="https://example.com/article" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Générer la citation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}