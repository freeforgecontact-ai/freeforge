import React, { useState, useEffect, useMemo } from 'react';

/**
 * SchedulePlanner — planificateur d'horaire de cours, 100 % local & hors-ligne.
 * Grille hebdomadaire Lun-Ven, ajout de cours (nom, jour, heure, local, couleur),
 * affichage coloré, et liste de rappels d'examens (date, cours).
 * Mémorisation dans le navigateur. Aucune connexion, aucune donnée envoyée.
 */

const LS_KEY = 'schedule_planner_v1';
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8h -> 19h
const COLORS = ['#ff7a18', '#ffae3b', '#5b9dff', '#37c98a', '#c77dff', '#ff6b9d', '#4dd0e1', '#ffd54f'];
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

export default function SchedulePlanner() {
  const [courses, setCourses] = useState([]); // {id,name,day,start,end,room,color}
  const [exams, setExams] = useState([]);     // {id,course,date}
  const [form, setForm] = useState({ name: '', day: 'Lun', start: '08:00', end: '10:00', room: '', color: COLORS[0] });
  const [exam, setExam] = useState({ course: '', date: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.courses)) setCourses(d.courses);
        if (Array.isArray(d.exams)) setExams(d.exams);
      }
    } catch (e) { /* localStorage corrompu : ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ courses, exams })); } catch (e) { /* quota : ignore */ }
  }, [courses, exams]);

  const addCourse = () => {
    if (!form.name.trim()) return;
    if (toMin(form.end) <= toMin(form.start)) return;
    setCourses((c) => [...c, { id: uid(), ...form, name: form.name.trim(), room: form.room.trim() }]);
    setForm((f) => ({ ...f, name: '', room: '', color: COLORS[(COLORS.indexOf(f.color) + 1) % COLORS.length] }));
  };
  const delCourse = (id) => setCourses((c) => c.filter((x) => x.id !== id));

  const addExam = () => {
    if (!exam.course.trim() || !exam.date) return;
    setExams((e) => [...e, { id: uid(), course: exam.course.trim(), date: exam.date }]);
    setExam({ course: '', date: '' });
  };
  const delExam = (id) => setExams((e) => e.filter((x) => x.id !== id));

  const dayStart = HOURS[0] * 60, dayEnd = (HOURS[HOURS.length - 1] + 1) * 60, span = dayEnd - dayStart;

  const sortedExams = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams]);
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = (d) => Math.ceil((new Date(d + 'T00:00') - new Date(today + 'T00:00')) / 86400000);

  return (
    <div className="schp">
      <style>{`
        .schp{color:#eaf2fb;max-width:980px;margin:0 auto}
        .schp h1{font-size:1.55rem;margin:0 0 4px}
        .schp .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 16px}
        .schp-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;margin-bottom:16px}
        .schp-card h2{font-size:1.05rem;margin:0 0 12px}
        .schp-form{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
        .schp input,.schp select{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);color:#eaf2fb;border-radius:9px;padding:9px 10px;font-size:.88rem;font-family:inherit}
        .schp input:focus,.schp select:focus{outline:none;border-color:#5b9dff}
        .schp input[type=color]{padding:3px;width:42px;height:38px;cursor:pointer}
        .schp-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:9px;padding:10px 15px;font-weight:700;cursor:pointer;font-size:.88rem}
        .schp-grid{display:grid;grid-template-columns:46px repeat(5,1fr);gap:0;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
        .schp-head{background:rgba(91,157,255,.18);padding:9px 4px;text-align:center;font-weight:700;font-size:.86rem;border-bottom:1px solid rgba(255,255,255,.12)}
        .schp-htime{background:rgba(91,157,255,.18);border-bottom:1px solid rgba(255,255,255,.12)}
        .schp-col{position:relative;border-left:1px solid rgba(255,255,255,.08);min-height:${span / 60 * 46}px}
        .schp-times{position:relative}
        .schp-times span{position:absolute;right:5px;font-size:.68rem;color:#9fb6cf;transform:translateY(-6px)}
        .schp-line{position:absolute;left:0;right:0;border-top:1px dashed rgba(255,255,255,.07)}
        .schp-ev{position:absolute;left:3px;right:3px;border-radius:7px;padding:4px 6px;font-size:.72rem;color:#1b1300;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer}
        .schp-ev b{display:block;font-size:.78rem;line-height:1.1}
        .schp-ev small{opacity:.85}
        .schp-ev .x{position:absolute;top:1px;right:4px;font-weight:800;opacity:0}
        .schp-ev:hover .x{opacity:.9}
        .schp-exam{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:8px}
        .schp-exam .badge{background:rgba(91,157,255,.25);border:1px solid rgba(91,157,255,.5);border-radius:8px;padding:4px 9px;font-size:.78rem;white-space:nowrap}
        .schp-exam .badge.soon{background:rgba(220,120,60,.28);border-color:rgba(255,150,80,.6);color:#ffd9bd}
        .schp-exam .badge.past{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);color:#9fb6cf}
        .schp-exam .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .schp-exam small{color:#9fb6cf}
        .schp-x{opacity:.55;cursor:pointer;font-size:.9rem}
        .schp-x:hover{opacity:1;color:#ff8a8a}
        .schp-empty{color:#9fb6cf;font-size:.88rem;text-align:center;padding:14px 4px}
        @media(max-width:760px){.schp-form input,.schp-form select{flex:1;min-width:90px}.schp-ev{font-size:.64rem;padding:2px 4px}.schp-grid{grid-template-columns:34px repeat(5,1fr)}}
      `}</style>

      <h1>📅 Planificateur d'horaire</h1>
      <p className="sub">Grille Lun-Ven, cours colorés et rappels d'examens — mémorisé dans ton navigateur. Rien n'est envoyé sur Internet.</p>

      <div className="schp-card">
        <h2>Ajouter un cours</h2>
        <div className="schp-form">
          <input placeholder="Nom du cours" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flexGrow: 1, minWidth: 140 }} />
          <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          <span style={{ color: '#9fb6cf' }}>→</span>
          <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          <input placeholder="Local" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} style={{ width: 80 }} />
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} title="Couleur" />
          <button className="schp-btn" onClick={addCourse}>＋ Ajouter</button>
        </div>
      </div>

      <div className="schp-card">
        <h2>Emploi du temps</h2>
        <div className="schp-grid">
          <div className="schp-htime schp-head" />
          {DAYS.map((d) => <div key={d} className="schp-head">{d}</div>)}

          <div className="schp-times" style={{ minHeight: span / 60 * 46 }}>
            {HOURS.map((h, i) => <span key={h} style={{ top: i * 46 }}>{h}h</span>)}
          </div>
          {DAYS.map((d) => (
            <div key={d} className="schp-col">
              {HOURS.map((h, i) => <div key={h} className="schp-line" style={{ top: i * 46 }} />)}
              {courses.filter((c) => c.day === d).map((c) => {
                const top = (toMin(c.start) - dayStart) / span * (span / 60 * 46);
                const height = Math.max(20, (toMin(c.end) - toMin(c.start)) / span * (span / 60 * 46));
                return (
                  <div key={c.id} className="schp-ev" style={{ top, height, background: c.color }} title={`${c.name} ${c.start}-${c.end} ${c.room}`}>
                    <span className="x" onClick={() => delCourse(c.id)}>✕</span>
                    <b>{c.name}</b>
                    <small>{c.start}–{c.end}{c.room ? ` · ${c.room}` : ''}</small>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="schp-card">
        <h2>📝 Rappels d'examens</h2>
        <div className="schp-form" style={{ marginBottom: 14 }}>
          <input placeholder="Cours / matière" value={exam.course} onChange={(e) => setExam({ ...exam, course: e.target.value })} style={{ flexGrow: 1, minWidth: 140 }} />
          <input type="date" value={exam.date} onChange={(e) => setExam({ ...exam, date: e.target.value })} />
          <button className="schp-btn" onClick={addExam}>＋ Ajouter</button>
        </div>
        {sortedExams.length === 0 ? (
          <div className="schp-empty">Aucun examen programmé.</div>
        ) : sortedExams.map((x) => {
          const dl = daysLeft(x.date);
          const cls = dl < 0 ? 'past' : dl <= 7 ? 'soon' : '';
          const lbl = dl < 0 ? 'Passé' : dl === 0 ? "Aujourd'hui" : dl === 1 ? 'Demain' : `Dans ${dl} j`;
          return (
            <div key={x.id} className="schp-exam">
              <span className={`badge ${cls}`}>{lbl}</span>
              <span className="nm">{x.course}</span>
              <small>{x.date}</small>
              <span className="schp-x" onClick={() => delExam(x.id)} title="Supprimer">✕</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
