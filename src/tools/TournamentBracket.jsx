import React, { useState, useEffect, useMemo } from 'react';

const LS_KEY = 'tournament_bracket_v1';
const BYE = '— (exempt)';

// Construit les tours à partir des participants seedés (déjà puissance de 2 avec byes).
function buildRounds(seeds) {
  const rounds = [];
  let count = seeds.length / 2;
  // round 0 = matchs initiaux
  rounds.push(Array.from({ length: count }, (_, i) => ({ a: seeds[i * 2], b: seeds[i * 2 + 1], winner: null })));
  while (count > 1) {
    count = count / 2;
    rounds.push(Array.from({ length: count }, () => ({ a: null, b: null, winner: null })));
  }
  return rounds;
}

export default function TournamentBracket({ goBack }) {
  const [raw, setRaw] = useState('');
  const [rounds, setRounds] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return d?.rounds || null; }
    catch (e) { return null; }
  });
  const [names, setNames] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return d?.names || []; }
    catch (e) { return []; }
  });

  useEffect(() => {
    try {
      if (rounds) localStorage.setItem(LS_KEY, JSON.stringify({ rounds, names }));
      else localStorage.removeItem(LS_KEY);
    } catch (e) { /* quota/file:// */ }
  }, [rounds, names]);

  const generate = () => {
    const list = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) return;
    let size = 1; while (size < list.length) size *= 2;
    const seeds = list.slice();
    while (seeds.length < size) seeds.push(BYE);
    const r = buildRounds(seeds);
    // auto-avance les exempts du 1er tour
    r[0].forEach((m, i) => {
      if (m.a === BYE && m.b !== BYE) m.winner = m.b;
      else if (m.b === BYE && m.a !== BYE) m.winner = m.a;
      if (m.winner && r[1]) {
        const slot = Math.floor(i / 2);
        if (i % 2 === 0) r[1][slot].a = m.winner; else r[1][slot].b = m.winner;
      }
    });
    setRounds(r);
    setNames(list);
  };

  const pickWinner = (ri, mi, who) => {
    if (who === BYE) return;
    setRounds((prev) => {
      const r = prev.map((round) => round.map((m) => ({ ...m })));
      r[ri][mi].winner = who;
      // propage et nettoie les tours suivants si on change un choix
      for (let cur = ri; cur < r.length - 1; cur++) {
        r[cur].forEach((m, i) => {
          const slot = Math.floor(i / 2);
          const target = r[cur + 1][slot];
          if (i % 2 === 0) target.a = m.winner; else target.b = m.winner;
        });
      }
      return r;
    });
  };

  const reset = () => { setRounds(null); setNames([]); };

  const champion = useMemo(() => {
    if (!rounds) return null;
    const last = rounds[rounds.length - 1];
    return last && last[0] ? last[0].winner : null;
  }, [rounds]);

  // Géométrie SVG
  const layout = useMemo(() => {
    if (!rounds) return null;
    const colW = 188, gapX = 36, boxH = 30, gapY0 = 18, padY = 24;
    const slotH = boxH * 2 + gapY0; // hauteur d'un match au 1er tour
    const firstCount = rounds[0].length;
    const height = padY * 2 + firstCount * slotH;
    const width = rounds.length * colW + (rounds.length - 1) * gapX + 20;
    const positions = rounds.map((round, ri) => round.map((m, mi) => {
      const block = height / round.length;
      const cy = padY + block * mi + block / 2;
      const x = 10 + ri * (colW + gapX);
      return { x, cyA: cy - (boxH / 2) - 3, cyB: cy + (boxH / 2) + 3, cy };
    }));
    return { positions, colW, boxH, width, height };
  }, [rounds]);

  return (
    <div className="tbk">
      <style>{`
        .tbk{color:#eaf2fb;max-width:1100px;margin:0 auto}
        .tbk h1{font-size:1.6rem;margin:0 0 4px}
        .tbk .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .tbk-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .tbk-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .tbk-btn:disabled{opacity:.45;cursor:not-allowed}
        .tbk-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .tbk textarea{width:100%;min-height:96px;background:rgba(10,22,40,.6);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px;font-size:.9rem;resize:vertical;box-sizing:border-box}
        .tbk-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}
        .tbk-champ{text-align:center;padding:14px;border-radius:12px;margin-bottom:14px;background:linear-gradient(135deg,rgba(255,122,24,.18),rgba(255,174,59,.14));border:1px solid rgba(255,174,59,.4);font-weight:800;font-size:1.2rem}
        .tbk-scroll{overflow:auto;border-radius:14px}
        .tbk-name{cursor:pointer;font-size:12px;fill:#eaf2fb}
        .tbk-box{transition:fill .15s}
        .tbk-empty{text-align:center;color:#9fb6cf;padding:30px 10px}
        @media(max-width:760px){.tbk-btn{flex:1}}
      `}</style>

      {goBack && <button className="tbk-btn ghost" onClick={goBack} style={{ marginBottom: 14 }}>← Retour</button>}
      <h1>🏆 Arbre de tournoi</h1>
      <p className="sub">Génère un bracket à élimination simple — 100 % local, aucune donnée envoyée.</p>

      {!rounds && (
        <div className="tbk-pane">
          <label style={{ fontSize: '.82rem', color: '#9fb6cf', display: 'block', marginBottom: 6 }}>
            Participants (un par ligne ou séparés par des virgules)
          </label>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)}
                    placeholder={"Alice\nBob\nCharlie\nDiane"} />
          <div className="tbk-row">
            <button className="tbk-btn" onClick={generate}
                    disabled={raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).length < 2}>
              ⚙️ Générer le bracket
            </button>
            <span style={{ fontSize: '.8rem', color: '#9fb6cf' }}>
              {raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).length} participant(s) — des exempts seront ajoutés si besoin.
            </span>
          </div>
        </div>
      )}

      {rounds && layout && (
        <>
          {champion && <div className="tbk-champ">🥇 Vainqueur : {champion}</div>}
          <div className="tbk-row" style={{ marginTop: 0, marginBottom: 12 }}>
            <span style={{ fontSize: '.82rem', color: '#9fb6cf' }}>{names.length} participants · Clique un nom pour le faire gagner.</span>
            <span style={{ flex: 1 }} />
            <button className="tbk-btn ghost" onClick={reset}>↺ Réinitialiser</button>
          </div>
          <div className="tbk-pane tbk-scroll">
            <svg width={layout.width} height={layout.height} style={{ minWidth: layout.width }}>
              {rounds.map((round, ri) => round.map((m, mi) => {
                const p = layout.positions[ri][mi];
                const slots = [{ y: p.cyA, who: m.a }, { y: p.cyB, who: m.b }];
                const connectors = [];
                if (ri < rounds.length - 1) {
                  const np = layout.positions[ri + 1][Math.floor(mi / 2)];
                  const midX = p.x + layout.colW + 18;
                  connectors.push(
                    <polyline key={`c${ri}${mi}`} fill="none" stroke="rgba(159,182,207,.4)" strokeWidth="1.5"
                      points={`${p.x + layout.colW},${p.cy} ${midX},${p.cy} ${midX},${np.cy} ${p.x + layout.colW + 36},${np.cy}`} />
                  );
                }
                return (
                  <g key={`${ri}-${mi}`}>
                    {connectors}
                    {slots.map((s, si) => {
                      const isWin = m.winner && s.who === m.winner;
                      const isBye = s.who === BYE;
                      const clickable = s.who && !isBye;
                      return (
                        <g key={si} onClick={() => clickable && pickWinner(ri, mi, s.who)}
                           style={{ cursor: clickable ? 'pointer' : 'default' }}>
                          <rect className="tbk-box" x={p.x} y={s.y - layout.boxH / 2} width={layout.colW} height={layout.boxH} rx="7"
                                fill={isWin ? 'rgba(255,174,59,.28)' : isBye ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)'}
                                stroke={isWin ? '#ffae3b' : 'rgba(255,255,255,.18)'} strokeWidth={isWin ? 1.6 : 1} />
                          <text className="tbk-name" x={p.x + 12} y={s.y + 4}
                                fill={isBye ? '#5f7894' : isWin ? '#ffce8a' : '#eaf2fb'}
                                fontWeight={isWin ? 700 : 400}>
                            {s.who ? (s.who.length > 22 ? s.who.slice(0, 21) + '…' : s.who) : '…'}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }))}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
