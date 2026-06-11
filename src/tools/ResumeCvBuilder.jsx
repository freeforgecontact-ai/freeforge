import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function ResumeCvBuilder({ goBack }) {
  const [name, setName] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_cv');
      return saved ? JSON.parse(saved).name : 'Jean Tremblay';
    } catch { return 'Jean Tremblay'; }
  });
  const [title, setTitle] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_cv');
      return saved ? JSON.parse(saved).title : 'Développeur Web';
    } catch { return 'Développeur Web'; }
  });
  const [email, setEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_cv');
      return saved ? JSON.parse(saved).email : 'jean.tremblay@email.com';
    } catch { return 'jean.tremblay@email.com'; }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_cv');
      return saved ? JSON.parse(saved).profile : 'Développeur passionné avec 5 ans d\'expérience...';
    } catch { return 'Développeur passionné avec 5 ans d\'expérience...'; }
  });
  const [experience, setExperience] = useState(() => {
    try {
      const saved = localStorage.getItem('fl_cv');
      return saved ? JSON.parse(saved).experience : '2022 - Présent : Développeur chez Tech solutions';
    } catch { return '2022 - Présent : Développeur chez Tech solutions'; }
  });

  useEffect(() => {
    localStorage.setItem('fl_cv', JSON.stringify({ name, title, email, profile, experience }));
  }, [name, title, email, profile, experience]);
  
  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>📄 Resume/CV Builder & PDF Export</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Créez votre curriculum vitæ professionnel prêt à imprimer en PDF.</p>
        </div>
        <FolderButton toolId="resume_builder" toolName="ResumeCvBuilder" localStorageKeys={['fl_cv']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Editor */}
        <div className="glass-panel no-print" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Champs du CV</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom complet :</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Titre Professionnel :</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Courriel :</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-premium" style={{ width: '100%', padding: 8 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profil Professionnel :</label>
            <textarea value={profile} onChange={e => setProfile(e.target.value)} className="input-premium" style={{ width: '100%', height: 80, padding: 8 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expériences :</label>
            <textarea value={experience} onChange={e => setExperience(e.target.value)} className="input-premium" style={{ width: '100%', height: 100, padding: 8 }} />
          </div>

          <button onClick={() => window.print()} className="btn-premium btn-primary" style={{ width: '100%', padding: 12, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center' }}>🖨️ Imprimer / Exporter en PDF</button>
        </div>

        {/* Paper Preview */}
        <div style={{ backgroundColor: 'white', color: '#111827', padding: '40px 30px', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', minHeight: 600, display: 'flex', flexDirection: 'column', gap: 24 }} className="cv-print-area">
          <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 16 }}>
            <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, color: '#1e3a8a' }}>{name}</h1>
            <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0 0', color: '#2563eb', fontWeight: 600 }}>{title}</h2>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: 8 }}>✉️ {email}</div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: 4, color: '#1e3a8a' }}>Profil Professionnel</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>{profile}</p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: 4, color: '#1e3a8a' }}>Expérience Professionnelle</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>{experience}</p>
          </div>
        </div>
      </div>
    </div>
  );
}