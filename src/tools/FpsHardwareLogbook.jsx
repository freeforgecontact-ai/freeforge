import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function FpsHardwareLogbook({ goBack }) {
  const [logs, setLogs] = useState(() => {
    const val = localStorage.getItem('fg_fps');
    return val ? JSON.parse(val) : [];
  });
  
  const [game, setGame] = useState('');
  const [avgFps, setAvgFps] = useState(120);
  const [lowFps, setLowFps] = useState(80);
  const [hardware, setHardware] = useState('');

  useEffect(() => {
    localStorage.setItem('fg_fps', JSON.stringify(logs));
  }, [logs]);

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!game || !hardware) return;
    const newLog = {
      id: Date.now().toString(),
      game,
      avgFps: parseInt(avgFps),
      lowFps: parseInt(lowFps),
      hardware,
      date: new Date().toLocaleDateString('fr-FR')
    };
    setLogs([newLog, ...logs]);
    setGame('');
  };

  const handleClear = () => {
    if (confirm("Effacer tout le journal ?")) {
      setLogs([]);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📊 FPS & Hardware Logbook</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enregistrez et comparez l'impact du matériel sur vos performances.</p>
        </div>
        <FolderButton toolId="fps_logbook" toolName="FpsHardwareLogbook" localStorageKeys={['fg_fps']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <form onSubmit={handleAddLog} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Nouveau test</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jeu :</label>
            <input type="text" required value={game} onChange={e => setGame(e.target.value)} placeholder="Ex: CS2, Cyberpunk" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Config Matérielle / Pilotes :</label>
            <input type="text" required value={hardware} onChange={e => setHardware(e.target.value)} placeholder="Ex: RTX 4070 - Driver 555.22" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FPS Moyen :</label>
              <input type="number" value={avgFps} onChange={e => setAvgFps(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>1% Low :</label>
              <input type="number" value={lowFps} onChange={e => setLowFps(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            </div>
          </div>

          <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', marginTop: 10 }}>💾 Enregistrer</button>
        </form>

        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Historique de Benchmarks</h2>
            {logs.length > 0 && <button onClick={handleClear} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6, color: '#ef4444' }}>Effacer tout</button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
            {logs.length > 0 ? logs.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>{l.game}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.hardware} - {l.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 800 }}>{l.avgFps} FPS</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moyenne</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', color: '#3b82f6', fontWeight: 800 }}>{l.lowFps} FPS</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1% Low</div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucun enregistrement de performance.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}