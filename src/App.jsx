import React, { useState } from 'react';
import './App.css';

// Import tool components
import AesEncryptor from './tools/AesEncryptor';
import ExifCleaner from './tools/ExifCleaner';
import KeyGenerator from './tools/KeyGenerator';
import HashCalculator from './tools/HashCalculator';
import Bip39Generator from './tools/Bip39Generator';
import Steganography from './tools/Steganography';
import PasswordAnalyzer from './tools/PasswordAnalyzer';
import HttpInspector from './tools/HttpInspector';

export default function App() {
  const [activeTool, setActiveTool] = useState(null); // null means dashboard

  const toolsList = [
    {
      id: 'aes_encryptor',
      title: "Chiffreur AES-256",
      desc: "Chiffrez vos fichiers avec mot de passe de manière militaire 100% hors-ligne.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      component: <AesEncryptor goBack={() => setActiveTool(null)} />
    },
    {
      id: 'exif_cleaner',
      title: "Nettoyeur de Métadonnées",
      desc: "Purgez les coordonnées GPS, la marque de caméra et les tags EXIF de vos photos.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      component: <ExifCleaner goBack={() => setActiveTool(null)} />
    },
    {
      id: 'key_generator',
      title: "Générateur Clés PGP/SSH",
      desc: "Générez des paires de clés asymétriques RSA/ECDSA sécurisées dans le navigateur.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a5 5 0 110-10 5 5 0 010 10zM19 19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2z" />
        </svg>
      ),
      component: <KeyGenerator goBack={() => setActiveTool(null)} />
    },
    {
      id: 'hash_calculator',
      title: "Calculateur de Hash",
      desc: "Calculez les codes d'empreintes cryptographiques SHA-256 et SHA-512 pour textes et fichiers.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      component: <HashCalculator goBack={() => setActiveTool(null)} />
    },
    {
      id: 'bip39_generator',
      title: "Phrases BIP39 (Mnémonique)",
      desc: "Créez des phrases de récupération à partir d'entropie récoltée par vos mouvements.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a5 5 0 110-10 5 5 0 010 10zM19 19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2z" />
        </svg>
      ),
      component: <Bip39Generator goBack={() => setActiveTool(null)} />
    },
    {
      id: 'steganography',
      title: "Stéganographie Locale",
      desc: "Disimulez du texte secret ou décodez des informations cachées dans les images PNG.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      component: <Steganography goBack={() => setActiveTool(null)} />
    },
    {
      id: 'password_analyzer',
      title: "Analyseur Mots de Passe",
      desc: "Vérifiez l'entropie et la résistance de vos clés de sécurité face au piratage par force brute.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.57V9m12 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      component: <PasswordAnalyzer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'http_inspector',
      title: "Inspecteur HTTP/Redirections",
      desc: "Tracez la chaîne de redirection complète et analysez les en-têtes CSP et HSTS d'un site.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      component: <HttpInspector goBack={() => setActiveTool(null)} />
    }
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool);

  return (
    <div className="forge-container">
      {/* Sidebar (Navigation) */}
      <aside className="forge-sidebar no-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="#" className="forge-logo-wrapper" onClick={(e) => { e.preventDefault(); setActiveTool(null); }}>
            <div className="forge-logo-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #db2777)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24, color: 'white'}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="forge-logo-text">Forge Sécurité</span>
              <span className="forge-logo-sub">par PGRG.ca</span>
            </div>
          </a>
        </div>

        <div className="forge-menu">
          <button 
            className={`forge-menu-btn ${activeTool === null ? 'active' : ''}`}
            onClick={() => setActiveTool(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 18, height: 18}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Tableau de bord
          </button>

          <span className="forge-menu-title">Sécurité & Chiffrement</span>
          {toolsList.map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="status-badge status-badge-success" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#f87171' }}>
            <span style={{width:6, height:6, borderRadius:'50%', backgroundColor:'currentColor'}} />
            Suite Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Exécution locale (Port 5185)
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="forge-workspace">
        <div className="forge-glow-1" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)' }}></div>
        <div className="forge-glow-2" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)' }}></div>

        {activeTool === null ? (
          // Dashboard landing view
          <section style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="page-title">Forge Sécurité & Confidentialité</h1>
            <p className="page-subtitle">Découvrez notre gamme d'outils premium 100% locaux dédiés à la protection de votre vie privée et au chiffrement de vos fichiers.</p>

            <span className="forge-menu-title" style={{ marginLeft: 0 }}>Outils Disponibles</span>
            <div className="dashboard-grid">
              {toolsList.map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#f87171' }}>{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          // Active tool panel view
          <section style={{ position: 'relative', zIndex: 10 }}>
            {activeToolObj?.component}
          </section>
        )}
      </main>
    </div>
  );
}
