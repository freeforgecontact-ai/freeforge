import React, { useState, useMemo } from 'react';

/**
 * CronBuilder — constructeur & visualiseur d'expressions CRON, 100 % local.
 * Construit l'expression via menus, la décrit en français et calcule les
 * 5 prochaines exécutions. Aucun réseau, aucune dépendance externe.
 */

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Parse un champ cron ("*", "5", "1-3", "*/15", "1,15") vers la liste des valeurs autorisées.
function parseField(field, min, max) {
  const out = new Set();
  String(field).split(',').forEach((part) => {
    let step = 1;
    let range = part;
    if (part.includes('/')) { const [r, s] = part.split('/'); range = r; step = parseInt(s, 10) || 1; }
    let lo = min, hi = max;
    if (range !== '*') {
      if (range.includes('-')) { const [a, b] = range.split('-'); lo = parseInt(a, 10); hi = parseInt(b, 10); }
      else { lo = hi = parseInt(range, 10); }
    }
    for (let v = lo; v <= hi; v += step) if (v >= min && v <= max) out.add(v);
  });
  return out;
}

// Calcule les N prochaines dates correspondant à l'expression (minutes par minute, borné).
function nextRuns(expr, count) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  let mins, hrs, doms, mons, dows;
  try {
    mins = parseField(parts[0], 0, 59); hrs = parseField(parts[1], 0, 23);
    doms = parseField(parts[2], 1, 31); mons = parseField(parts[3], 1, 12);
    dows = parseField(parts[4], 0, 6);
  } catch (e) { return []; }
  const domStar = parts[2] === '*'; const dowStar = parts[4] === '*';
  const res = [];
  const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  let guard = 0;
  while (res.length < count && guard < 366 * 24 * 60) {
    guard++;
    const okDom = doms.has(d.getDate());
    const okDow = dows.has(d.getDay());
    const dayOk = (domStar && dowStar) ? true : (domStar ? okDow : dowStar ? okDom : (okDom || okDow));
    if (mins.has(d.getMinutes()) && hrs.has(d.getHours()) && mons.has(d.getMonth() + 1) && dayOk) {
      res.push(new Date(d));
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return res;
}

function describe(expr) {
  const p = expr.trim().split(/\s+/);
  if (p.length !== 5) return 'Expression invalide (5 champs attendus).';
  const [mi, hr, dom, mon, dow] = p;
  const t = [];
  if (mi === '*' && hr === '*') t.push('chaque minute');
  else if (mi.startsWith('*/')) t.push(`toutes les ${mi.slice(2)} minutes`);
  else if (hr === '*') t.push(`à la minute ${mi} de chaque heure`);
  else t.push(`à ${hr.padStart(2, '0')}h${(mi === '*' ? '00' : mi).padStart(2, '0')}`);
  if (dom !== '*') t.push(`le ${dom} du mois`);
  if (mon !== '*') t.push(`en ${mon.split(',').map((m) => MOIS[parseInt(m, 10) - 1] || m).join(', ')}`);
  if (dow !== '*') t.push(`le ${dow.split(',').map((j) => JOURS[parseInt(j, 10)] || j).join(', ')}`);
  return 'S\'exécute ' + t.join(', ') + '.';
}

const PRESETS = [
  { label: 'Toutes les 5 min', expr: '*/5 * * * *' },
  { label: 'Chaque heure', expr: '0 * * * *' },
  { label: 'Chaque jour à 09:00', expr: '0 9 * * *' },
  { label: 'Chaque lundi à 08:00', expr: '0 8 * * 1' },
  { label: '1er du mois à minuit', expr: '0 0 1 * *' },
  { label: 'Jours ouvrés à 18h', expr: '0 18 * * 1-5' },
];

export default function CronBuilder({ goBack }) {
  const [mi, setMi] = useState('*');
  const [hr, setHr] = useState('*');
  const [dom, setDom] = useState('*');
  const [mon, setMon] = useState('*');
  const [dow, setDow] = useState('*');
  const [copied, setCopied] = useState(false);

  const expr = `${mi || '*'} ${hr || '*'} ${dom || '*'} ${mon || '*'} ${dow || '*'}`;
  const desc = useMemo(() => describe(expr), [expr]);
  const runs = useMemo(() => nextRuns(expr, 5), [expr]);

  const applyPreset = (e) => {
    const [a, b, c, d, f] = e.split(/\s+/);
    setMi(a); setHr(b); setDom(c); setMon(d); setDow(f);
  };
  const copy = () => {
    try { navigator.clipboard.writeText(expr); } catch (e) { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const fields = [
    { lbl: 'Minute', v: mi, set: setMi, hint: '0-59' },
    { lbl: 'Heure', v: hr, set: setHr, hint: '0-23' },
    { lbl: 'Jour du mois', v: dom, set: setDom, hint: '1-31' },
    { lbl: 'Mois', v: mon, set: setMon, hint: '1-12' },
    { lbl: 'Jour semaine', v: dow, set: setDow, hint: '0-6 (dim=0)' },
  ];

  return (
    <div className="cron-wrap">
      <style>{`
        .cron-wrap{color:#eaf2fb;max-width:920px;margin:0 auto}
        .cron-wrap h1{font-size:1.6rem;margin:0 0 4px}
        .cron-sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cron-pane{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:16px}
        .cron-fields{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
        .cron-fields label{display:block;font-size:.78rem;color:#9fb6cf;margin-bottom:4px;font-weight:600}
        .cron-fields input{width:100%;box-sizing:border-box;padding:9px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.95);color:#10243a;font-size:.95rem;text-align:center}
        .cron-hint{font-size:.68rem;color:#7f97b3;margin-top:3px;text-align:center}
        .cron-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
        .cron-chip{background:rgba(91,157,255,.18);border:1px solid rgba(91,157,255,.45);color:#cfe2ff;border-radius:999px;padding:6px 12px;font-size:.8rem;cursor:pointer}
        .cron-chip:hover{background:rgba(91,157,255,.32)}
        .cron-expr{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .cron-code{flex:1;min-width:200px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.35rem;letter-spacing:2px;background:#0a3559;border:1px solid rgba(91,157,255,.4);border-radius:10px;padding:12px 16px;color:#ffe;text-align:center}
        .cron-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;font-size:.9rem}
        .cron-desc{margin-top:12px;color:#d8e6f7;font-size:.95rem;background:rgba(255,255,255,.04);border-left:3px solid #ffae3b;padding:10px 14px;border-radius:8px}
        .cron-runs{list-style:none;padding:0;margin:8px 0 0}
        .cron-runs li{padding:9px 12px;border-radius:9px;background:rgba(255,255,255,.04);margin-bottom:6px;font-size:.9rem;display:flex;justify-content:space-between;gap:10px}
        .cron-runs li b{color:#5b9dff}
        .cron-runs .empty{color:#9fb6cf;font-style:italic;background:none;padding:8px 0}
        @media(max-width:760px){.cron-fields{grid-template-columns:1fr 1fr}.cron-code{font-size:1.1rem}}
      `}</style>

      <h1>⏱️ Constructeur CRON</h1>
      <p className="cron-sub">Compose ton expression cron, lis-la en clair et visualise les 5 prochaines exécutions. 100 % hors-ligne.</p>

      <div className="cron-pane">
        <div className="cron-fields">
          {fields.map((f) => (
            <div key={f.lbl}>
              <label>{f.lbl}</label>
              <input value={f.v} onChange={(e) => f.set(e.target.value)} placeholder="*" />
              <div className="cron-hint">{f.hint}</div>
            </div>
          ))}
        </div>
        <div className="cron-presets">
          {PRESETS.map((p) => (
            <button key={p.label} className="cron-chip" onClick={() => applyPreset(p.expr)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="cron-pane">
        <div className="cron-expr">
          <code className="cron-code">{expr}</code>
          <button className="cron-btn" onClick={copy}>{copied ? '✓ Copié' : '📋 Copier'}</button>
        </div>
        <div className="cron-desc">{desc}</div>
      </div>

      <div className="cron-pane">
        <h2 style={{ fontSize: '1.05rem', margin: '0 0 4px' }}>🗓️ 5 prochaines exécutions</h2>
        <ul className="cron-runs">
          {runs.length === 0 ? (
            <li className="empty">Aucune exécution trouvée (expression invalide ou jamais déclenchée dans l'année à venir).</li>
          ) : runs.map((r, i) => (
            <li key={i}>
              <span><b>#{i + 1}</b> {JOURS[r.getDay()]}</span>
              <span>{r.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
