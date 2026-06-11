import React, { useState } from 'react';
import './App.css';

// Import tool components
import DrumMachine from './tools/DrumMachine';
import GuitarTuner from './tools/GuitarTuner';
import AudioVisualizer from './tools/AudioVisualizer';
import VirtualPiano from './tools/VirtualPiano';
import VoiceChanger from './tools/VoiceChanger';
import AudioLooper from './tools/AudioLooper';
import ChordTransposer from './tools/ChordTransposer';
import SoundscapeGenerator from './tools/SoundscapeGenerator';

export default function App() {
  const [activeTool, setActiveTool] = useState(null); // null means dashboard

  const toolsList = [
    {
      id: 'drum_machine',
      title: "Boîte à Rythmes",
      desc: "Séquencez vos rythmes sur une grille à 16 pas avec des percussions synthétisées.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      component: <DrumMachine goBack={() => setActiveTool(null)} />
    },
    {
      id: 'guitar_tuner',
      title: "Accordeur Chromatique",
      desc: "Accordez votre guitare, basse ou ukulélé en temps réel via votre microphone.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      component: <GuitarTuner goBack={() => setActiveTool(null)} />
    },
    {
      id: 'audio_visualizer',
      title: "Visualiseur Audio",
      desc: "Projetez vos musiques locales sur des animations de spectres de fréquences dynamiques.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      component: <AudioVisualizer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'virtual_piano',
      title: "Piano Polyphonique",
      desc: "Jouez des mélodies au piano avec votre clavier physique ou tactile et enregistrez-les.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4v14H3V7z" />
        </svg>
      ),
      component: <VirtualPiano goBack={() => setActiveTool(null)} />
    },
    {
      id: 'voice_changer',
      title: "Modificateur de Voix",
      desc: "Appliquez des filtres de voix en temps réel (Robot, Écho, Radio) à votre microphone.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      component: <VoiceChanger goBack={() => setActiveTool(null)} />
    },
    {
      id: 'audio_looper',
      title: "Looper Multi-Pistes",
      desc: "Enregistrez et empilez des boucles vocales ou instrumentales en overdub synchronisé.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17m-.002-4h.002" />
        </svg>
      ),
      component: <AudioLooper goBack={() => setActiveTool(null)} />
    },
    {
      id: 'chord_transposer',
      title: "Transpositeur d'Accords",
      desc: "Modifiez instantanément la tonalité et la notation de vos partitions avec écoute audio.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      component: <ChordTransposer goBack={() => setActiveTool(null)} />
    },
    {
      id: 'soundscape_generator',
      title: "Générateur d'Ambiance",
      desc: "Créez et mixez des sons de nature (pluie, vagues, bols tibétains) synthétisés en local.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{width: 24, height: 24}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      component: <SoundscapeGenerator goBack={() => setActiveTool(null)} />
    }
  ];

  const activeToolObj = toolsList.find(t => t.id === activeTool);

  return (
    <div className="forge-container">
      {/* Sidebar (Navigation) */}
      <aside className="forge-sidebar no-print">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="#" className="forge-logo-wrapper" onClick={(e) => { e.preventDefault(); setActiveTool(null); }}>
            <div className="forge-logo-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24, color: 'white'}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="forge-logo-text">Forge Audio</span>
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

          <span className="forge-menu-title">Création & Édition Audio</span>
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
          <div className="status-badge status-badge-success" style={{ border: '1px solid rgba(139, 92, 246, 0.2)', background: 'rgba(139, 92, 246, 0.05)', color: '#c084fc' }}>
            <span style={{width:6, height:6, borderRadius:'50%', backgroundColor:'currentColor'}} />
            Suite Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Exécution locale (Port 5186)
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="forge-workspace">
        <div className="forge-glow-1" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}></div>
        <div className="forge-glow-2" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)' }}></div>

        {activeTool === null ? (
          // Dashboard landing view
          <section style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="page-title">Forge Audio Créative</h1>
            <p className="page-subtitle">Découvrez notre gamme d'outils audio premium 100% locaux pour la composition, l'accordage, la modulation et la synthèse sonore.</p>

            <span className="forge-menu-title" style={{ marginLeft: 0 }}>Outils Disponibles</span>
            <div className="dashboard-grid">
              {toolsList.map(t => (
                <div key={t.id} className="card-premium" onClick={() => setActiveTool(t.id)}>
                  <div className="card-icon" style={{ color: '#c084fc' }}>{t.icon}</div>
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
