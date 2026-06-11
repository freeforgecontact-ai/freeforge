import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function BulkRenamer({ goBack }) {
  const [fileList, setFileList] = useState([]);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [caseRule, setCaseRule] = useState('preserve'); // preserve, lowercase, uppercase, capitalize
  const [startIndex, setStartIndex] = useState('');
  const [indexPadding, setIndexPadding] = useState('2'); // pad width: 0, 1, 2, 3
  
  // Parse imported files
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file, idx) => {
      const dotIndex = file.name.lastIndexOf('.');
      return {
        id: idx + Date.now(),
        originalName: dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name,
        extension: dotIndex !== -1 ? file.name.substring(dotIndex) : '',
        newName: file.name
      };
    });
    setFileList(prev => [...prev, ...newFiles]);
  };

  // Add dummy files for demo/utility testing
  const addDemoFiles = () => {
    const demos = [
      { id: 1, originalName: 'vacation_photo_01', extension: '.jpg' },
      { id: 2, originalName: 'vacation_photo_02', extension: '.jpg' },
      { id: 3, originalName: 'vacation_photo_03', extension: '.jpg' },
      { id: 4, originalName: 'invoice_2026_draft', extension: '.pdf' },
      { id: 5, originalName: 'invoice_2026_final', extension: '.pdf' }
    ];
    setFileList(prev => [...prev, ...demos]);
  };

  const clearFiles = () => {
    setFileList([]);
  };

  // Apply renaming rules dynamically
  useEffect(() => {
    setFileList(prev => prev.map((file, index) => {
      let name = file.originalName;

      // 1. Find and Replace
      if (findText) {
        if (useRegex) {
          try {
            const rx = new RegExp(findText, 'g');
            name = name.replace(rx, replaceText);
          } catch (e) {
            // Invalid regex, skip replace
          }
        } else {
          name = name.replaceAll(findText, replaceText);
        }
      }

      // 2. Case Rule
      if (caseRule === 'lowercase') {
        name = name.toLowerCase();
      } else if (caseRule === 'uppercase') {
        name = name.toUpperCase();
      } else if (caseRule === 'capitalize') {
        name = name.split(/[\s_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      }

      // 3. Prefix & Suffix
      name = prefix + name + suffix;

      // 4. Indexing / Auto-increment
      if (startIndex !== '') {
        const start = parseInt(startIndex) || 0;
        const numStr = String(start + index).padStart(parseInt(indexPadding) || 0, '0');
        name = `${name}_${numStr}`;
      }

      return {
        ...file,
        newName: name + file.extension
      };
    }));
  }, [findText, replaceText, useRegex, prefix, suffix, caseRule, startIndex, indexPadding, fileList.length]);

  // Export PowerShell script to rename locally
  const exportPowerShell = () => {
    if (fileList.length === 0) return;
    
    let scriptContent = `# Script PowerShell pour renommer vos fichiers locaux\n`;
    scriptContent += `# Placez ce script dans le dossier contenant les fichiers et executez-le.\n\n`;
    
    fileList.forEach(file => {
      const oldFull = file.originalName + file.extension;
      const newFull = file.newName;
      if (oldFull !== newFull) {
        scriptContent += `if (Test-Path "${oldFull}") { Rename-Item "${oldFull}" "${newFull}" }\n`;
      }
    });

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rename_files.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export BAT script to rename locally
  const exportBatch = () => {
    if (fileList.length === 0) return;
    
    let scriptContent = `:: Script Batch (.bat) pour renommer vos fichiers locaux\n`;
    scriptContent += `@echo off\nchcp 65001 > nul\n\n`;
    
    fileList.forEach(file => {
      const oldFull = file.originalName + file.extension;
      const newFull = file.newName;
      if (oldFull !== newFull) {
        scriptContent += `if exist "${oldFull}" ren "${oldFull}" "${newFull}"\n`;
      }
    });

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rename_files.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Renommeur de Fichiers en Lot</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configurez vos règles de renommage et générez un script d'exécution local en un clic.</p>
        </div>
        <FolderButton toolId="bulk_renamer" toolName="Renommeur en Lot" />
      </div>

      <div className="grid-2">
        {/* Left Column: Rename Rules */}
        <div className="card-premium" style={{ gap: 18 }}>
          <h2 className="card-title">Paramètres de renommage</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Find & Replace */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Texte à chercher :</label>
                <input 
                  type="text" 
                  value={findText} 
                  onChange={(e) => setFindText(e.target.value)} 
                  className="input-premium"
                  placeholder="ex: vacation"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Remplacer par :</label>
                <input 
                  type="text" 
                  value={replaceText} 
                  onChange={(e) => setReplaceText(e.target.value)} 
                  className="input-premium"
                  placeholder="ex: voyage"
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={useRegex} 
                onChange={(e) => setUseRegex(e.target.checked)} 
              />
              Utiliser des Expressions Régulières (Regex)
            </label>

            {/* Prefix & Suffix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Préfixe :</label>
                <input 
                  type="text" 
                  value={prefix} 
                  onChange={(e) => setPrefix(e.target.value)} 
                  className="input-premium"
                  placeholder="ex: PGRG_"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Suffixe :</label>
                <input 
                  type="text" 
                  value={suffix} 
                  onChange={(e) => setSuffix(e.target.value)} 
                  className="input-premium"
                  placeholder="ex: _2026"
                />
              </div>
            </div>

            {/* Case formatting */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Format de la casse :
              </label>
              <select 
                value={caseRule} 
                onChange={(e) => setCaseRule(e.target.value)} 
                className="input-premium select-premium"
              >
                <option value="preserve">Conserver la casse d'origine</option>
                <option value="lowercase">tout en minuscules (ex. image.jpg)</option>
                <option value="uppercase">TOUT EN MAJUSCULES (EX. IMAGE.JPG)</option>
                <option value="capitalize">Première Lettre En Majuscule</option>
              </select>
            </div>

            {/* Auto Indexing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Index de début (Optionnel) :</label>
                <input 
                  type="number" 
                  value={startIndex} 
                  onChange={(e) => setStartIndex(e.target.value)} 
                  className="input-premium"
                  placeholder="ex: 1"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Remplissage de zéros (Padding) :</label>
                <select 
                  value={indexPadding} 
                  onChange={(e) => setIndexPadding(e.target.value)} 
                  className="input-premium select-premium"
                  disabled={startIndex === ''}
                >
                  <option value="1">Aucun (1, 2, 3)</option>
                  <option value="2">2 caractères (01, 02)</option>
                  <option value="3">3 caractères (001, 002)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Files List & Preview */}
        <div className="card-premium" style={{ gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Fichiers à renommer ({fileList.length})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addDemoFiles} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                💡 Fichiers démo
              </button>
              <button onClick={clearFiles} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}>
                🗑️ Vider
              </button>
            </div>
          </div>

          <label className="btn-premium btn-secondary" style={{ justifyContent: 'center', cursor: 'pointer', padding: '16px 20px', border: '1px dashed var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
            📁 Importer des fichiers à renommer
            <input type="file" multiple onChange={handleFilesSelect} style={{ display: 'none' }} />
          </label>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {fileList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Aucun fichier importé. Sélectionnez des fichiers locaux ou cliquez sur "Fichiers démo".
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>Nom Original</th>
                      <th style={{ padding: '8px 12px', color: 'var(--accent)' }}>Nouveau Nom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileList.map((file) => (
                      <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 180 }}>
                          {file.originalName + file.extension}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#34d399', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 180 }}>
                          {file.newName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {fileList.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button onClick={exportPowerShell} className="btn-premium btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px 14px' }}>
                ⚡ Exécutable PowerShell (.ps1)
              </button>
              <button onClick={exportBatch} className="btn-premium btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px 14px' }}>
                ⚡ Script CMD/Batch (.bat)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
