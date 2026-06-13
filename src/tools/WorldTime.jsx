import React, { useState, useEffect, useMemo } from 'react';

/**
 * WorldTime — planificateur multi-fuseaux horaires 100 % hors-ligne.
 * Ajoute des villes/fuseaux (Intl.DateTimeFormat + timeZone, liste IANA courante).
 * Affiche l'heure actuelle de chacun et met en évidence la plage d'heures
 * ouvrables communes (par défaut 9 h–17 h) pour planifier une réunion.
 * Aucune API : tout est calculé localement par le navigateur.
 */

const LS_KEY = 'ff_world_time_v1';

const ZONES = [
  { tz: 'America/Vancouver', label: 'Vancouver' },
  { tz: 'America/Edmonton', label: 'Calgary / Edmonton' },
  { tz: 'America/Chicago', label: 'Chicago / Mexico (centre)' },
  { tz: 'America/Toronto', label: 'Toronto / Montréal' },
  { tz: 'America/New_York', label: 'New York' },
  { tz: 'America/Mexico_City', label: 'Mexico' },
  { tz: 'America/Sao_Paulo', label: 'São Paulo' },
  { tz: 'Europe/London', label: 'Londres' },
  { tz: 'Europe/Paris', label: 'Paris / Madrid' },
  { tz: 'Europe/Berlin', label: 'Berlin / Rome' },
  { tz: 'Europe/Athens', label: 'Athènes / Istanbul' },
  { tz: 'Europe/Moscow', label: 'Moscou' },
  { tz: 'Africa/Lagos', label: 'Lagos' },
  { tz: 'Africa/Nairobi', label: 'Nairobi' },
  { tz: 'Asia/Dubai', label: 'Dubaï' },
  { tz: 'Asia/Kolkata', label: 'Inde (Delhi / Mumbai)' },
  { tz: 'Asia/Bangkok', label: 'Bangkok' },
  { tz: 'Asia/Shanghai', label: 'Pékin / Shanghai' },
  { tz: 'Asia/Singapore', label: 'Singapour' },
  { tz: 'Asia/Tokyo', label: 'Tokyo' },
  { tz: 'Australia/Sydney', label: 'Sydney' },
  { tz: 'Pacific/Auckland', label: 'Auckland' },
];

// Heure locale (0-23.99) d'un fuseau pour un instant donné.
function hourIn(tz, date) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return (h % 24) + m / 60;
  } catch (e) { return 0; }
}

function fmtTime(tz, date) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date);
  } catch (e) { return '--:--'; }
}
function fmtDay(tz, date) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: tz, weekday: 'short', day: '2-digit', month: 'short',
    }).format(date);
  } catch (e) { return ''; }
}

export default function WorldTime({ goBack }) {
  const localTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'UTC'; } })();
  const [selected, setSelected] = useState(['America/Toronto', 'Europe/Paris', 'Asia/Tokyo']);
  const [startH, setStartH] = useState(9);
  const [endH, setEndH] = useState(17);
  const [now, setNow] = useState(new Date());
  const [pick, setPick] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.selected) && d.selected.length) setSelected(d.selected);
        if (typeof d.startH === 'number') setStartH(d.startH);
        if (typeof d.endH === 'number') setEndH(d.endH);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ selected, startH, endH })); }
    catch (e) { /* ignore */ }
  }, [selected, startH, endH]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const addZone = (tz) => {
    if (!tz || selected.includes(tz)) { setPick(''); return; }
    setSelected((s) => [...s, tz]); setPick('');
  };
  const removeZone = (tz) => setSelected((s) => s.filter((z) => z !== tz));

  const labelOf = (tz) => ZONES.find((z) => z.tz === tz)?.label || tz.split('/').pop().replace(/_/g, ' ');

  // Pour chaque heure UTC (0-23), regarde si TOUS les fuseaux sont dans la plage ouvrable.
  const slots = useMemo(() => {
    const ref = new Date();
    ref.setUTCMinutes(0, 0, 0);
    const arr = [];
    for (let h = 0; h < 24; h++) {
      const d = new Date(ref);
      d.setUTCHours(h);
      const local = Math.floor(hourIn(localTz, d));
      const within = selected.map((tz) => {
        const lh = Math.floor(hourIn(tz, d));
        return lh >= startH && lh < endH;
      });
      arr.push({ utc: h, localLabel: `${String(local).padStart(2, '0')}h`, within, all: within.every(Boolean) });
    }
    return arr;
  }, [selected, startH, endH, localTz]);

  const goodCount = slots.filter((s) => s.all).length;
  const available = ZONES.filter((z) => !selected.includes(z.tz));

  return (
    <div className="wtm">
      <style>{`
        .wtm{color:#eaf2fb;max-width:920px;margin:0 auto}
        .wtm h1{font-size:1.6rem;margin:0 0 4px}
        .wtm .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .wtm-top{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:16px}
        .wtm-f{display:flex;flex-direction:column;gap:5px}
        .wtm-f label{font-size:.78rem;color:#9fb6cf}
        .wtm select,.wtm input{background:rgba(10,22,40,.6);border:1px solid rgba(255,255,255,.18);border-radius:9px;color:#eaf2fb;padding:9px 11px;font-size:.95rem}
        .wtm select:focus,.wtm input:focus{outline:none;border-color:#5b9dff}
        .wtm-clocks{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:20px}
        .wtm-clock{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;position:relative}
        .wtm-clock .city{font-size:.9rem;color:#9fb6cf;margin-bottom:4px;padding-right:18px}
        .wtm-clock .t{font-size:1.8rem;font-weight:800;color:#ffae3b;letter-spacing:1px}
        .wtm-clock .d{font-size:.78rem;color:#9fb6cf;margin-top:2px}
        .wtm-clock.work{border-color:rgba(91,200,140,.5);background:rgba(91,200,140,.1)}
        .wtm-clock .badge{position:absolute;top:10px;right:10px;font-size:.7rem;padding:2px 7px;border-radius:10px;background:rgba(91,200,140,.25);color:#9ff0bf}
        .wtm-x{position:absolute;bottom:10px;right:10px;opacity:.5;cursor:pointer;font-size:.8rem}
        .wtm-x:hover{opacity:1;color:#ff8a8a}
        .wtm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
        .wtm-card h2{font-size:1.05rem;margin:0 0 4px}
        .wtm-card .hint{color:#9fb6cf;font-size:.82rem;margin:0 0 12px}
        .wtm-grid{display:grid;grid-template-columns:120px 1fr;gap:6px;align-items:center;font-size:.78rem}
        .wtm-grid .lab{color:#9fb6cf;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .wtm-cells{display:grid;grid-template-columns:repeat(24,1fr);gap:2px}
        .wtm-cell{height:22px;border-radius:3px;background:rgba(255,255,255,.07)}
        .wtm-cell.in{background:linear-gradient(135deg,#5bc88c,#3fa86d)}
        .wtm-cell.allgood{box-shadow:0 0 0 2px #ffae3b inset}
        .wtm-axis{display:grid;grid-template-columns:repeat(24,1fr);gap:2px;font-size:.6rem;color:#7e94ac;margin-top:4px}
        .wtm-axis span{text-align:center}
        .wtm-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;font-size:.9rem}
        .wtm-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .wtm-leg{margin-top:12px;color:#9fb6cf;font-size:.78rem;display:flex;gap:16px;flex-wrap:wrap;align-items:center}
        .wtm-sw{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;margin-right:5px}
        @media(max-width:760px){.wtm-grid{grid-template-columns:80px 1fr}.wtm-axis span:nth-child(even){visibility:hidden}}
      `}</style>

      {goBack && <button className="wtm-btn ghost" style={{ marginBottom: 14 }} onClick={goBack}>← Retour</button>}

      <h1>🌍 Heures du monde & réunions</h1>
      <p className="sub">Compare les fuseaux et trouve une plage de travail commune. 100 % hors-ligne (Intl natif).</p>

      <div className="wtm-top">
        <div className="wtm-f" style={{ flex: 1, minWidth: 200 }}>
          <label>Ajouter un fuseau / une ville</label>
          <select value={pick} onChange={(e) => addZone(e.target.value)}>
            <option value="">＋ Choisir…</option>
            {available.map((z) => <option key={z.tz} value={z.tz}>{z.label} ({z.tz})</option>)}
          </select>
        </div>
        <div className="wtm-f">
          <label>Début ouvrable</label>
          <input type="number" min="0" max="23" style={{ width: 80 }} value={startH}
                 onChange={(e) => setStartH(Math.max(0, Math.min(23, Number(e.target.value))))} />
        </div>
        <div className="wtm-f">
          <label>Fin ouvrable</label>
          <input type="number" min="1" max="24" style={{ width: 80 }} value={endH}
                 onChange={(e) => setEndH(Math.max(1, Math.min(24, Number(e.target.value))))} />
        </div>
      </div>

      <div className="wtm-clocks">
        {selected.map((tz) => {
          const h = Math.floor(hourIn(tz, now));
          const work = h >= startH && h < endH;
          return (
            <div key={tz} className={`wtm-clock ${work ? 'work' : ''}`}>
              {work && <span className="badge">ouvrable</span>}
              <div className="city">{labelOf(tz)}</div>
              <div className="t">{fmtTime(tz, now)}</div>
              <div className="d">{fmtDay(tz, now)}</div>
              <span className="wtm-x" title="Retirer" onClick={() => removeZone(tz)}>✕</span>
            </div>
          );
        })}
        {selected.length === 0 && (
          <div className="wtm-clock"><div className="city">Aucun fuseau — ajoutes-en un ci-dessus.</div></div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="wtm-card">
          <h2>Plage commune ({startH}h–{endH}h)</h2>
          <p className="hint">
            {goodCount > 0
              ? `${goodCount} heure(s) où tout le monde est dans ses heures ouvrables (liseré orange). Colonnes = heure locale de ${labelOf(localTz)}.`
              : `Aucune heure ne tombe dans la plage ouvrable de tous les fuseaux. Élargis la plage ou retire un fuseau.`}
          </p>

          <div className="wtm-grid">
            {selected.map((tz, zi) => (
              <React.Fragment key={tz}>
                <div className="lab" title={tz}>{labelOf(tz)}</div>
                <div className="wtm-cells">
                  {slots.map((s) => (
                    <div key={s.utc}
                         className={`wtm-cell ${s.within[zi] ? 'in' : ''} ${s.all ? 'allgood' : ''}`}
                         title={`${labelOf(tz)} · col ${s.localLabel} locale`} />
                  ))}
                </div>
              </React.Fragment>
            ))}
            <div className="lab" style={{ color: '#ffae3b' }}>{labelOf(localTz)} (vous)</div>
            <div className="wtm-axis">
              {slots.map((s) => <span key={s.utc}>{s.localLabel}</span>)}
            </div>
          </div>

          <div className="wtm-leg">
            <span><span className="wtm-sw" style={{ background: 'linear-gradient(135deg,#5bc88c,#3fa86d)' }} />Heures ouvrables</span>
            <span><span className="wtm-sw" style={{ background: 'rgba(255,255,255,.07)', boxShadow: '0 0 0 2px #ffae3b inset' }} />Commun à tous</span>
          </div>
        </div>
      )}
    </div>
  );
}
