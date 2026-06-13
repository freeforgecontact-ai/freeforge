import React, { useState, useEffect, useMemo } from 'react';

const LS_KEY = 'steam_backlog_v1';
const STATUSES = ['à jouer', 'en cours', 'terminé'];
const STATUS_COLOR = { 'à jouer': '#5b9dff', 'en cours': '#ffae3b', 'terminé': '#43d18a' };

export default function SteamBacklog({ goBack }) {
  const [games, setGames] = useState(() => {
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; }
    catch (e) { return []; }
  });
  const [name, setName] = useState('');
  const [status, setStatus] = useState('à jouer');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('tous');
  const [sort, setSort] = useState('nom');
  const [pick, setPick] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(games)); } catch (e) { /* quota/file:// */ }
  }, [games]);

  const addGame = () => {
    const nm = name.trim();
    if (!nm) return;
    const g = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: nm, status,
      hours: Math.max(0, parseFloat(hours) || 0),
      note: Math.min(10, Math.max(0, parseFloat(note) || 0)),
    };
    setGames((p) => [g, ...p]);
    setName(''); setHours(''); setNote(''); setStatus('à jouer');
  };
  const removeGame = (id) => setGames((p) => p.filter((g) => g.id !== id));
  const cycleStatus = (id) => setGames((p) => p.map((g) => g.id === id
    ? { ...g, status: STATUSES[(STATUSES.indexOf(g.status) + 1) % STATUSES.length] } : g));

  const stats = useMemo(() => {
    const byStatus = { 'à jouer': 0, 'en cours': 0, 'terminé': 0 };
    let totalHours = 0;
    games.forEach((g) => { byStatus[g.status] = (byStatus[g.status] || 0) + 1; totalHours += g.hours; });
    return { byStatus, totalHours, total: games.length };
  }, [games]);

  const visible = useMemo(() => {
    let list = filter === 'tous' ? games : games.filter((g) => g.status === filter);
    list = [...list].sort((a, b) => {
      if (sort === 'nom') return a.name.localeCompare(b.name);
      if (sort === 'heures') return b.hours - a.hours;
      if (sort === 'note') return b.note - a.note;
      return 0;
    });
    return list;
  }, [games, filter, sort]);

  const randomGame = () => {
    if (!games.length) return;
    const g = games[Math.floor(Math.random() * games.length)];
    setPick(g);
  };

  return (
    <div className="sbk">
      <style>{`
        .sbk{color:#eaf2fb;max-width:980px;margin:0 auto}
        .sbk h1{font-size:1.6rem;margin:0 0 4px}
        .sbk .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .sbk-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .sbk-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .sbk-btn:disabled{opacity:.45;cursor:not-allowed}
        .sbk-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .sbk-form{display:grid;grid-template-columns:2fr 1.2fr .8fr .8fr auto;gap:10px;align-items:end}
        .sbk-field{display:flex;flex-direction:column;gap:5px}
        .sbk-field label{font-size:.72rem;color:#9fb6cf;font-weight:600}
        .sbk input,.sbk select{background:rgba(10,22,40,.6);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:9px 10px;font-size:.88rem;width:100%}
        .sbk-stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
        .sbk-stat{flex:1;min-width:110px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;text-align:center}
        .sbk-stat b{display:block;font-size:1.3rem}
        .sbk-stat span{font-size:.72rem;color:#9fb6cf}
        .sbk-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
        .sbk-chip{padding:7px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eaf2fb;cursor:pointer;font-size:.82rem}
        .sbk-chip.on{background:rgba(91,157,255,.25);border-color:rgba(91,157,255,.6)}
        .sbk-row{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:8px}
        .sbk-row .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
        .sbk-tag{font-size:.72rem;padding:3px 9px;border-radius:14px;cursor:pointer;font-weight:700;white-space:nowrap}
        .sbk-meta{font-size:.78rem;color:#9fb6cf;white-space:nowrap}
        .sbk-x{opacity:.55;cursor:pointer;font-size:.95rem;background:none;border:none;color:#ff8a8a}
        .sbk-x:hover{opacity:1}
        .sbk-empty{text-align:center;color:#9fb6cf;padding:36px 10px;font-size:.92rem}
        .sbk-pick{margin-top:6px;padding:14px;border-radius:12px;text-align:center;background:linear-gradient(135deg,rgba(255,122,24,.15),rgba(255,174,59,.12));border:1px solid rgba(255,174,59,.35)}
        @media(max-width:760px){.sbk-form{grid-template-columns:1fr 1fr}.sbk-form .sbk-field:first-child,.sbk-form>.sbk-btn{grid-column:1/-1}}
      `}</style>

      {goBack && <button className="sbk-btn ghost" onClick={goBack} style={{ marginBottom: 14 }}>← Retour</button>}
      <h1>🎮 Backlog de jeux</h1>
      <p className="sub">Gère ta pile de jeux à jouer — 100 % local, rien n'est envoyé sur Internet.</p>

      <div className="sbk-pane">
        <div className="sbk-form">
          <div className="sbk-field" style={{ gridColumn: '1' }}>
            <label>Nom du jeu</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Hollow Knight"
                   onKeyDown={(e) => e.key === 'Enter' && addGame()} />
          </div>
          <div className="sbk-field">
            <label>Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sbk-field">
            <label>Heures</label>
            <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" />
          </div>
          <div className="sbk-field">
            <label>Note /10</label>
            <input type="number" min="0" max="10" step="0.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="—" />
          </div>
          <button className="sbk-btn" onClick={addGame} disabled={!name.trim()}>＋ Ajouter</button>
        </div>
      </div>

      <div className="sbk-stats">
        <div className="sbk-stat"><b>{stats.total}</b><span>jeux au total</span></div>
        <div className="sbk-stat"><b style={{ color: STATUS_COLOR['à jouer'] }}>{stats.byStatus['à jouer']}</b><span>à jouer</span></div>
        <div className="sbk-stat"><b style={{ color: STATUS_COLOR['en cours'] }}>{stats.byStatus['en cours']}</b><span>en cours</span></div>
        <div className="sbk-stat"><b style={{ color: STATUS_COLOR['terminé'] }}>{stats.byStatus['terminé']}</b><span>terminés</span></div>
        <div className="sbk-stat"><b>{stats.totalHours.toFixed(1)}h</b><span>heures jouées</span></div>
      </div>

      <div className="sbk-toolbar">
        {['tous', ...STATUSES].map((f) => (
          <span key={f} className={`sbk-chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</span>
        ))}
        <span style={{ flex: 1 }} />
        <label style={{ fontSize: '.78rem', color: '#9fb6cf' }}>Tri :</label>
        <select className="sbk-chip" value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '7px 10px' }}>
          <option value="nom">Nom (A→Z)</option>
          <option value="heures">Heures (↓)</option>
          <option value="note">Note (↓)</option>
        </select>
        <button className="sbk-btn" onClick={randomGame} disabled={!games.length}>🎲 Choisis-moi un jeu</button>
      </div>

      {pick && (
        <div className="sbk-pick">
          <div style={{ fontSize: '.8rem', color: '#ffce8a' }}>Au hasard dans ton backlog :</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0' }}>🎯 {pick.name}</div>
          <div className="sbk-meta">{pick.status} · {pick.hours}h jouées{pick.note ? ` · ${pick.note}/10` : ''}</div>
        </div>
      )}

      <div className="sbk-pane">
        {visible.length === 0 ? (
          <div className="sbk-empty">Aucun jeu ici. Ajoute ton premier jeu ci-dessus !</div>
        ) : visible.map((g) => (
          <div key={g.id} className="sbk-row">
            <span className="nm" title={g.name}>{g.name}</span>
            <span className="sbk-tag" title="Cliquer pour changer le statut"
                  style={{ background: STATUS_COLOR[g.status] + '33', color: STATUS_COLOR[g.status], border: `1px solid ${STATUS_COLOR[g.status]}66` }}
                  onClick={() => cycleStatus(g.id)}>{g.status}</span>
            <span className="sbk-meta">{g.hours}h{g.note ? ` · ⭐ ${g.note}/10` : ''}</span>
            <button className="sbk-x" title="Supprimer" onClick={() => removeGame(g.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
