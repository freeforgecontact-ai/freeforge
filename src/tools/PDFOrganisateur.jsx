import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import FolderButton from '../components/FolderButton';

export default function PDFOrganisateur({ goBack }) {
  const [files, setFiles] = useState([]);
  const [log, setLog] = useState('');
  const [splitRange, setSplitRange] = useState('1-2');
  const [selectedFileId, setSelectedFileId] = useState('');

  const handleFileChange = async (e) => {
    const uploaded = Array.from(e.target.files);
    const newFiles = [];

    setLog(prev => prev + `Chargement de ${uploaded.length} fichier(s)...\n`);

    for (const file of uploaded) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        newFiles.push({
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + ' Mo',
          pages: pageCount,
          arrayBuffer: arrayBuffer
        });

        setLog(prev => prev + `Chargé : ${file.name} (${pageCount} pages)\n`);
      } catch (err) {
        console.error(err);
        setLog(prev => prev + `Erreur lors de la lecture de ${file.name} (le fichier est peut-être corrompu ou protégé).\n`);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...newFiles];
        // Default select the first file if none selected
        if (!selectedFileId && updated.length > 0) {
          setSelectedFileId(updated[0].id);
        }
        return updated;
      });
    }
  };

  const handleClear = () => {
    setFiles([]);
    setSelectedFileId('');
    setLog('Liste nettoyée.\n');
  };

  const executeMerge = async () => {
    if (files.length < 2) {
      alert("Veuillez importer au moins 2 PDF pour les fusionner.");
      return;
    }

    try {
      setLog(prev => prev + `Début de la fusion de ${files.length} fichiers PDF...\n`);
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const srcDoc = await PDFDocument.load(file.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'merged_document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLog(prev => prev + 'Fusion réussie ! merged_document.pdf téléchargé.\n');
    } catch (err) {
      console.error(err);
      setLog(prev => prev + `Erreur de fusion : ${err.message}\n`);
      alert("Une erreur est survenue lors de la fusion.");
    }
  };

  const executeSplit = async () => {
    const selectedFile = files.find(f => f.id === selectedFileId);
    if (!selectedFile) {
      alert("Veuillez sélectionner un fichier PDF à découper.");
      return;
    }

    try {
      setLog(prev => prev + `Découpage du fichier : ${selectedFile.name} (plage: ${splitRange})...\n`);
      const srcDoc = await PDFDocument.load(selectedFile.arrayBuffer);
      const totalPages = selectedFile.pages;

      // Parse range string (e.g., "1-2, 4, 6-8")
      const pageIndices = [];
      const parts = splitRange.split(',');

      for (const part of parts) {
        const cleanPart = part.trim();
        if (cleanPart.includes('-')) {
          const [startStr, endStr] = cleanPart.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
            throw new Error(`Plage invalide : "${cleanPart}"`);
          }
          for (let i = start; i <= end; i++) {
            pageIndices.push(i - 1); // convert to 0-indexed
          }
        } else {
          const pageNum = parseInt(cleanPart, 10);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
            throw new Error(`Page invalide : "${cleanPart}"`);
          }
          pageIndices.push(pageNum - 1);
        }
      }

      if (pageIndices.length === 0) {
        alert("Aucune page spécifiée à extraire.");
        return;
      }

      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const splitPdfBytes = await splitPdf.save();
      const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `extracted_${selectedFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLog(prev => prev + `Découpage réussi ! Fichier extrait téléchargé sous : extracted_${selectedFile.name}\n`);
    } catch (err) {
      console.error(err);
      setLog(prev => prev + `Erreur lors du découpage : ${err.message}\n`);
      alert(`Erreur : ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📄 PDF Local Organizer & Merge
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Visualisez, réorganisez, fusionnez ou découpez vos fichiers PDF localement à 100% sans aucun serveur.
          </p>
        </div>
        <FolderButton toolId="pdf_organizer" toolName="PDFOrganisateur" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Queue of files */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Fichiers Importés</h2>
            {files.length > 0 && (
              <button onClick={handleClear} className="btn-premium" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                Vider la liste
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 10, color: 'var(--text-secondary)' }}>
                Glissez-déposez ou cliquez sur "Importer des PDF" à droite.
              </div>
            ) : (
              files.map(f => (
                <div 
                  key={f.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 12, 
                    backgroundColor: selectedFileId === f.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)', 
                    border: selectedFileId === f.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedFileId(f.id)}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {selectedFileId === f.id && <span style={{ color: 'var(--secondary)' }}>🎯</span>}
                      {f.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
                      Taille: {f.size} | Nombre de pages : {f.pages}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles(files.filter(item => item.id !== f.id));
                      if (selectedFileId === f.id) {
                        setSelectedFileId(files.length > 1 ? files.find(item => item.id !== f.id).id : '');
                      }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 6 }}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Importation</h3>
            <label style={{ display: 'block', padding: 16, border: '1px dashed var(--border-light)', borderRadius: 8, cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', hover: { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
              📥 Importer des fichiers PDF
              <input type="file" multiple accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Option 1 : Fusionner</h3>
            <button onClick={executeMerge} disabled={files.length < 2} className="btn-premium btn-primary" style={{ width: '100%', padding: 12, fontWeight: 'bold', justifyContent: 'center', gap: 8 }}>
              🔗 Fusionner tous les PDF ({files.length})
            </button>
            {files.length < 2 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                * Requiert au moins 2 fichiers importés.
              </span>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Option 2 : Découper / Extraire</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Fichier sélectionné :
                </label>
                <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>
                  {files.find(f => f.id === selectedFileId)?.name || '(Aucun sélectionné)'}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Plages à extraire (ex : 1-3, 5) :
                </label>
                <input 
                  type="text" 
                  value={splitRange} 
                  onChange={(e) => setSplitRange(e.target.value)} 
                  className="input-premium" 
                  placeholder="Ex : 1-2, 4" 
                  style={{ width: '100%' }}
                />
              </div>

              <button 
                onClick={executeSplit} 
                disabled={!selectedFileId} 
                className="btn-premium btn-secondary" 
                style={{ width: '100%', padding: 12, fontWeight: 'bold', justifyContent: 'center' }}
              >
                ✂️ Extraire la plage de pages
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Logs d'activité :</label>
            <pre style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', borderRadius: 8, height: 100, overflowY: 'auto', fontSize: '0.75rem', color: '#a7f3d0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {log || 'Prêt...\n'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}