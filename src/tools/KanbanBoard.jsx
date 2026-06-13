import React, { useState, useEffect } from 'react';

/**
 * KanbanBoard — tableau Kanban 100 % local & hors-ligne.
 * Colonnes À faire / En cours / Fait. Ajoute des cartes (titre + description),
 * déplace-les (flèches ou glisser-déposer HTML5), édite et supprime.
 * Tout est mémorisé dans le navigateur (localStorage). Rien n'est envoyé.
 */

const LS_KEY = 'kanbanboard_v1';
const COLS = [
  { id: 'todo', title: '📋 À faire', col: '#5b9dff' },
  { id: 'doing', title: '🚧 En cours', col: '#ffae3b' },
  { id: 'done', title: '✅ Fait', col: '#46b07a' },
];
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default function KanbanBoard({ goBack }) {
  const [cards, setCards] = useState({ todo: [], doing: [], done: [] }); // {id,title,desc}
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [editing, setEditing] = useState(null); // {col,id}
  const [editVal, setEditVal] = useState({ title: '', desc: '' });
  const [drag, setDrag] = useState(null); // {from,id}

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const d = JSON.parse(raw); setCards({ todo: d.todo || [], doing: d.doing || [], done: d.done || [] }); }
    } catch (e) { /* indisponible : on ignore */ }
  }, []);

  const persist = (next) => {
    setCards(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) { /* quota : on ignore */ }
  };

  const addCard = () => {
    const t = title.trim(); if (!t) return;
    persist({ ...cards, todo: [{ id: uid(), title: t, desc: desc.trim() }, ...cards.todo] });
    setTitle(''); setDesc('');
  };

  const removeCard = (col, id) => persist({ ...cards, [col]: cards[col].filter((c) => c.id !== id) });

  const move = (from, id, dir) => {
    const order = COLS.map((c) => c.id);
    const to = order[order.indexOf(from) + dir];
    if (!to) return;
    const card = cards[from].find((c) => c.id === id); if (!card) return;
    persist({ ...cards, [from]: cards[from].filter((c) => c.id !== id), [to]: [card, ...cards[to]] });
  };

  const moveTo = (from, id, to) => {
    if (from === to) return;
    const card = cards[from].find((c) => c.id === id); if (!card) return;
    persist({ ...cards, [from]: cards[from].filter((c) => c.id !== id), [to]: [card, ...cards[to]] });
  };

  const startEdit = (col, c) => { setEditing({ col, id: c.id }); setEditVal({ title: c.title, desc: c.desc }); };
  const saveEdit = () => {
    if (!editing) return;
    const t = editVal.title.trim(); if (!t) { setEditing(null); return; }
    const { col, id } = editing;
    persist({ ...cards, [col]: cards[col].map((c) => c.id === id ? { ...c, title: t, desc: editVal.desc.trim() } : c) });
    setEditing(null);
  };

  return (
    <div className="kb">
      <style>{`
        .kb{color:#eaf2fb;max-width:1100px;margin:0 auto;font-family:system-ui,sans-serif}
        .kb h1{font-size:1.55rem;margin:0 0 4px}
        .kb .sub{color:#9fb6cf;font-size:.88rem;margin:0 0 16px}
        .kb-back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font-weight:600;cursor:pointer;margin-bottom:14px}
        .kb-add{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin-bottom:18px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start}
        .kb-add input,.kb-add textarea{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#eaf2fb;padding:11px;font-size:.92rem;font-family:inherit}
        .kb-add input{flex:1;min-width:170px}
        .kb-add textarea{flex:2;min-width:200px;resize:vertical;min-height:44px}
        .kb-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer;font-size:.92rem}
        .kb-board{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .kb-col{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:12px;min-height:120px;transition:.15s}
        .kb-col.over{background:rgba(91,157,255,.12);border-color:rgba(91,157,255,.5)}
        .kb-col h2{font-size:.95rem;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center}
        .kb-col h2 .cnt{font-size:.7rem;color:#9fb6cf;background:rgba(0,0,0,.3);border-radius:99px;padding:2px 8px}
        .kb-card{background:rgba(10,22,40,.7);border:1px solid rgba(255,255,255,.13);border-left-width:4px;border-radius:11px;padding:10px 11px;margin-bottom:9px;cursor:grab}
        .kb-card:active{cursor:grabbing}
        .kb-card .ct{font-weight:700;font-size:.92rem;word-break:break-word}
        .kb-card .cd{font-size:.8rem;color:#b9cbe2;margin-top:4px;white-space:pre-wrap;word-break:break-word}
        .kb-acts{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
        .kb-acts button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:7px;padding:4px 9px;cursor:pointer;font-size:.74rem}
        .kb-acts button:hover{background:rgba(255,255,255,.16)}
        .kb-acts .del:hover{background:rgba(232,96,122,.3);border-color:#e8607a}
        .kb-empty{color:#7d93ad;font-size:.8rem;text-align:center;padding:14px;border:1px dashed rgba(255,255,255,.14);border-radius:10px}
        .kb-edit input,.kb-edit textarea{width:100%;box-sizing:border-box;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#eaf2fb;padding:7px;font-size:.85rem;margin-bottom:6px;font-family:inherit}
        .kb-edit textarea{resize:vertical;min-height:46px}
        @media(max-width:760px){.kb-board{grid-template-columns:1fr}}
      `}</style>

      {goBack && <button className="kb-back" onClick={goBack}>← Retour</button>}
      <h1>🗂️ Tableau Kanban</h1>
      <p className="sub">Organise tes tâches en colonnes. Glisse-dépose ou utilise les flèches. 🔒 Tout reste sur ton appareil.</p>

      <div className="kb-add">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la carte"
               onKeyDown={(e) => e.key === 'Enter' && addCard()} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optionnelle)" rows={1} />
        <button className="kb-btn" onClick={addCard}>＋ Ajouter</button>
      </div>

      <div className="kb-board">
        {COLS.map((colDef) => {
          const list = cards[colDef.id];
          const isOver = drag && drag.over === colDef.id;
          return (
            <div key={colDef.id} className={`kb-col ${isOver ? 'over' : ''}`}
                 onDragOver={(e) => { e.preventDefault(); if (drag && drag.over !== colDef.id) setDrag({ ...drag, over: colDef.id }); }}
                 onDragLeave={() => { if (drag) setDrag({ from: drag.from, id: drag.id }); }}
                 onDrop={() => { if (drag) { moveTo(drag.from, drag.id, colDef.id); setDrag(null); } }}>
              <h2 style={{ color: colDef.col }}>{colDef.title}<span className="cnt">{list.length}</span></h2>
              {list.length === 0 && <div className="kb-empty">Aucune carte</div>}
              {list.map((c, idx) => {
                const isEdit = editing && editing.col === colDef.id && editing.id === c.id;
                return (
                  <div key={c.id} className="kb-card" style={{ borderLeftColor: colDef.col }} draggable={!isEdit}
                       onDragStart={() => setDrag({ from: colDef.id, id: c.id })}
                       onDragEnd={() => setDrag(null)}>
                    {isEdit ? (
                      <div className="kb-edit">
                        <input value={editVal.title} onChange={(e) => setEditVal((v) => ({ ...v, title: e.target.value }))} placeholder="Titre" autoFocus />
                        <textarea value={editVal.desc} onChange={(e) => setEditVal((v) => ({ ...v, desc: e.target.value }))} placeholder="Description" />
                        <div className="kb-acts">
                          <button onClick={saveEdit}>💾 Enregistrer</button>
                          <button onClick={() => setEditing(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ct">{c.title}</div>
                        {c.desc && <div className="cd">{c.desc}</div>}
                        <div className="kb-acts">
                          <button onClick={() => move(colDef.id, c.id, -1)} disabled={idx === undefined || colDef.id === 'todo'} title="Déplacer à gauche">←</button>
                          <button onClick={() => move(colDef.id, c.id, 1)} disabled={colDef.id === 'done'} title="Déplacer à droite">→</button>
                          <button onClick={() => startEdit(colDef.id, c)} title="Éditer">✏️</button>
                          <button className="del" onClick={() => removeCard(colDef.id, c.id)} title="Supprimer">🗑</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
