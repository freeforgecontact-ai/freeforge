import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function SteamLibrarySorter({ goBack }) {
  const [games, setGames] = useState(() => {
    try {
      const val = localStorage.getItem('fg_backlog');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      console.error("Erreur lors de la lecture de fg_backlog:", e);
      return [];
    }
  });
  
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('todo'); // 'todo', 'playing', 'done'
  const [pickedGame, setPickedGame] = useState(null);

  useEffect(() => {
    localStorage.setItem('fg_backlog', JSON.stringify(games));
  }, [games]);

  const handleAddGame = (e) => {
    e.preventDefault();
    if (!title) return;
    const newGame = {
      id: Date.now().toString(),
      title,
      status
    };
    setGames([...games, newGame]);
    setTitle('');
  };

  const handlePickGame = () => {
    const todoGames = games.filter(g => g.status === 'todo');
    if (todoGames.length === 0) {
      alert("Aucun jeu 'À faire' dans votre backlog !");
      return;
    }
    const idx = Math.floor(Math.random() * todoGames.length);
    setPickedGame(todoGames[idx]);
  };

  const handleDelete = (id) => {
    setGames(games.filter(g => g.id !== id));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "steam_backlog.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Titre,Statut\n";
    games.forEach(g => {
      const escapedTitle = g.title.replace(/"/g, '""');
      csvContent += `${g.id},"${escapedTitle}",${g.status}\n`;
    });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "steam_backlog.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const clean = parsed.map(item => ({
              id: item.id || Date.now().toString() + Math.random(),
              title: item.title || 'Jeu sans nom',
              status: ['todo', 'playing', 'done'].includes(item.status) ? item.status : 'todo'
            }));
            setGames([...games, ...clean]);
            alert(`${clean.length} jeux importés avec succès !`);
          } else {
            alert("Format JSON invalide. Doit être un tableau.");
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          const imported = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts.length >= 2) {
              const id = parts[0].replace(/"/g, '') || Date.now().toString() + Math.random();
              const title = parts[1].replace(/"/g, '');
              const status = parts[2] ? parts[2].replace(/"/g, '').trim() : 'todo';
              imported.push({ id, title, status: ['todo', 'playing', 'done'].includes(status) ? status : 'todo' });
            }
          }
          if (imported.length > 0) {
            setGames([...games, ...imported]);
            alert(`${imported.length} jeux importés depuis le CSV avec succès !`);
          } else {
            alert("Aucun jeu valide trouvé dans le CSV.");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture ou du parsing du fichier.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎮 Steam Backlog Manager</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Saisie et gestion manuelle de votre bibliothèque Steam locale. Planifiez vos jeux à finir et choisissez votre prochaine aventure.
          </p>
        </div>
        <FolderButton toolId="steam_sorter" toolName="SteamLibrarySorter" localStorageKeys={['fg_backlog']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleAddGame} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Ajouter un jeu</h2>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du jeu" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
              <option value="todo">À faire</option>
              <option value="playing">En cours</option>
              <option value="done">Terminé</option>
            </select>
            <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>Ajouter</button>
          </form>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Sélecteur Aléatoire</h2>
            <button onClick={handlePickGame} className="btn-premium btn-primary" style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', backgroundColor: '#8b5cf6' }}>🎲 Choisir pour moi</button>
            {pickedGame && (
              <div style={{ padding: 12, backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, textAlign: 'center', marginTop: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase' }}>Prochaine cible :</span>
                <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: 'bold', marginTop: 4 }}>{pickedGame.title}</div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Backlog ({games.length})</h2>
            <div style={{ display: 'flex', gap: 8 }} className="no-print">
              <button onClick={handleExportJSON} className="btn-premium btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} title="Exporter au format JSON">
                📥 JSON
              </button>
              <button onClick={handleExportCSV} className="btn-premium btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} title="Exporter au format CSV">
                📥 CSV
              </button>
              <label className="btn-premium btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} title="Importer JSON ou CSV">
                📤 Importer
                <input type="file" accept=".json,.csv" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {games.length > 0 ? games.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>{g.title}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontWeight: 'bold',
                    backgroundColor: g.status === 'done' ? '#10b981' : g.status === 'playing' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    color: g.status === 'done' || g.status === 'playing' ? 'black' : 'var(--text-muted)'
                  }}>
                    {g.status === 'done' ? 'Fini' : g.status === 'playing' ? 'En cours' : 'À faire'}
                  </span>
                  <button onClick={() => handleDelete(g.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem' }}>✕</button>
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Votre backlog est vide.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}