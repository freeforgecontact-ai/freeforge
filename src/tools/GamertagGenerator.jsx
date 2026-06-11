import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function GamertagGenerator({ goBack }) {
  const [genre, setGenre] = useState('fantasy');
  const [tags, setTags] = useState([]);

  const prefix = {
    fantasy: ['Elfe', 'Thor', 'Gorn', 'Odin', 'Aron', 'Merlin', 'Rune', 'Vald'],
    cyber: ['Neo', 'Byte', 'Sync', 'Cyber', 'Matrix', 'Nexus', 'Pixel', 'Net'],
    retro: ['Retro', '8Bit', 'Arcade', 'Pixel', 'Chiptune', 'Vectrex', 'Atari'],
    scifi: ['Astro', 'Nova', 'Cosmo', 'Void', 'Galaxy', 'Quasar', 'Solar', 'Pulse']
  };

  const suffix = {
    fantasy: ['Ombre', 'Lame', 'Flèche', 'Roc', 'Feu', 'Foudre', 'Glace', 'Druide'],
    cyber: ['Runner', 'Hack', 'Glitch', 'Wire', 'Code', 'Core', 'Vortex', 'Grid'],
    retro: ['Player', 'Sprite', 'Console', 'Joy', 'Retro', 'Wave', 'Ghost'],
    scifi: ['Rider', 'Nova', 'Orb', 'Storm', 'Beam', 'Warp', 'Rover', 'Core']
  };

  const deco = ['★', 'xX_', '_Xx', '彡', '⚡', '✦', 'ツ', ''];

  const handleGenerate = () => {
    const generated = [];
    for (let i = 0; i < 6; i++) {
      const p = prefix[genre][Math.floor(Math.random() * prefix[genre].length)];
      const s = suffix[genre][Math.floor(Math.random() * suffix[genre].length)];
      const d = deco[Math.floor(Math.random() * deco.length)];
      generated.push(d ? `${d}${p}${s}${d}` : `${p}${s}`);
    }
    setTags(generated);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>👾 Gamertag & Clan Name Generator</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Générez des pseudos stylisés pour vos jeux et guildes.</p>
        </div>
        <FolderButton toolId="gamertag" toolName="GamertagGenerator" />
      </div>

      <div className="glass-panel" style={{ padding: 24, borderRadius: 16, maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Genre du jeu :</label>
          <select value={genre} onChange={e => setGenre(e.target.value)} className="input-premium" style={{ width: '100%', padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}>
            <option value="fantasy">Médiéval / Fantasy</option>
            <option value="cyber">Cyberpunk / Hack</option>
            <option value="scifi">Sci-Fi / Spatial</option>
            <option value="retro">Rétro / 8-Bit</option>
          </select>
        </div>

        <button onClick={handleGenerate} className="btn-premium btn-primary" style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>🎲 Générer des Pseudos</button>

        {tags.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {tags.map((t, idx) => (
              <div key={idx} onClick={() => { navigator.clipboard.writeText(t); alert(`Pseudo copié : ${t}`); }} style={{ padding: 12, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8, color: 'white', fontFamily: 'monospace', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-scale" title="Cliquer pour copier">
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}