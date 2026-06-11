import React, { useState } from 'react';

// Import tool components
import CrosshairGenerator from './tools/CrosshairGenerator';
import AimSensitivity from './tools/AimSensitivity';
import FpsHardwareLogbook from './tools/FpsHardwareLogbook';
import GamertagGenerator from './tools/GamertagGenerator';
import SteamLibrarySorter from './tools/SteamLibrarySorter';
import TournamentBracket from './tools/TournamentBracket';
import RgbLightSync from './tools/RgbLightSync';
import RetroSoundGenerator from './tools/RetroSoundGenerator';

export default function App() {
  const [activeTool, setActiveTool] = useState(null); // null means dashboard

  const toolsList = [
    {
      id: 'crosshair',
      title: "Crosshair Generator",
      desc: "Concevez vos viseurs et exportez les configurations.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <CrosshairGenerator goBack={() => setActiveTool(null)} />
    },
    {
      id: 'sensitivity',
      title: "Aim Sensitivity Converter",
      desc: "Convertissez vos sensibilités souris inter-jeux.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <AimSensitivity goBack={() => setActiveTool(null)} />
    },
    {
      id: 'fps_logbook',
      title: "FPS & Hardware Logbook",
      desc: "Journalisez vos benchmarks de performance.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <FpsHardwareLogbook goBack={() => setActiveTool(null)} />
    },
    {
      id: 'gamertag',
      title: "Gamertag Generator",
      desc: "Générateur de pseudos stylisés Unicode.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <GamertagGenerator goBack={() => setActiveTool(null)} />
    },
    {
      id: 'steam_sorter',
      title: "Steam Backlog Manager",
      desc: "Organisez vos jeux à terminer intelligemment.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <SteamLibrarySorter goBack={() => setActiveTool(null)} />
    },
    {
      id: 'bracket',
      title: "Tournament Bracket Drawer",
      desc: "Générez des tournois simples ou doubles.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <TournamentBracket goBack={() => setActiveTool(null)} />
    },
    {
      id: 'rgb_designer',
      title: "RGB Light Sync Designer",
      desc: "Simulateur de profil lumineux de clavier.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <RgbLightSync goBack={() => setActiveTool(null)} />
    },
    {
      id: 'sound_generator',
      title: "8-Bit Retro Sound Generator",
      desc: "Générateur de sons rétro avec Web Audio.",
      category: 'main',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <RetroSoundGenerator goBack={() => setActiveTool(null)} />
    }
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool);

  return (
    <div className="forge-container">
      {/* Sidebar (Navigation) */}
      <aside className="forge-sidebar no-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="#" className="forge-logo-wrapper" onClick={(e) => { e.preventDefault(); setActiveTool(null); }}>
            <div className="forge-logo-icon" style={{ background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24, color: 'white'}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="forge-logo-text">Forge Gamers</span>
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

          <span className="forge-menu-title">Boîte à outils</span>
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
          <div className="status-badge status-badge-success" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)', color: '#10b981' }}>
            <span style={{width:6, height:6, borderRadius:'50%', backgroundColor:'currentColor'}} />
            Suite Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Exécution locale (Port 5176)
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="forge-workspace">
        <div className="forge-glow-1" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }}></div>
        <div className="forge-glow-2" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }}></div>

        {activeTool === null ? (
          // Dashboard landing view
          <section style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="page-title">Forge Gamers</h1>
            <p className="page-subtitle">Découvrez notre gamme d'outils premium 100% locaux dédiés à la catégorie Gamers. Fonctionne sans envoi de données.</p>

            <span className="forge-menu-title" style={{ marginLeft: 0 }}>Outils Disponibles</span>
            <div className="dashboard-grid">
              {toolsList.map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#10b981' }}>{t.icon}</div>
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
