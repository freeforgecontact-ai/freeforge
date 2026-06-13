import React, { useState, useMemo, useCallback } from 'react';

/**
 * GitVisualizer — visualiseur pédagogique de commandes Git, 100 % local & hors-ligne.
 * Le DAG des commits vit en mémoire ; chaque commande (commit, branch, checkout,
 * merge, rebase, cherry-pick) modifie le graphe ET affiche une explication en français.
 * Aucun dépôt réel n'est touché, aucun réseau : c'est une simulation visuelle.
 */

const BRANCH_COLORS = ['#5b9dff', '#ffae3b', '#48d597', '#ff7a8a', '#c08bff', '#ffd34d'];
const rid = () => Math.random().toString(36).slice(2, 7);

function initialState() {
  // DAG pré-rempli : main avec 3 commits, feature qui part du 2e.
  const c1 = { id: rid(), parents: [], branch: 'main', msg: 'Initialisation du projet' };
  const c2 = { id: rid(), parents: [c1.id], branch: 'main', msg: 'Ajout du README' };
  const c3 = { id: rid(), parents: [c2.id], branch: 'feature', msg: 'Début de la fonctionnalité' };
  const c4 = { id: rid(), parents: [c2.id], branch: 'main', msg: 'Correctif de mise en page' };
  return {
    commits: [c1, c2, c3, c4],
    branches: { main: c4.id, feature: c3.id },
    head: 'main',
  };
}

export default function GitVisualizer({ goBack }) {
  const [state, setState] = useState(initialState);
  const [log, setLog] = useState(['Graphe initialisé : 2 branches (main, feature), 4 commits.']);
  const [branchInput, setBranchInput] = useState('');

  const branchNames = Object.keys(state.branches);
  const colorOf = useCallback((b) => BRANCH_COLORS[branchNames.indexOf(b) % BRANCH_COLORS.length], [branchNames]);
  const note = (txt) => setLog((l) => [txt, ...l].slice(0, 12));

  const doCommit = () => {
    const parent = state.branches[state.head];
    const c = { id: rid(), parents: [parent], branch: state.head, msg: `Commit sur ${state.head}` };
    setState((s) => ({ ...s, commits: [...s.commits, c], branches: { ...s.branches, [s.head]: c.id } }));
    note(`git commit → nouveau commit ${c.id} ajouté sur « ${state.head} ». HEAD avance d'un cran.`);
  };

  const doBranch = () => {
    const name = (branchInput || `branche-${rid()}`).trim().replace(/\s+/g, '-');
    if (state.branches[name]) { note(`La branche « ${name} » existe déjà.`); return; }
    setState((s) => ({ ...s, branches: { ...s.branches, [name]: s.branches[s.head] } }));
    note(`git branch ${name} → crée un pointeur « ${name} » sur le commit courant, sans changer de branche.`);
    setBranchInput('');
  };

  const doCheckout = (name) => {
    if (name === state.head) return;
    setState((s) => ({ ...s, head: name }));
    note(`git checkout ${name} → HEAD pointe désormais sur « ${name} ». Les prochains commits iront sur cette branche.`);
  };

  const doMerge = (from) => {
    if (from === state.head) { note('On ne fusionne pas une branche avec elle-même.'); return; }
    const a = state.branches[state.head], b = state.branches[from];
    const c = { id: rid(), parents: [a, b], branch: state.head, msg: `Fusion de ${from} dans ${state.head}` };
    setState((s) => ({ ...s, commits: [...s.commits, c], branches: { ...s.branches, [s.head]: c.id } }));
    note(`git merge ${from} → crée un commit de fusion (2 parents) qui réunit l'historique de « ${from} » dans « ${state.head} ».`);
  };

  const doRebase = (onto) => {
    if (onto === state.head) { note('Rebase impossible sur la même branche.'); return; }
    const c = { id: rid(), parents: [state.branches[onto]], branch: state.head, msg: `Rejoué sur ${onto}` };
    setState((s) => ({ ...s, commits: [...s.commits, c], branches: { ...s.branches, [s.head]: c.id } }));
    note(`git rebase ${onto} → rejoue les commits de « ${state.head} » par-dessus « ${onto} ». L'historique devient linéaire (les commits sont réécrits).`);
  };

  const doCherryPick = (from) => {
    const tip = state.commits.find((x) => x.id === state.branches[from]);
    if (!tip) return;
    const c = { id: rid(), parents: [state.branches[state.head]], branch: state.head, msg: `Repris : ${tip.msg}` };
    setState((s) => ({ ...s, commits: [...s.commits, c], branches: { ...s.branches, [s.head]: c.id } }));
    note(`git cherry-pick → copie le contenu du commit ${tip.id} de « ${from} » en un nouveau commit sur « ${state.head} ».`);
  };

  const reset = () => { setState(initialState()); setLog(['Graphe réinitialisé.']); };

  // ---- placement des nœuds pour le SVG ----
  const layout = useMemo(() => {
    const order = state.commits; // ordre de création ≈ ordre topologique ici
    const rows = {};
    branchNames.forEach((b, i) => { rows[b] = i; });
    const xStep = 96, yStep = 64, x0 = 60, y0 = 44;
    const pos = {};
    order.forEach((c, i) => { pos[c.id] = { x: x0 + i * xStep, y: y0 + rows[c.branch] * yStep, c }; });
    const width = x0 + order.length * xStep + 30;
    const height = y0 + branchNames.length * yStep + 20;
    return { pos, width, height, order };
  }, [state.commits, branchNames]);

  return (
    <div className="gitv">
      <style>{`
        .gitv{color:#eaf2fb;max-width:1080px;margin:0 auto}
        .gitv h1{font-size:1.55rem;margin:0 0 4px}
        .gitv .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .gitv-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center}
        .gitv-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:9px;padding:9px 13px;font-weight:700;cursor:pointer;font-size:.85rem}
        .gitv-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .gitv-btn.ghost.on{background:rgba(91,157,255,.25);border-color:#5b9dff}
        .gitv-btn:active{transform:translateY(1px)}
        .gitv-in{background:rgba(255,255,255,.95);color:#0a2236;border:1px solid #cfe0f2;border-radius:9px;padding:8px 10px;font-size:.85rem;width:150px}
        .gitv-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin-bottom:14px}
        .gitv-h{font-size:.95rem;font-weight:700;margin:0 0 8px;color:#cfe0f2}
        .gitv-svg{width:100%;overflow:auto;background:rgba(8,20,38,.55);border-radius:12px;border:1px solid rgba(255,255,255,.1)}
        .gitv-head{font-size:.85rem;color:#9fb6cf;margin-bottom:8px}
        .gitv-head b{color:#ffae3b}
        .gitv-log{list-style:none;margin:0;padding:0;max-height:230px;overflow:auto}
        .gitv-log li{padding:8px 10px;border-radius:8px;font-size:.82rem;line-height:1.35;background:rgba(255,255,255,.04);margin-bottom:6px;color:#dbe7f5}
        .gitv-log li:first-child{background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.4)}
        .gitv-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:.8rem;color:#9fb6cf}
        .gitv-legend span{display:inline-flex;align-items:center;gap:5px}
        .gitv-dot{width:11px;height:11px;border-radius:50%;display:inline-block}
        @media(max-width:760px){.gitv-in{width:120px}.gitv h1{font-size:1.3rem}}
      `}</style>

      <h1>🌳 Visualiseur Git</h1>
      <p className="sub">Simulation pédagogique d'un graphe de commits (DAG en mémoire). Aucun dépôt réel, aucun réseau.</p>

      <div className="gitv-head">Branche active (HEAD) : <b>{state.head}</b></div>

      <div className="gitv-bar">
        <button className="gitv-btn" onClick={doCommit}>＋ commit</button>
        <input className="gitv-in" placeholder="nom de branche" value={branchInput}
               onChange={(e) => setBranchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doBranch()} />
        <button className="gitv-btn ghost" onClick={doBranch}>branch</button>
        <button className="gitv-btn ghost" onClick={reset} style={{ marginLeft: 'auto' }}>↺ Réinitialiser</button>
      </div>

      <div className="gitv-card">
        <div className="gitv-h">Branches — clic pour checkout</div>
        <div className="gitv-bar" style={{ margin: 0 }}>
          {branchNames.map((b) => (
            <button key={b} className={`gitv-btn ghost ${b === state.head ? 'on' : ''}`}
                    style={{ borderLeft: `4px solid ${colorOf(b)}` }} onClick={() => doCheckout(b)}>
              {b === state.head ? '● ' : ''}{b}
            </button>
          ))}
        </div>
        <div className="gitv-h" style={{ marginTop: 12 }}>Opérations sur les autres branches → vers « {state.head} »</div>
        <div className="gitv-bar" style={{ margin: 0 }}>
          {branchNames.filter((b) => b !== state.head).flatMap((b) => ([
            <button key={`m${b}`} className="gitv-btn ghost" onClick={() => doMerge(b)}>merge {b}</button>,
            <button key={`r${b}`} className="gitv-btn ghost" onClick={() => doRebase(b)}>rebase sur {b}</button>,
            <button key={`c${b}`} className="gitv-btn ghost" onClick={() => doCherryPick(b)}>cherry-pick {b}</button>,
          ]))}
          {branchNames.length < 2 && <span style={{ color: '#9fb6cf', fontSize: '.82rem' }}>Crée une 2e branche pour fusionner.</span>}
        </div>
      </div>

      <div className="gitv-card">
        <div className="gitv-h">Graphe des commits</div>
        <div className="gitv-svg">
          <svg width={Math.max(layout.width, 320)} height={layout.height} role="img" aria-label="Graphe Git">
            {layout.order.map((c) => c.parents.map((p) => {
              const a = layout.pos[c.id], b = layout.pos[p];
              if (!a || !b) return null;
              return <line key={c.id + p} x1={b.x} y1={b.y} x2={a.x} y2={a.y}
                           stroke={colorOf(c.branch)} strokeWidth="2.5" opacity="0.7" />;
            }))}
            {layout.order.map((c) => {
              const { x, y } = layout.pos[c.id];
              const isTip = state.branches[c.branch] === c.id;
              return (
                <g key={c.id}>
                  <circle cx={x} cy={y} r="13" fill={colorOf(c.branch)}
                          stroke={isTip ? '#fff' : 'rgba(0,0,0,.3)'} strokeWidth={isTip ? 2.5 : 1} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#10222e" fontWeight="700">{c.id}</text>
                  {isTip && <text x={x} y={y - 19} textAnchor="middle" fontSize="10" fill={colorOf(c.branch)} fontWeight="700">{c.branch}</text>}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="gitv-legend">
          {branchNames.map((b) => <span key={b}><i className="gitv-dot" style={{ background: colorOf(b) }} />{b}</span>)}
        </div>
      </div>

      <div className="gitv-card">
        <div className="gitv-h">Explications des commandes</div>
        <ul className="gitv-log">
          {log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}
