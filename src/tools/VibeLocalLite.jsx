import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * VibeLocal (édition locale) — lecteur de musique 100 % local & hors-ligne.
 * Importe tes propres fichiers audio, crée des playlists, lecture continue /
 * aléatoire / répétition. Aucune connexion, aucun serveur, aucune donnée envoyée.
 * Les préférences et la structure des playlists sont mémorisées dans le navigateur
 * (les fichiers audio sont à réimporter à chaque session — limite du 100 % local).
 */

const LS_KEY = 'vibelocal_lite_v1';
const fmt = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

export default function VibeLocalLite() {
  const [library, setLibrary] = useState([]); // {id,name,url}
  const [currentId, setCurrentId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('all'); // 'off' | 'one' | 'all'
  const [playlists, setPlaylists] = useState({}); // {name: [trackName,...]}
  const [active, setActive] = useState('Toutes les pistes');
  const audioRef = useRef(null);
  const fileRef = useRef(null);

  // ---- persistance préférences + structure playlists (pas les fichiers) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.volume === 'number') setVolume(d.volume);
        if (typeof d.shuffle === 'boolean') setShuffle(d.shuffle);
        if (d.repeat) setRepeat(d.repeat);
        if (d.playlists) setPlaylists(d.playlists);
      }
    } catch (e) { /* localStorage corrompu : on ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ volume, shuffle, repeat, playlists }));
    } catch (e) { /* quota/file:// : on ignore */ }
  }, [volume, shuffle, repeat, playlists]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const visible = active === 'Toutes les pistes'
    ? library
    : library.filter((t) => (playlists[active] || []).includes(t.name));
  const current = library.find((t) => t.id === currentId) || null;

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac|opus)$/i.test(f.name));
    if (!files.length) return;
    const added = files.map((f) => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, name: f.name, url: URL.createObjectURL(f) }));
    setLibrary((prev) => {
      const next = [...prev];
      added.forEach((a) => { if (!next.some((t) => t.name === a.name)) next.push(a); });
      return next;
    });
    if (active !== 'Toutes les pistes') {
      setPlaylists((p) => ({ ...p, [active]: Array.from(new Set([...(p[active] || []), ...added.map((a) => a.name)])) }));
    }
    if (!currentId && added.length) setCurrentId(added[0].id);
  };

  const playId = (id) => { setCurrentId(id); setPlaying(true); };
  const togglePlay = () => { if (!current) return; setPlaying((p) => !p); };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, currentId]);

  const indexInView = visible.findIndex((t) => t.id === currentId);
  const go = useCallback((dir) => {
    if (!visible.length) return;
    let i = indexInView;
    if (shuffle) {
      if (visible.length === 1) i = 0;
      else { let r = i; while (r === i) r = Math.floor(Math.random() * visible.length); i = r; }
    } else {
      i = indexInView + dir;
      if (i < 0) i = visible.length - 1;
      if (i >= visible.length) i = 0;
    }
    setCurrentId(visible[i].id); setPlaying(true);
  }, [visible, indexInView, shuffle]);

  const onEnded = () => {
    if (repeat === 'one') { const a = audioRef.current; if (a) { a.currentTime = 0; a.play(); } return; }
    if (!shuffle && repeat === 'off' && indexInView === visible.length - 1) { setPlaying(false); return; }
    go(1);
  };

  const newPlaylist = () => {
    const name = (prompt('Nom de la nouvelle playlist :') || '').trim();
    if (!name || name === 'Toutes les pistes' || playlists[name]) return;
    setPlaylists((p) => ({ ...p, [name]: [] }));
    setActive(name);
  };
  const addToPlaylist = (track, name) => {
    if (name === 'Toutes les pistes') return;
    setPlaylists((p) => ({ ...p, [name]: Array.from(new Set([...(p[name] || []), track.name])) }));
  };
  const removeFromPlaylist = (track) => {
    if (active === 'Toutes les pistes') return;
    setPlaylists((p) => ({ ...p, [active]: (p[active] || []).filter((n) => n !== track.name) }));
  };
  const deletePlaylist = (name) => {
    if (name === 'Toutes les pistes') return;
    setPlaylists((p) => { const c = { ...p }; delete c[name]; return c; });
    if (active === name) setActive('Toutes les pistes');
  };

  return (
    <div className="vlite">
      <style>{`
        .vlite{color:#eaf2fb;max-width:1100px;margin:0 auto}
        .vlite h1{font-size:1.6rem;margin:0 0 4px}
        .vlite .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .vlite-grid{display:grid;grid-template-columns:240px 1fr;gap:18px}
        .vlite-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px}
        .vlite-pl{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 11px;border-radius:10px;cursor:pointer;font-size:.9rem}
        .vlite-pl:hover{background:rgba(255,255,255,.07)}
        .vlite-pl.on{background:rgba(91,157,255,.22);border:1px solid rgba(91,157,255,.5)}
        .vlite-pl small{color:#9fb6cf}
        .vlite-x{opacity:.5;cursor:pointer;font-size:.8rem}
        .vlite-x:hover{opacity:1;color:#ff8a8a}
        .vlite-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .vlite-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .vlite-track{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer}
        .vlite-track:hover{background:rgba(255,255,255,.06)}
        .vlite-track.on{background:rgba(91,157,255,.18)}
        .vlite-track .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.92rem}
        .vlite-track .pi{color:#5b9dff}
        .vlite-bar{position:sticky;bottom:0;margin-top:18px;background:rgba(10,22,40,.92);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .vlite-ctrls button{background:none;border:none;color:#eaf2fb;font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px}
        .vlite-ctrls button:hover{background:rgba(255,255,255,.1)}
        .vlite-ctrls .main{font-size:1.5rem}
        .vlite-ctrls .on{color:#ffae3b}
        .vlite-seek{flex:1;min-width:180px;display:flex;align-items:center;gap:8px;font-size:.78rem;color:#9fb6cf}
        .vlite input[type=range]{accent-color:#ff8a3b;width:100%}
        .vlite-empty{text-align:center;color:#9fb6cf;padding:40px 10px;font-size:.92rem}
        @media(max-width:760px){.vlite-grid{grid-template-columns:1fr}.vlite-bar{gap:8px}}
      `}</style>

      <h1>🎧 Lecteur de musique local</h1>
      <p className="sub">100 % local & hors-ligne — importe tes fichiers, crée des playlists. Rien n'est envoyé sur Internet.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="vlite-btn" onClick={() => fileRef.current?.click()}>＋ Importer de la musique</button>
        <button className="vlite-btn ghost" onClick={newPlaylist}>＋ Nouvelle playlist</button>
        <input ref={fileRef} type="file" accept="audio/*" multiple style={{ display: 'none' }}
               onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="vlite-grid">
        <div className="vlite-pane">
          {['Toutes les pistes', ...Object.keys(playlists)].map((name) => (
            <div key={name} className={`vlite-pl ${active === name ? 'on' : ''}`} onClick={() => setActive(name)}>
              <span>{name === 'Toutes les pistes' ? '🎵 ' : '📂 '}{name}<br /><small>{name === 'Toutes les pistes' ? library.length : (playlists[name] || []).length} piste(s)</small></span>
              {name !== 'Toutes les pistes' && <span className="vlite-x" title="Supprimer la playlist" onClick={(e) => { e.stopPropagation(); deletePlaylist(name); }}>✕</span>}
            </div>
          ))}
        </div>

        <div className="vlite-pane">
          {visible.length === 0 ? (
            <div className="vlite-empty">Aucune piste ici. Clique « Importer de la musique » pour commencer.</div>
          ) : visible.map((t) => (
            <div key={t.id} className={`vlite-track ${t.id === currentId ? 'on' : ''}`} onDoubleClick={() => playId(t.id)}>
              <span className="pi">{t.id === currentId && playing ? '▶' : '♪'}</span>
              <span className="nm" onClick={() => playId(t.id)} title={t.name}>{t.name}</span>
              {active === 'Toutes les pistes' && Object.keys(playlists).length > 0 && (
                <select className="vlite-btn ghost" style={{ padding: '4px 6px', fontSize: '.75rem' }} value=""
                        onChange={(e) => { addToPlaylist(t, e.target.value); e.target.value = ''; }}>
                  <option value="">+ Playlist…</option>
                  {Object.keys(playlists).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              {active !== 'Toutes les pistes' && <span className="vlite-x" onClick={() => removeFromPlaylist(t)} title="Retirer">✕</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="vlite-bar">
        <div className="vlite-ctrls" style={{ display: 'flex', alignItems: 'center' }}>
          <button className={shuffle ? 'on' : ''} title="Aléatoire" onClick={() => setShuffle((s) => !s)}>🔀</button>
          <button title="Précédent" onClick={() => go(-1)}>⏮</button>
          <button className="main" title="Lecture / Pause" onClick={togglePlay}>{playing ? '⏸' : '▶️'}</button>
          <button title="Suivant" onClick={() => go(1)}>⏭</button>
          <button className={repeat !== 'off' ? 'on' : ''} title={`Répéter: ${repeat}`}
                  onClick={() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))}>
            {repeat === 'one' ? '🔂' : '🔁'}
          </button>
        </div>
        <div className="vlite-seek">
          <span>{fmt(progress)}</span>
          <input type="range" min="0" max={duration || 0} step="0.1" value={progress}
                 onChange={(e) => { const a = audioRef.current; if (a) { a.currentTime = Number(e.target.value); setProgress(Number(e.target.value)); } }} />
          <span>{fmt(duration)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 130 }}>
          <span title="Volume">🔊</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </div>
        <div style={{ flexBasis: '100%', fontSize: '.85rem', color: '#9fb6cf', textAlign: 'center' }}>
          {current ? `▶ ${current.name}` : 'Aucune piste sélectionnée'}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={current ? current.url : undefined}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={onEnded}
      />
    </div>
  );
}
