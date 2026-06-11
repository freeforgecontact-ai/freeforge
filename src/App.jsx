import React, { useState } from 'react';

// Import Developer level 2 tools
import CronVisualizer from './tools/CronVisualizer';
import JwtDebugger from './tools/JwtDebugger';
import RegExTester from './tools/RegExTester';
import Base64Encoder from './tools/Base64Encoder';
import MockApiServer from './tools/MockApiServer';
import GitVisualizer from './tools/GitVisualizer';
import FlexboxPlayground from './tools/FlexboxPlayground';
import ColorContrastChecker from './tools/ColorContrastChecker';
import WebToExecutable from './tools/WebToExecutable';

export default function App() {
  const [activeTool, setActiveTool] = useState(null); // null means dashboard

  const toolsList = [
    {
      id: 'cron',
      title: 'Cron Builder & Visualizer',
      desc: 'Validez et concevez des expressions CRON avec affichage interactif des prochaines exécutions.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      component: <CronVisualizer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'jwt',
      title: 'JWT Debugger & Tool',
      desc: 'Décodez et signez localement vos jetons JWT (JSON Web Tokens) en toute sécurité avec Web Crypto.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      component: <JwtDebugger goBack={() => setActiveTool(null)} />
    },
    {
      id: 'regex',
      title: 'RegEx Tester & Parser',
      desc: 'Outil de test d\'expressions régulières interactif avec coloration syntaxique des groupes capturés.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      component: <RegExTester goBack={() => setActiveTool(null)} />
    },
    {
      id: 'encoder',
      title: 'Encodeur Universel',
      desc: 'Encodez et décodez en Base64, URL et entités HTML. Glisser-déposer de fichiers supporté.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      component: <Base64Encoder goBack={() => setActiveTool(null)} />
    },
    {
      id: 'mock_api',
      title: 'Concepteur Mock API',
      desc: 'Générez des points d\'accès API fictifs locaux et exportez un Service Worker autonome.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      component: <MockApiServer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'git_visualizer',
      title: 'Git Command Visualizer',
      desc: 'Résolvez visuellement des scénarios Git complexes (merge, rebase, cherry-pick) et générez les commandes.',
      category: 'dev',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      component: <GitVisualizer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'flexbox_playground',
      title: 'Flexbox & Grid Playground',
      desc: 'Visualisez et configurez des grilles CSS interactives avec prévisualisation et copie de code rapide.',
      category: 'design',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      component: <FlexboxPlayground goBack={() => setActiveTool(null)} />
    },
    {
      id: 'color_contrast',
      title: 'Contraste de Couleur & A11y',
      desc: 'Vérifiez la conformité WCAG 2.1 et simulez le daltonisme en temps réel sur Canvas.',
      category: 'design',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      component: <ColorContrastChecker goBack={() => setActiveTool(null)} />
    },
    {
      id: 'web_executable',
      title: 'Compilateur WebToExecutable',
      desc: 'Packagez vos applications web locales en fichiers exécutables Windows (.exe) ou projets Android (.apk).',
      category: 'compiler',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width:24, height:24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3m-9 13h10a2 2 0 002-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      component: <WebToExecutable goBack={() => setActiveTool(null)} />
    }
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool);

  return (
    <div className="forge-container">
      {/* Sidebar (Navigation) */}
      <aside className="forge-sidebar no-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="#" className="forge-logo-wrapper" onClick={(e) => { e.preventDefault(); setActiveTool(null); }}>
            <div className="forge-logo-icon" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24, color: 'white'}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="forge-logo-text">ForgeDev 2</span>
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

          <span className="forge-menu-title">Développement</span>
          {toolsList.filter(t => t.category === 'dev').map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}

          <span className="forge-menu-title">Design</span>
          {toolsList.filter(t => t.category === 'design').map(t => (
            <button
              key={t.id}
              className={`forge-menu-btn ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => setActiveTool(t.id)}
            >
              {t.icon}
              {t.title}
            </button>
          ))}

          <span className="forge-menu-title">Compilation</span>
          {toolsList.filter(t => t.category === 'compiler').map(t => (
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
          <div className="status-badge status-badge-success" style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
            <span style={{width:6, height:6, borderRadius:'50%', backgroundColor:'currentColor'}} />
            Dev Suite Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Exécution locale (Port 5175)
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="forge-workspace">
        <div className="forge-glow-1" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }}></div>
        <div className="forge-glow-2" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}></div>

        {activeTool === null ? (
          // Dashboard landing view
          <section style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="page-title">Suite Développeur - Niveau 2</h1>
            <p className="page-subtitle">Des outils de développement avancés 100% locaux. Déboguez des JWT, validez du regex, concevez des expressions cron, ou compilez des applis web en exécutables Windows natifs.</p>

            <span className="forge-menu-title" style={{ marginLeft: 0 }}>Développement</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'dev').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#10b981' }}>{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>

            <span className="forge-menu-title" style={{ marginLeft: 0, marginTop: 40, display: 'block' }}>Design & Interface</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'design').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#3b82f6' }}>{t.icon}</div>
                  <h2 className="card-title">{t.title}</h2>
                  <p className="card-desc">{t.desc}</p>
                </div>
              ))}
            </div>

            <span className="forge-menu-title" style={{ marginLeft: 0, marginTop: 40, display: 'block' }}>Compilation Directe</span>
            <div className="dashboard-grid">
              {toolsList.filter(t => t.category === 'compiler').map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#8b5cf6' }}>{t.icon}</div>
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
