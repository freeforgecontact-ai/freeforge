import React, { useState } from 'react';

// Import tool components
import ImageCompressor from './tools/ImageCompressor';
import Glassmorphism from './tools/Glassmorphism';
import JsonFormatter from './tools/JsonFormatter';
import SvgOptimizer from './tools/SvgOptimizer';
import MarkdownEditor from './tools/MarkdownEditor';
import Id3Editor from './tools/Id3Editor';
import AudioTrimmer from './tools/AudioTrimmer';
import WaveformVideo from './tools/WaveformVideo';
import VibeLocal from './tools/VibeLocal';

// Import Quebec SMB tool components
import FactureBuilder from './tools/FactureBuilder';
import CalculateurTaxes from './tools/CalculateurTaxes';
import AutonomeCalculateur from './tools/AutonomeCalculateur';
import SoumissionBuilder from './tools/SoumissionBuilder';
import ShiftScheduler from './tools/ShiftScheduler';
import RegistreKilo from './tools/RegistreKilo';
import AffairesPlan from './tools/AffairesPlan';
import ReceiptLogger from './tools/ReceiptLogger';

export default function App() {
  const [activeTool, setActiveTool] = useState(null); // null means dashboard

  // Tool categories and definitions
  const toolsList = [
    {
      id: 'compressor',
      title: 'Compresseur d\'Images',
      desc: 'Optimisez et redimensionnez vos images en lot (JPEG, PNG, WebP) à 100% localement.',
      category: 'productivity',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      component: <ImageCompressor goBack={() => setActiveTool(null)} />
    },
    {
      id: 'glassmorphism',
      title: 'Générateur Glassmorphism',
      desc: 'Concevez vos styles de verre acrylique en temps réel et copiez le CSS / Tailwind.',
      category: 'devdesign',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      component: <Glassmorphism goBack={() => setActiveTool(null)} />
    },
    {
      id: 'json',
      title: 'Formatteur & Arbre JSON',
      desc: 'Formatez, validez et explorez vos fichiers JSON sous forme d\'arborescence pliable.',
      category: 'devdesign',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      component: <JsonFormatter goBack={() => setActiveTool(null)} />
    },
    {
      id: 'svg',
      title: 'Optimiseur & Coloriseur SVG',
      desc: 'Nettoyez vos fichiers vectoriels SVG, modifiez leurs couleurs et exportez-les.',
      category: 'devdesign',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      component: <SvgOptimizer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'markdown',
      title: 'Éditeur Markdown vers PDF',
      desc: 'Éditez en Markdown avec prévisualisation en direct et générez des PDF premium.',
      category: 'productivity',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      component: <MarkdownEditor goBack={() => setActiveTool(null)} />
    },
    {
      id: 'id3',
      title: 'Éditeur de Tags ID3',
      desc: 'Modifiez les métadonnées (Titre, Artiste, Jaquette d\'album) de vos fichiers audio MP3.',
      category: 'media',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      component: <Id3Editor goBack={() => setActiveTool(null)} />
    },
    {
      id: 'trimmer',
      title: 'Découpeur Audio',
      desc: 'Coupez vos fichiers audio WAV ou MP3 directement dans le navigateur.',
      category: 'media',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7a3 3 0 11-6 0 3 3 0 016 0zm-3 7H4M4 4h4" />
        </svg>
      ),
      component: <AudioTrimmer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'waveform',
      title: 'Générateur Waveform Vidéo',
      desc: 'Transformez vos fichiers audio en vidéos MP4 animées avec spectre pour vos réseaux.',
      category: 'media',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      component: <WaveformVideo goBack={() => setActiveTool(null)} />
    },
    {
      id: 'vibelocal',
      title: 'Radio Premium Local',
      desc: 'Écoutez, recherchez et téléchargez votre musique en local sans publicité avec lecture automatique intelligente.',
      category: 'media',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      component: <VibeLocal goBack={() => setActiveTool(null)} />
    },
    {
      id: 'facture',
      title: 'Factures Professionnelles',
      desc: 'Concevez vos factures avec logo, taxes TPS/TVQ et export PDF imprimable.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      component: <FactureBuilder goBack={() => setActiveTool(null)} />
    },
    {
      id: 'taxes',
      title: 'Calculateur de Taxes TPS/TVQ',
      desc: 'Calculez la TPS (5%) et la TVQ (9,975%) de façon directe ou inverse.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      component: <CalculateurTaxes goBack={() => setActiveTool(null)} />
    },
    {
      id: 'autonome',
      title: 'Simulateur Impôt & Cotisations',
      desc: 'Calculez votre salaire net après impôts provincial/fédéral et cotisations RRQ/RQAP.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      component: <AutonomeCalculateur goBack={() => setActiveTool(null)} />
    },
    {
      id: 'soumission',
      title: 'Créateur de Soumissions',
      desc: 'Générez des devis avec conditions générales et zone de signature électronique.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      component: <SoumissionBuilder goBack={() => setActiveTool(null)} />
    },
    {
      id: 'scheduler',
      title: 'Horaires d\'Employés',
      desc: 'Gérez la grille d\'horaire hebdomadaire de votre équipe et vos coûts salariaux.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      component: <ShiftScheduler goBack={() => setActiveTool(null)} />
    },
    {
      id: 'registre_kilo',
      title: 'Registre Kilométrique',
      desc: 'Registre de déplacements automobiles pour vos déductions fiscales Revenu Québec.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      component: <RegistreKilo goBack={() => setActiveTool(null)} />
    },
    {
      id: 'affaires_plan',
      title: 'Plan d\'Affaires Guidé',
      desc: 'Rédigez votre plan d\'affaires pas-à-pas et exportez en Markdown ou PDF.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      component: <AffairesPlan goBack={() => setActiveTool(null)} />
    },
    {
      id: 'receipt_logger',
      title: 'Gestionnaire de Reçus & ZIP',
      desc: 'Numérisez vos reçus, ajustez-les visuellement et exportez les rapports avec photos zippées.',
      category: 'quebec_pme',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      component: <ReceiptLogger goBack={() => setActiveTool(null)} />
    }
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool);

  return (
    <div className="forge-container">
      {/* Sidebar (Navigation) */}
      <aside className="forge-sidebar no-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="#" className="forge-logo-wrapper" onClick={(e) => { e.preventDefault(); setActiveTool(null); }}>
            <div className="forge-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24, color: 'white'}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="forge-logo-text">FreeForge</span>
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

          <span className="forge-menu-title">Média & Audio</span>
          {toolsList.filter(t => t.category === 'media').map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}

          <span className="forge-menu-title">Dev & Design</span>
          {toolsList.filter(t => t.category === 'devdesign').map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}

          <span className="forge-menu-title">Productivité</span>
          {toolsList.filter(t => t.category === 'productivity').map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}

          <span className="forge-menu-title">⚜️ PME Québec</span>
          {toolsList.filter(t => t.category === 'quebec_pme').map(t => (
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
          <div className="status-badge status-badge-success">
            <span style={{width:6, height:6, borderRadius:'50%', backgroundColor:'currentColor'}} />
            100% Côté Client
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hébergement gratuit & privé
          </div>
        </div>
      </aside>

      {/* Main Workspace (Workspace window) */}
      <main className="forge-workspace" style={activeTool === 'vibelocal' ? { padding: 0 } : {}}>
        <div className="forge-glow-1"></div>
        <div className="forge-glow-2"></div>

        {activeTool === null ? (
          // Dashboard landing view
          <section style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="page-title">Bienvenue dans la Forge</h1>
            <p className="page-subtitle">Des outils de développement, traitement média et productivité 100% gratuits, sans aucune inscription ni données envoyées sur un serveur.</p>

            <span className="forge-menu-title" style={{ marginLeft: 0 }}>Média & Audio</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'media').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon">{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>

            <span className="forge-menu-title" style={{ marginLeft: 0, marginTop: 40, display: 'block' }}>Développement & Design</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'devdesign').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon">{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>

            <span className="forge-menu-title" style={{ marginLeft: 0, marginTop: 40, display: 'block' }}>Productivité</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'productivity').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon">{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>

            <span className="forge-menu-title" style={{ marginLeft: 0, marginTop: 40, display: 'block' }}>⚜️ PME Québec</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'quebec_pme').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon">{t.icon}</div>
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
