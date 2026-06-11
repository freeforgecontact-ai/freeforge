import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function TournamentBracket({ goBack }) {
  const [players, setPlayers] = useState(['Joueur 1', 'Joueur 2', 'Joueur 3', 'Joueur 4', 'Joueur 5', 'Joueur 6', 'Joueur 7', 'Joueur 8']);
  const [bracket, setBracket] = useState({
    q1: '', q2: '', q3: '', q4: '',
    s1: '', s2: '',
    final: ''
  });

  const handleUpdateBracket = (field, name) => {
    setBracket(prev => ({ ...prev, [field]: name }));
  };

  const handleReset = () => {
    setBracket({
      q1: '', q2: '', q3: '', q4: '',
      s1: '', s2: '',
      final: ''
    });
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🏆 Tournament Bracket Drawer</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Générez et gérez des arbres de tournois locaux.</p>
        </div>
        <FolderButton toolId="bracket" toolName="TournamentBracket" localStorageKeys={['fg_brackets']} />
      </div>

      <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Tableau des Scores (8 participants)</h2>
          <button onClick={handleReset} className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Mettre à zéro</button>
        </div>

        {/* Tree layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 200px 200px', gap: 16, alignItems: 'center', minHeight: 400, padding: 16, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          {/* Quarterfinals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => handleUpdateBracket('q1', players[0])} style={{ padding: 8, backgroundColor: bracket.q1 === players[0] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[0]}</div>
              <div onClick={() => handleUpdateBracket('q1', players[1])} style={{ padding: 8, backgroundColor: bracket.q1 === players[1] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[1]}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => handleUpdateBracket('q2', players[2])} style={{ padding: 8, backgroundColor: bracket.q2 === players[2] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[2]}</div>
              <div onClick={() => handleUpdateBracket('q2', players[3])} style={{ padding: 8, backgroundColor: bracket.q2 === players[3] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[3]}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => handleUpdateBracket('q3', players[4])} style={{ padding: 8, backgroundColor: bracket.q3 === players[4] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[4]}</div>
              <div onClick={() => handleUpdateBracket('q3', players[5])} style={{ padding: 8, backgroundColor: bracket.q3 === players[5] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[5]}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => handleUpdateBracket('q4', players[6])} style={{ padding: 8, backgroundColor: bracket.q4 === players[6] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[6]}</div>
              <div onClick={() => handleUpdateBracket('q4', players[7])} style={{ padding: 8, backgroundColor: bracket.q4 === players[7] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer' }}>{players[7]}</div>
            </div>
          </div>

          {/* Semifinals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 110 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => { if(bracket.q1) handleUpdateBracket('s1', bracket.q1) }} style={{ padding: 8, backgroundColor: bracket.s1 === bracket.q1 && bracket.q1 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.q1 || 'TBD'}</div>
              <div onClick={() => { if(bracket.q2) handleUpdateBracket('s1', bracket.q2) }} style={{ padding: 8, backgroundColor: bracket.s1 === bracket.q2 && bracket.q2 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.q2 || 'TBD'}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div onClick={() => { if(bracket.q3) handleUpdateBracket('s2', bracket.q3) }} style={{ padding: 8, backgroundColor: bracket.s2 === bracket.q3 && bracket.q3 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.q3 || 'TBD'}</div>
              <div onClick={() => { if(bracket.q4) handleUpdateBracket('s2', bracket.q4) }} style={{ padding: 8, backgroundColor: bracket.s2 === bracket.q4 && bracket.q4 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.q4 || 'TBD'}</div>
            </div>
          </div>

          {/* Finals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div onClick={() => { if(bracket.s1) handleUpdateBracket('final', bracket.s1) }} style={{ padding: 8, backgroundColor: bracket.final === bracket.s1 && bracket.s1 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.s1 || 'TBD'}</div>
            <div onClick={() => { if(bracket.s2) handleUpdateBracket('final', bracket.s2) }} style={{ padding: 8, backgroundColor: bracket.final === bracket.s2 && bracket.s2 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 6, cursor: 'pointer', minHeight: 34 }}>{bracket.s2 || 'TBD'}</div>
          </div>

          {/* Winner */}
          <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>VAINQUEUR</span>
            <div style={{ fontSize: '1.3rem', color: 'white', fontWeight: 'bold', marginTop: 6 }}>{bracket.final || 'TBD'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}