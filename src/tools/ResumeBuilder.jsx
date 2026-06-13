import React, { useState, useEffect } from 'react';

/**
 * ResumeBuilder — créateur de CV guidé, 100 % local & hors-ligne.
 * Formulaire à gauche, aperçu CV mis en page A4 à droite.
 * Export via window.print() (contrôles en no-print). Persistance localStorage.
 */

const LS_KEY = 'ff_resume_builder_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

const DEFAULT = {
  fullName: 'Camille Dupont',
  title: 'Développeuse web',
  email: 'camille.dupont@email.fr',
  phone: '06 12 34 56 78',
  city: 'Lyon, France',
  link: 'linkedin.com/in/camilledupont',
  summary: "Développeuse passionnée avec 5 ans d'expérience en création d'applications web modernes et performantes.",
  exp: [{ id: uid(), role: 'Développeuse front-end', org: 'TechCorp', period: '2021 — Aujourd\'hui', desc: 'Conception d\'interfaces React, optimisation des performances, encadrement de juniors.' }],
  edu: [{ id: uid(), deg: 'Master Informatique', org: 'Université de Lyon', period: '2016 — 2018' }],
  skills: 'React, JavaScript, CSS, Node.js, Git, UX/UI',
};

export default function ResumeBuilder({ goBack }) {
  const [cv, setCv] = useState(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) return { ...DEFAULT, ...JSON.parse(raw) }; } catch (e) { /* ignore */ }
    return DEFAULT;
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cv)); } catch (e) { /* ignore */ }
  }, [cv]);

  const set = (k, v) => setCv((c) => ({ ...c, [k]: v }));
  const setList = (k, id, field, v) => setCv((c) => ({ ...c, [k]: c[k].map((it) => it.id === id ? { ...it, [field]: v } : it) }));
  const addExp = () => setCv((c) => ({ ...c, exp: [...c.exp, { id: uid(), role: '', org: '', period: '', desc: '' }] }));
  const addEdu = () => setCv((c) => ({ ...c, edu: [...c.edu, { id: uid(), deg: '', org: '', period: '' }] }));
  const delItem = (k, id) => setCv((c) => ({ ...c, [k]: c[k].filter((it) => it.id !== id) }));
  const skillList = cv.skills.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="cvb">
      <style>{`
        .cvb{color:#eaf2fb;max-width:1100px;margin:0 auto}
        .cvb h1{font-size:1.6rem;margin:0 0 4px}
        .cvb .sub{color:#9fb6cf;font-size:.9rem;margin:0 0 18px}
        .cvb-grid{display:grid;grid-template-columns:380px 1fr;gap:20px;align-items:start}
        .cvb-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;margin-bottom:14px}
        .cvb-card h3{font-size:.92rem;margin:0 0 10px}
        .cvb input,.cvb textarea{width:100%;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);color:#eaf2fb;border-radius:8px;padding:8px 10px;font-size:.85rem;margin-bottom:8px;box-sizing:border-box}
        .cvb textarea{min-height:60px;resize:vertical}
        .cvb-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .cvb-btn{background:linear-gradient(135deg,#ff7a18,#ffae3b);color:#1b1300;border:none;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:.85rem}
        .cvb-btn.ghost{background:rgba(255,255,255,.08);color:#eaf2fb;border:1px solid rgba(255,255,255,.18)}
        .cvb-blk{border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px;margin-bottom:8px}
        .cvb-blk-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
        .cvb-x{background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:.95rem}

        /* ---- aperçu CV A4 ---- */
        .cvb-paper{background:#fff;color:#1a2330;border-radius:8px;padding:38px 40px;font-family:Georgia,'Times New Roman',serif;line-height:1.45;box-shadow:0 10px 40px rgba(0,0,0,.35);max-width:794px}
        .cvb-paper .cv-name{font-size:1.9rem;font-weight:700;margin:0;color:#16314f}
        .cvb-paper .cv-title{font-size:1rem;color:#ff7a18;font-weight:700;margin:2px 0 8px;letter-spacing:.03em}
        .cvb-paper .cv-contact{font-size:.8rem;color:#445;display:flex;flex-wrap:wrap;gap:4px 14px;border-bottom:2px solid #16314f;padding-bottom:12px;margin-bottom:16px}
        .cvb-paper .cv-sec{font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;color:#16314f;font-weight:700;border-bottom:1px solid #d7dde6;padding-bottom:3px;margin:16px 0 8px}
        .cvb-paper .cv-sum{font-size:.86rem;color:#333}
        .cvb-paper .cv-item{margin-bottom:10px}
        .cvb-paper .cv-item .row{display:flex;justify-content:space-between;gap:10px}
        .cvb-paper .cv-item .role{font-weight:700;font-size:.92rem;color:#1a2330}
        .cvb-paper .cv-item .org{font-size:.85rem;color:#ff7a18}
        .cvb-paper .cv-item .per{font-size:.78rem;color:#667;white-space:nowrap}
        .cvb-paper .cv-item .desc{font-size:.82rem;color:#444;margin-top:2px}
        .cvb-paper .cv-skills{display:flex;flex-wrap:wrap;gap:6px}
        .cvb-paper .cv-skills span{background:#eef2f7;border:1px solid #d7dde6;color:#16314f;font-size:.78rem;padding:3px 10px;border-radius:14px;font-family:Arial,sans-serif}

        @media(max-width:760px){.cvb-grid{grid-template-columns:1fr}.cvb-paper{padding:24px}}
        @media print{
          .no-print{display:none !important}
          .cvb,.cvb-grid{display:block;max-width:none;margin:0}
          .cvb-paper{box-shadow:none;border-radius:0;max-width:none;padding:0;margin:0}
          @page{size:A4;margin:16mm}
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {goBack && <button className="cvb-btn ghost" onClick={goBack}>← Retour</button>}
        <button className="cvb-btn" onClick={() => window.print()}>🖨️ Imprimer / PDF</button>
      </div>

      <h1 className="no-print">📄 Créateur de CV</h1>
      <p className="sub no-print">Remplis les sections à gauche, l'aperçu A4 se met à jour à droite. Imprime ou exporte en PDF. Tout reste sur ton appareil.</p>

      <div className="cvb-grid">
        {/* ---------- Formulaire ---------- */}
        <div className="no-print">
          <div className="cvb-card">
            <h3>👤 Coordonnées</h3>
            <input placeholder="Nom complet" value={cv.fullName} onChange={(e) => set('fullName', e.target.value)} />
            <input placeholder="Titre / poste visé" value={cv.title} onChange={(e) => set('title', e.target.value)} />
            <div className="cvb-2">
              <input placeholder="Email" value={cv.email} onChange={(e) => set('email', e.target.value)} />
              <input placeholder="Téléphone" value={cv.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="cvb-2">
              <input placeholder="Ville" value={cv.city} onChange={(e) => set('city', e.target.value)} />
              <input placeholder="Lien (LinkedIn, site…)" value={cv.link} onChange={(e) => set('link', e.target.value)} />
            </div>
          </div>

          <div className="cvb-card">
            <h3>✍️ Résumé</h3>
            <textarea placeholder="Quelques phrases sur votre profil…" value={cv.summary} onChange={(e) => set('summary', e.target.value)} />
          </div>

          <div className="cvb-card">
            <h3>💼 Expériences</h3>
            {cv.exp.map((x) => (
              <div className="cvb-blk" key={x.id}>
                <div className="cvb-blk-h">
                  <strong style={{ fontSize: '.8rem', color: '#9fb6cf' }}>Expérience</strong>
                  <button className="cvb-x" onClick={() => delItem('exp', x.id)} title="Supprimer">✕</button>
                </div>
                <input placeholder="Poste" value={x.role} onChange={(e) => setList('exp', x.id, 'role', e.target.value)} />
                <div className="cvb-2">
                  <input placeholder="Entreprise" value={x.org} onChange={(e) => setList('exp', x.id, 'org', e.target.value)} />
                  <input placeholder="Période" value={x.period} onChange={(e) => setList('exp', x.id, 'period', e.target.value)} />
                </div>
                <textarea placeholder="Missions, résultats…" value={x.desc} onChange={(e) => setList('exp', x.id, 'desc', e.target.value)} />
              </div>
            ))}
            <button className="cvb-btn ghost" onClick={addExp}>＋ Expérience</button>
          </div>

          <div className="cvb-card">
            <h3>🎓 Formation</h3>
            {cv.edu.map((x) => (
              <div className="cvb-blk" key={x.id}>
                <div className="cvb-blk-h">
                  <strong style={{ fontSize: '.8rem', color: '#9fb6cf' }}>Diplôme</strong>
                  <button className="cvb-x" onClick={() => delItem('edu', x.id)} title="Supprimer">✕</button>
                </div>
                <input placeholder="Diplôme" value={x.deg} onChange={(e) => setList('edu', x.id, 'deg', e.target.value)} />
                <div className="cvb-2">
                  <input placeholder="Établissement" value={x.org} onChange={(e) => setList('edu', x.id, 'org', e.target.value)} />
                  <input placeholder="Période" value={x.period} onChange={(e) => setList('edu', x.id, 'period', e.target.value)} />
                </div>
              </div>
            ))}
            <button className="cvb-btn ghost" onClick={addEdu}>＋ Formation</button>
          </div>

          <div className="cvb-card">
            <h3>🛠️ Compétences</h3>
            <input placeholder="Séparées par des virgules" value={cv.skills} onChange={(e) => set('skills', e.target.value)} />
          </div>
        </div>

        {/* ---------- Aperçu A4 ---------- */}
        <div className="cvb-paper">
          <h1 className="cv-name">{cv.fullName || 'Votre Nom'}</h1>
          <div className="cv-title">{cv.title || 'Titre professionnel'}</div>
          <div className="cv-contact">
            {cv.email && <span>✉ {cv.email}</span>}
            {cv.phone && <span>☎ {cv.phone}</span>}
            {cv.city && <span>📍 {cv.city}</span>}
            {cv.link && <span>🔗 {cv.link}</span>}
          </div>

          {cv.summary && (<><div className="cv-sec">Profil</div><p className="cv-sum">{cv.summary}</p></>)}

          {cv.exp.some((x) => x.role || x.org) && (
            <>
              <div className="cv-sec">Expériences professionnelles</div>
              {cv.exp.filter((x) => x.role || x.org || x.desc).map((x) => (
                <div className="cv-item" key={x.id}>
                  <div className="row">
                    <span className="role">{x.role || 'Poste'}{x.org && <span className="org"> — {x.org}</span>}</span>
                    <span className="per">{x.period}</span>
                  </div>
                  {x.desc && <div className="desc">{x.desc}</div>}
                </div>
              ))}
            </>
          )}

          {cv.edu.some((x) => x.deg || x.org) && (
            <>
              <div className="cv-sec">Formation</div>
              {cv.edu.filter((x) => x.deg || x.org).map((x) => (
                <div className="cv-item" key={x.id}>
                  <div className="row">
                    <span className="role">{x.deg || 'Diplôme'}{x.org && <span className="org"> — {x.org}</span>}</span>
                    <span className="per">{x.period}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {skillList.length > 0 && (
            <>
              <div className="cv-sec">Compétences</div>
              <div className="cv-skills">{skillList.map((s, i) => <span key={i}>{s}</span>)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
