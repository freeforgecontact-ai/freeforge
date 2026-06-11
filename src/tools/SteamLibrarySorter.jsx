import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function SteamLibrarySorter({ goBack }) {
  const [games, setGames] = useState(() => {
    const val = localStorage.getItem('fg_backlog');
    return val ? JSON.parse(val) : [];
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

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🎮 Steam Backlog Manager</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gérez vos jeux à finir et choisissez votre prochaine aventure.</p>
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Backlog ({games.length})</h2>
          
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