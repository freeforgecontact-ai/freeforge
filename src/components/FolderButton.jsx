import React, { useState } from 'react';

export default function FolderButton({ toolId, toolName, localStorageKeys = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleOpenFolder = async () => {
    try {
      const res = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: toolId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error('Not connected');
      }
    } catch (err) {
      // Server not active or connection failed -> open offline modal
      setShowModal(true);
    }
  };

  const handleExportData = () => {
    if (localStorageKeys.length === 0) return;
    const exportData = {};
    localStorageKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          exportData[key] = JSON.parse(val);
        } catch (e) {
          exportData[key] = val;
        }
      }
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `freeforge_${toolId}_backup.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        let count = 0;
        Object.keys(imported).forEach(key => {
          if (localStorageKeys.includes(key)) {
            const val = typeof imported[key] === 'string' ? imported[key] : JSON.stringify(imported[key]);
            localStorage.setItem(key, val);
            count++;
          }
        });
        if (count > 0) {
          alert("Données importées avec succès ! L'application va se recharger.");
          window.location.reload();
        } else {
          alert("Aucune donnée compatible trouvée dans ce fichier.");
        }
      } catch (err) {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleClearData = () => {
    if (confirm(`Voulez-vous vraiment réinitialiser toutes les données locales de l'outil "${toolName}" ? Cette action est irréversible.`)) {
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      alert("Données réinitialisées ! L'application va se recharger.");
      window.location.reload();
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <>
      <button 
        type="button" 
        className="btn-premium btn-secondary no-print" 
        onClick={handleOpenFolder}
        style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}
        title="Ouvrir le dossier local sur PC ou gérer les données sur mobile"
      >
        📁 Dossier Local
      </button>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} className="no-print">
          <div style={{ width: '100%', maxWidth: 460, backgroundColor: '#101018', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, color: '#f3f4f6', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                📁 Gestionnaire de Données Locales
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700, letterSpacing: 1 }}>
                {toolName}
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, width: 'fit-content', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                Mode Mobile / Autonome (Hors-ligne)
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Le serveur PC FreeForge n'est pas connecté. Vos données sont actuellement sauvegardées de manière sécurisée <strong>directement dans votre navigateur</strong>.
            </p>

            {localStorageKeys.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Clés de stockage de l'outil :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {localStorageKeys.map(key => {
                    const hasVal = localStorage.getItem(key) !== null;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ color: '#8b5cf6', cursor: 'pointer' }} onClick={() => handleCopyKey(key)} title="Copier la clé">
                          {key} {copiedKey === key ? '✓' : '📋'}
                        </span>
                        <span style={{ color: hasVal ? '#10b981' : 'var(--text-muted)', fontWeight: 'bold' }}>
                          {hasVal ? 'Présente' : 'Vide'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  <button 
                    onClick={handleExportData} 
                    className="btn-premium btn-secondary" 
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', borderRadius: 8, justifyContent: 'center' }}
                  >
                    📤 Exporter (Sauvegarder)
                  </button>
                  <label 
                    className="btn-premium btn-secondary" 
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', borderRadius: 8, justifyContent: 'center', cursor: 'pointer' }}
                  >
                    📥 Importer (Restaurer)
                    <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
                  </label>
                </div>

                <button 
                  onClick={handleClearData} 
                  className="btn-premium" 
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.8rem', borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 'bold', justifyContent: 'center', marginTop: 4 }}
                >
                  🗑️ Réinitialiser (Tout effacer)
                </button>
              </div>
            ) : (
              <div style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                Cet outil ne stocke aucune donnée persistante dans le stockage du navigateur.
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <strong>Note PC :</strong> Dès que vous démarrez le serveur PC (<code>node dev.js</code>), ce bouton ouvre directement le dossier de documents <code>D:\FreeForge\{toolName.replace(/[^a-zA-Z0-9]/g, '')}</code> sous Windows.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn-premium btn-primary" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 8 }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
