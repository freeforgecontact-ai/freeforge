import React, { useState, useEffect, useMemo } from 'react';

/**
 * JournalMood — journal intime + suivi d'humeur, 100 % local & hors-ligne.
 * Une entrée par jour (texte + humeur 1-5 sur échelle d'emojis), historique
 * par date et grille mensuelle colorée. Tout reste sur l'appareil (localStorage).
 */

const LS_KEY = 'journalmood_v1';
const MOODS = [
  { v: 1, e: '😣', label: 'Difficile', col: '#e25563' },
  { v: 2, e: '😕', label: 'Bof', col: '#e8924a' },
  { v: 3, e: '😐', label: 'Neutre', col: '#e8c84a' },
  { v: 4, e: '🙂', label: 'Bien', col: '#7bc86c' },
  { v: 5, e: '😄', label: 'Super', col: '#46b07a' },
];
const todayKey = () => new Date().toISOString().slice(0, 10);
const frDate = (k) => new Date(k + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function JournalMood({ goBack }) {
  const [entries, setEntries] = useState({}); // { 'YYYY-MM-DD': {mood, text} }
  const [text, setText] = useState('');
  const [mood, setMood] = useState(3);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setEntries(d || {});
        const t = (d || {})[todayKey()];
        if (t) { setText(t.text || ''); setMood(t.mood || 3); }
      }
    } catch (e) { /* localStorage indisponible : on ignore */ }
  }, []);

  const persist = (next) => {
    setEntries(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) { /* quota : on ignore */ }
  };

  const saveToday = () => {
    const next = { ...entries, [todayKey()]: { mood, text: text.trim() } };
    persist(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const removeEntry = (k) => {
    const next = { ...entries }; delete next[k]; persist(next);
    if (k === todayKey()) { setText(''); setMood(3); }
  };

  const history = useMemo(() => Object.keys(entries).sort((a, b) => b.localeCompare(a)), [entries]);

  const days = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const offset = (first.getDay() + 6) % 7; // lundi = 0
    const count = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= count; d++) cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    return cells;
  }, [cursor]);

  const moveMonth = (dir) => setCursor((c) => {
    let m = c.m + dir, y = c.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const moodOf = (k) => MOODS.find((x) => x.v === (entries[k] && entries[k].mood));

  return (
    <div className="jm">
      <style>{`
        .jm{color:#eaf2fb;max-width:920px;margin:0 auto;font-family:system-ui,sans-serif}
        .jm h1{font-size:1.55rem;margin:0 0 4px}
        .jm .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .jm-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px}
        .jm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .jm-card h2{font-size:1.05rem;margin:0 0 12px;color:#cfe0f5}
        .jm-moods{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
        .jm-mood{flex:1;min-width:62px;background:rgba(255,255,255,.06);border:2px solid transparent;border-radius:12px;padding:8px 4px;cursor:pointer;text-align:center;transition:.15s}
        .jm-mood .em{font-size:1.7rem;display:block}
        .jm-mood .lb{font-size:.68rem;color:#9fb6cf}
        .jm-mood.on{border-color:#ffae3b;background:rgba(255,174,59,.16)}
        .jm textarea{width:100%;box-sizing:border-box;min-height:96px;resize:vertical;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#eaf2fb;padding:11px;font-size:.92rem;font-family:inherit}
        .jm-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer;font-size:.92rem;margin-top:10px}
        .jm-ok{color:#7bc86c;font-size:.85rem;margin-left:10px}
        .jm-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .jm-cal-head button{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:1rem}
        .jm-cal-head strong{font-size:1rem;color:#cfe0f5}
        .jm-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
        .jm-dow{text-align:center;font-size:.7rem;color:#9fb6cf;padding-bottom:2px}
        .jm-cell{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;background:rgba(255,255,255,.04);position:relative}
        .jm-cell .dn{position:absolute;top:2px;left:4px;font-size:.6rem;color:rgba(255,255,255,.55)}
        .jm-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;font-size:.72rem;color:#9fb6cf}
        .jm-legend span{display:inline-flex;align-items:center;gap:4px}
        .jm-dot{width:11px;height:11px;border-radius:3px;display:inline-block}
        .jm-hist{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto}
        .jm-row{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:rgba(0,0,0,.18);border-radius:10px}
        .jm-row .he{font-size:1.4rem}
        .jm-row .hd{font-size:.78rem;color:#9fb6cf;text-transform:capitalize}
        .jm-row .ht{font-size:.88rem;margin-top:3px;white-space:pre-wrap;word-break:break-word}
        .jm-del{margin-left:auto;background:none;border:none;color:#e8908f;cursor:pointer;font-size:.85rem;opacity:.7}
        .jm-del:hover{opacity:1}
        .jm-empty{color:#9fb6cf;text-align:center;padding:22px;font-size:.88rem}
        @media(max-width:760px){.jm-card{padding:13px}.jm-mood .em{font-size:1.45rem}}
      `}</style>

      {goBack && <button className="jm-back" onClick={goBack}>← Retour</button>}
      <h1>📓 Journal & humeur</h1>
      <p className="sub">Note ta journée et ton humeur. 🔒 Tout reste sur ton appareil, rien n'est envoyé sur Internet.</p>

      <div className="jm-card">
        <h2>Aujourd'hui · {frDate(todayKey())}</h2>
        <div className="jm-moods">
          {MOODS.map((m) => (
            <div key={m.v} className={`jm-mood ${mood === m.v ? 'on' : ''}`} onClick={() => setMood(m.v)}>
              <span className="em">{m.e}</span><span className="lb">{m.label}</span>
            </div>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Comment s'est passée ta journée ?" />
        <div>
          <button className="jm-btn" onClick={saveToday}>💾 Enregistrer</button>
          {saved && <span className="jm-ok">Entrée sauvegardée ✓</span>}
        </div>
      </div>

      <div className="jm-card">
        <div className="jm-cal-head">
          <button onClick={() => moveMonth(-1)} aria-label="Mois précédent">‹</button>
          <strong>{MONTHS[cursor.m]} {cursor.y}</strong>
          <button onClick={() => moveMonth(1)} aria-label="Mois suivant">›</button>
        </div>
        <div className="jm-grid">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="jm-dow">{d}</div>)}
          {days.map((k, i) => {
            const mo = k ? moodOf(k) : null;
            return (
              <div key={i} className="jm-cell" title={k && entries[k] ? `${frDate(k)} — ${mo.label}` : (k ? frDate(k) : '')}
                   style={mo ? { background: mo.col, color: '#10130a' } : {}}>
                {k && <span className="dn">{Number(k.slice(8))}</span>}
                {mo ? mo.e : ''}
              </div>
            );
          })}
        </div>
        <div className="jm-legend">
          {MOODS.map((m) => <span key={m.v}><i className="jm-dot" style={{ background: m.col }} />{m.label}</span>)}
        </div>
      </div>

      <div className="jm-card">
        <h2>Historique</h2>
        {history.length === 0 ? (
          <div className="jm-empty">Aucune entrée pour l'instant. Note ta première journée ci-dessus.</div>
        ) : (
          <div className="jm-hist">
            {history.map((k) => {
              const e = entries[k]; const mo = MOODS.find((x) => x.v === e.mood);
              return (
                <div key={k} className="jm-row">
                  <span className="he" title={mo ? mo.label : ''}>{mo ? mo.e : '•'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="hd">{frDate(k)}</div>
                    {e.text && <div className="ht">{e.text}</div>}
                  </div>
                  <button className="jm-del" onClick={() => removeEntry(k)} title="Supprimer">✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
