import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CoteRGPA({ goBack }) {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('ff_student_gpa');
    return saved ? JSON.parse(saved) : [
      { id: '1', code: 'INF1007', credits: 3, grade: 'A', zScore: 1.2, isg: 29.5 },
      { id: '2', code: 'MTH1002', credits: 4, grade: 'B+', zScore: 0.8, isg: 28.0 }
    ];
  });

  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('A');
  const [zScore, setZScore] = useState('');
  const [isg, setIsg] = useState('');

  const gradeValues = {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'E': 0.0, 'F': 0.0
  };

  useEffect(() => {
    localStorage.setItem('ff_student_gpa', JSON.stringify(courses));
  }, [courses]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!code || !credits) return;

    const newCourse = {
      id: Date.now().toString(),
      code: code.toUpperCase(),
      credits: parseFloat(credits),
      grade,
      zScore: zScore ? parseFloat(zScore) : null,
      isg: isg ? parseFloat(isg) : null
    };

    setCourses([...courses, newCourse]);
    setCode('');
    setCredits('');
    setGrade('A');
    setZScore('');
    setIsg('');
  };

  const handleDelete = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const weightedGpaPoints = courses.reduce((sum, c) => sum + (c.credits * (gradeValues[c.grade] || 0)), 0);
  const gpa = totalCredits > 0 ? weightedGpaPoints / totalCredits : 0;

  const coteRCourses = courses.filter(c => c.zScore !== null && c.isg !== null);
  const averageCoteR = coteRCourses.length > 0
    ? coteRCourses.reduce((sum, c) => sum + (((c.zScore + (c.isg - 25) / 5) * 5) + 25), 0) / coteRCourses.length
    : 0;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🎓 Calculateur Cote R & GPA
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Suivez votre performance académique universitaire (GPA) et estimez votre Cote R collégiale.
          </p>
        </div>
        <FolderButton toolId="gpa_calculator" toolName="CoteRGPA" localStorageKeys={["ff_student_gpa"]} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GPA Cumulatif (sur 4.3)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
            {gpa.toFixed(2)}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cote R Estimée Moyenne</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {averageCoteR > 0 ? averageCoteR.toFixed(2) : 'N/A'}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Crédits Cumulés</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
            {totalCredits} crédits
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Table of courses */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Cours Enregistrés</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: 10 }}>Sigle</th>
                <th style={{ padding: 10 }}>Crédits</th>
                <th style={{ padding: 10 }}>Note</th>
                <th style={{ padding: 10 }}>Score Z</th>
                <th style={{ padding: 10 }}>ISG (Groupe)</th>
                <th style={{ padding: 10 }}>Cote R</th>
                <th style={{ padding: 10 }} className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Aucun cours dans le relevé.
                  </td>
                </tr>
              ) : (
                courses.map(c => {
                  const itemCoteR = (c.zScore !== null && c.isg !== null)
                    ? ((c.zScore + (c.isg - 25) / 5) * 5) + 25
                    : null;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                      <td style={{ padding: 10, fontWeight: 'bold', color: 'white' }}>{c.code}</td>
                      <td style={{ padding: 10 }}>{c.credits}</td>
                      <td style={{ padding: 10 }}>{c.grade} ({gradeValues[c.grade]})</td>
                      <td style={{ padding: 10 }}>{c.zScore !== null ? c.zScore : '-'}</td>
                      <td style={{ padding: 10 }}>{c.isg !== null ? c.isg : '-'}</td>
                      <td style={{ padding: 10, color: '#10b981', fontWeight: 'bold' }}>
                        {itemCoteR !== null ? itemCoteR.toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ padding: 10 }} className="no-print">
                        <button onClick={() => handleDelete(c.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          Retirer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Input panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Ajouter un cours</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Code du cours (ex: INF1007)</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="input-premium" required placeholder="INF1007" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Crédits</label>
              <input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} className="input-premium" required placeholder="3" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Note obtenue</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                {Object.keys(gradeValues).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>Cote R (CEGEP uniquement)</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score Z</label>
                <input type="number" step="0.01" value={zScore} onChange={(e) => setZScore(e.target.value)} className="input-premium" placeholder="1.2" style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ISG</label>
                <input type="number" step="0.1" value={isg} onChange={(e) => setIsg(e.target.value)} className="input-premium" placeholder="28.5" style={{ width: '100%', marginTop: 4 }} />
              </div>
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter le cours
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}