import React, { useState } from 'react';

/**
 * SleepCycle — calculateur de cycles de sommeil (~90 min) 100 % local & hors-ligne.
 * Mode A : « me réveiller à HH:MM » -> heures de coucher idéales (5-6 cycles + ~15 min d'endormissement).
 * Mode B : « me coucher à HH:MM / maintenant » -> heures de réveil idéales.
 * Aucun réseau, aucune donnée envoyée.
 */

const CYCLE = 90;       // minutes par cycle
const FALL = 15;        // minutes d'endormissement
const CYCLES = [6, 5, 4, 3]; // cycles proposés (du plus reposant au moins)

const pad = (n) => n.toString().padStart(2, '0');
const fmt = (mins) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
const parse = (str) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((str || '').trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
};
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export default function SleepCycle({ goBack }) {
  const [mode, setMode] = useState('wake'); // 'wake' (réveil cible) | 'bed' (coucher)
  const [wake, setWake] = useState('07:00');
  const [bed, setBed] = useState(nowHM());

  const base = parse(mode === 'wake' ? wake : bed);
  const options = base == null ? [] : CYCLES.map((c) => {
    const dur = c * CYCLE;
    // wake: on recule depuis l'heure de réveil (durée sommeil + endormissement)
    // bed: on avance depuis l'heure de coucher (endormissement + durée sommeil)
    const t = mode === 'wake' ? base - dur - FALL : base + FALL + dur;
    const h = Math.floor(dur / 60), mi = dur % 60;
    return { cycles: c, time: fmt(t), dur: `${h}h${mi ? pad(mi) : ''}` };
  });

  return (
    <div className="slpc">
      <style>{`
        .slpc{color:#eaf2fb;max-width:760px;margin:0 auto}
        .slpc h1{font-size:1.6rem;margin:0 0 4px}
        .slpc .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px;line-height:1.45}
        .slpc .back{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:7px 13px;font-weight:600;cursor:pointer;font-size:.85rem;margin-bottom:16px}
        .slpc-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;margin-bottom:18px}
        .slpc-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
        .slpc-tab{flex:1;min-width:200px;background:rgba(255,255,255,.06);color:#cfe0f3;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:13px;font-weight:600;cursor:pointer;font-size:.92rem;text-align:left}
        .slpc-tab.on{background:rgba(91,157,255,.22);border-color:rgba(91,157,255,.55);color:#eaf2fb}
        .slpc-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .slpc label{font-size:.9rem;color:#cfe0f3;font-weight:600}
        .slpc input[type=time]{background:rgba(10,22,40,.7);color:#eaf2fb;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 12px;font-size:1.1rem;font-family:inherit}
        .slpc-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .slpc-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
        .slpc-opt{background:rgba(10,22,40,.55);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:14px;text-align:center}
        .slpc-opt.best{border-color:rgba(255,174,59,.6);background:rgba(255,122,24,.12)}
        .slpc-opt .t{font-size:1.7rem;font-weight:800;color:#ffd27a;letter-spacing:.5px}
        .slpc-opt .meta{font-size:.8rem;color:#9fb6cf;margin-top:4px}
        .slpc-opt .tag{display:inline-block;margin-top:8px;font-size:.72rem;background:rgba(91,157,255,.25);color:#bcd6ff;border-radius:20px;padding:3px 9px}
        .slpc-opt.best .tag{background:rgba(255,174,59,.28);color:#ffd9a0}
        .slpc-now{margin-top:14px}
        .slpc-now button{background:rgba(91,157,255,.18);color:#cfe0f3;border:1px solid rgba(91,157,255,.4);border-radius:10px;padding:8px 13px;font-size:.82rem;cursor:pointer;font-weight:600}
        .slpc .err{color:#ff9a9a;font-size:.85rem;margin-top:10px}
        .slpc h2{font-size:1.05rem;margin:0 0 12px}
        @media(max-width:760px){.slpc-tab{min-width:100%}}
      `}</style>

      {goBack && <button className="back" onClick={goBack}>← Retour</button>}
      <h1>🌙 Cycles de sommeil</h1>
      <p className="sub">
        Un cycle de sommeil dure ~90 min. Se réveiller à la fin d'un cycle (et non en plein milieu)
        rend le réveil plus facile. On compte aussi ~15 min pour s'endormir.
      </p>

      <div className="slpc-tabs">
        <button className={`slpc-tab ${mode === 'wake' ? 'on' : ''}`} onClick={() => setMode('wake')}>
          ⏰ Je veux me réveiller à une heure précise<br />
          <span style={{ fontWeight: 400, fontSize: '.8rem', color: '#9fb6cf' }}>→ quand me coucher ?</span>
        </button>
        <button className={`slpc-tab ${mode === 'bed' ? 'on' : ''}`} onClick={() => setMode('bed')}>
          🛏️ Je me couche à une heure précise<br />
          <span style={{ fontWeight: 400, fontSize: '.8rem', color: '#9fb6cf' }}>→ quand me réveiller ?</span>
        </button>
      </div>

      <div className="slpc-card">
        {mode === 'wake' ? (
          <div className="slpc-row">
            <label>Heure de réveil souhaitée :</label>
            <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
          </div>
        ) : (
          <div className="slpc-row">
            <label>Heure de coucher :</label>
            <input type="time" value={bed} onChange={(e) => setBed(e.target.value)} />
            <div className="slpc-now">
              <button onClick={() => setBed(nowHM())}>Je me couche maintenant ({nowHM()})</button>
            </div>
          </div>
        )}
        {base == null && <div className="err">Saisis une heure valide (HH:MM).</div>}
      </div>

      {options.length > 0 && (
        <div className="slpc-card">
          <h2>{mode === 'wake' ? 'Couche-toi à l’une de ces heures :' : 'Programme ton réveil à :'}</h2>
          <div className="slpc-opts">
            {options.map((o, i) => (
              <div key={o.cycles} className={`slpc-opt ${i === 0 ? 'best' : ''}`}>
                <div className="t">{o.time}</div>
                <div className="meta">{o.cycles} cycles · {o.dur} de sommeil</div>
                <span className="tag">{i === 0 ? '★ Idéal' : 'Correct'}</span>
              </div>
            ))}
          </div>
          <p className="sub" style={{ margin: '14px 0 0' }}>
            Astuce : vise 5 à 6 cycles (7h30 à 9h). Les options à 3-4 cycles dépannent pour une nuit courte.
          </p>
        </div>
      )}
    </div>
  );
}
