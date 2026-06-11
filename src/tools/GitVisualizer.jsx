import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function GitVisualizer({ goBack }) {
  const [scenario, setScenario] = useState('merge'); // 'merge', 'rebase', 'cherry'
  const [step, setStep] = useState(0);

  const scenariosData = {
    merge: {
      title: "Fusionner une branche (Merge)",
      desc: "Découvrez comment fusionner la branche 'feature' dans 'main' en créant un commit de fusion.",
      commands: [
        "git checkout main",
        "git merge feature"
      ],
      steps: [
        {
          label: "État Initial : Deux branches ont divergé.",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1 (main)' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C3', branch: 'feature', x: 280, y: 160, label: 'C3 (feature)' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C3' },
            { from: 'C2', to: 'C4' }
          ]
        },
        {
          label: "Après fusion : Un nouveau commit de fusion (C5) réunit main et feature.",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C3', branch: 'feature', x: 280, y: 160, label: 'C3' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4' },
            { id: 'C5', branch: 'main', x: 380, y: 100, label: 'C5 (Merge Commit)', color: '#10b981' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C3' },
            { from: 'C2', to: 'C4' },
            { from: 'C3', to: 'C5' },
            { from: 'C4', to: 'C5' }
          ]
        }
      ]
    },
    rebase: {
      title: "Réorganiser la branche (Rebase)",
      desc: "Déplacez l'ensemble des commits feature au-dessus de la branche main pour un historique propre.",
      commands: [
        "git checkout feature",
        "git rebase main"
      ],
      steps: [
        {
          label: "État Initial : Deux branches ont divergé.",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C3', branch: 'feature', x: 280, y: 160, label: 'C3 (feature)' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4 (main)' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C3' },
            { from: 'C2', to: 'C4' }
          ]
        },
        {
          label: "Après Rebase : Le commit C3 est recréé sous C3' au-dessus de C4 (main).",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4 (main)' },
            { id: 'C3_prime', branch: 'feature', x: 380, y: 100, label: "C3' (feature)", color: '#3b82f6' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C4' },
            { from: 'C4', to: 'C3_prime' }
          ]
        }
      ]
    },
    cherry: {
      title: "Sélectionner des commits (Cherry-Pick)",
      desc: "Appliquez le commit C3 de la branche feature directement sur main sans fusionner toute la branche.",
      commands: [
        "git checkout main",
        "git cherry-pick C3"
      ],
      steps: [
        {
          label: "État Initial : Le commit C3 contient un correctif critique sur feature.",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C3', branch: 'feature', x: 280, y: 160, label: 'C3 (feature)' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4 (main)' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C3' },
            { from: 'C2', to: 'C4' }
          ]
        },
        {
          label: "Après Cherry-pick : Une copie de C3 (C3') est appliquée sur main.",
          commits: [
            { id: 'C1', branch: 'main', x: 80, y: 100, label: 'C1' },
            { id: 'C2', branch: 'main', x: 180, y: 100, label: 'C2' },
            { id: 'C3', branch: 'feature', x: 280, y: 160, label: 'C3' },
            { id: 'C4', branch: 'main', x: 280, y: 100, label: 'C4' },
            { id: 'C3_prime', branch: 'main', x: 380, y: 100, label: "C3' (copie)", color: '#e59866' }
          ],
          links: [
            { from: 'C1', to: 'C2' },
            { from: 'C2', to: 'C3' },
            { from: 'C2', to: 'C4' },
            { from: 'C4', to: 'C3_prime' }
          ]
        }
      ]
    }
  };

  const currentScenario = scenariosData[scenario];
  const currentStep = currentScenario.steps[step];

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🌿 Git Command Visualizer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Apprenez et visualisez les commandes Git complexes à travers des arbres de commits interactifs.
          </p>
        </div>
        <FolderButton toolId="git_visualizer" toolName="GitVisualizer" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Commit Tree Visualizer */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Scenario: {currentScenario.title}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(scenariosData).map(k => (
                <button
                  key={k}
                  onClick={() => { setScenario(k); setStep(0); }}
                  className={`btn-premium ${scenario === k ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem' }}
                >
                  {k === 'merge' ? 'Merge' : k === 'rebase' ? 'Rebase' : 'Cherry-Pick'}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{currentScenario.desc}</p>

          {/* SVG Commit Graph */}
          <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
            <svg style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
              <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
              <text x="15" y="94" fill="var(--text-muted)" fontSize="10">main</text>
              <text x="15" y="154" fill="var(--text-muted)" fontSize="10">feature</text>

              {/* Link lines */}
              {currentStep.links.map((link, idx) => {
                const fromNode = currentStep.commits.find(n => n.id === link.from);
                const toNode = currentStep.commits.find(n => n.id === link.to);
                if (!fromNode || !toNode) return null;
                return (
                  <path 
                    key={idx}
                    d={`M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x)/2} ${fromNode.y}, ${(fromNode.x + toNode.x)/2} ${toNode.y}, ${toNode.x} ${toNode.y}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                  />
                );
              })}

              {/* Commit Nodes */}
              {currentStep.commits.map(commit => (
                <g key={commit.id} style={{ cursor: 'pointer' }}>
                  <circle 
                    cx={commit.x} 
                    cy={commit.y} 
                    r="14" 
                    fill={commit.color || (commit.branch === 'main' ? '#10b981' : '#3b82f6')} 
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="2"
                  />
                  <text 
                    x={commit.x} 
                    y={commit.y + 4} 
                    fill="white" 
                    fontSize="10" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {commit.id}
                  </text>
                  <text 
                    x={commit.x} 
                    y={commit.y - 20} 
                    fill="var(--text-secondary)" 
                    fontSize="11" 
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {commit.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>{currentStep.label}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                disabled={step === 0} 
                onClick={() => setStep(0)} 
                className="btn-premium btn-secondary" 
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem' }}
              >
                Mettre à zéro
              </button>
              <button 
                disabled={step === currentScenario.steps.length - 1} 
                onClick={() => setStep(prev => prev + 1)} 
                className="btn-premium btn-primary" 
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem' }}
              >
                Étape suivante →
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Commands script */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Commandes Git</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Voici les commandes de terminal à exécuter pour réaliser ce scénario :
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentScenario.commands.map((cmd, idx) => (
              <div 
                key={idx}
                onClick={() => { navigator.clipboard.writeText(cmd); alert('Commande copiée : ' + cmd); }}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8,
                  color: '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                title="Cliquez pour copier"
              >
                <span>$ {cmd}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📋</span>
              </div>
            ))}
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 8 }}>
            <strong>Astuce :</strong> Le merge préserve l'histoire exacte (avec divergence visible), tandis que le rebase crée un historique linéaire en réappliquant vos commits.
          </div>
        </div>
      </div>
    </div>
  );
}
