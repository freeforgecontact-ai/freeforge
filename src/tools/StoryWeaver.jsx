import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

const defaultStories = {
  castor: {
    title: "Ti-Bi le Castor 🦫",
    startNode: 'start',
    nodes: {
      start: {
        text: "Il était une fois, un castor nommé Ti-Bi qui habitait au bord du fleuve Saint-Laurent. Un jour, il vit un reflet doré au fond de l'eau...",
        choices: [
          { text: "Plonger pour voir de quoi il s'agit", next: 'plonge' },
          { text: "Demander conseil au vieux hibou Grison", next: 'hibou' }
        ]
      },
      plonge: {
        text: "Ti-Bi plonge courageusement. C'était une clé magique dorée ! Soudain, un grand esturgeon lui propose un défi d'énigme pour la garder...",
        choices: [
          { text: "Accepter le défi", next: 'defi' },
          { text: "Remonter vite à la surface", next: 'surface' }
        ]
      },
      hibou: {
        text: "Le hibou Grison écoute Ti-Bi. 'C'est la clé du grand barrage des souvenirs', dit-il d'un ton mystérieux. 'Mais attention, elle est gardée par la loutre rieuse.'",
        choices: [
          { text: "Aller voir la loutre avec un cadeau", next: 'loutre' },
          { text: "Plonger en cachette", next: 'plonge' }
        ]
      },
      defi: {
        text: "L'esturgeon demande: 'Qu'est-ce qui court sans pattes ?'. Ti-Bi répond : 'La rivière !'. Impressionné, l'esturgeon lui donne la clé. Ti-Bi est le héros du fleuve !",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      },
      surface: {
        text: "De retour sur la berge, Ti-Bi s'aperçoit que le reflet a disparu. Mais il a appris qu'il faut parfois être préparé avant de plonger.",
        choices: [
          { text: "Recommencer", next: 'start' }
        ]
      },
      loutre: {
        text: "Ti-Bi offre une belle pomme de pin à la loutre. Ravie, elle lui ouvre le coffre aux souvenirs. C'est une grande fête pour tous les animaux !",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      }
    }
  },
  erable: {
    title: "Le Secret de l'Érable Magique 🍁",
    startNode: 'start',
    nodes: {
      start: {
        text: "Dans une forêt lointaine, un érable géant produit un sirop magique bleu. Une nuit, le sirop cesse de couler...",
        choices: [
          { text: "Inspecter les racines de l'arbre", next: 'racines' },
          { text: "Suivre la piste lumineuse dans la mousse", next: 'piste' }
        ]
      },
      racines: {
        text: "Sous l'arbre, un petit lutin des bois tente de réparer une canalisation en écorce bouchée par de vieux glands dorés.",
        choices: [
          { text: "L'aider à déboucher la canalisation", next: 'aider' },
          { text: "Lui proposer de chercher de l'aide auprès des fées", next: 'fees' }
        ]
      },
      piste: {
        text: "La piste lumineuse mène à une clairière où danse une luciole géante fatiguée. Elle a perdu sa lanterne en cristal.",
        choices: [
          { text: "Chercher la lanterne près de la rivière", next: 'riviere' },
          { text: "Lui donner une baie magique pour lui redonner de l'énergie", next: 'baie' }
        ]
      },
      aider: {
        text: "Vous retirez les glands dorés un par un. Le sirop bleu recommence à jaillir ! Le lutin vous offre une fiole de sirop éternel en remerciement.",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      },
      fees: {
        text: "Les fées arrivent avec leur poussière d'étoiles et nettoient la source instantanément. La forêt brille à nouveau de mille feux !",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      },
      riviere: {
        text: "Au bord de l'eau, vous trouvez la lanterne privée de lumière coincée sous un galet. La luciole est ravie et illumine votre chemin.",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      },
      baie: {
        text: "La luciole mange la baie et brille si fort qu'elle retrouve d'elle-même sa lanterne cachée sous des fougères. Quelle aventure !",
        choices: [
          { text: "Recommencer l'histoire", next: 'start' }
        ]
      }
    }
  }
};

export default function StoryWeaver({ goBack }) {
  const [activeTab, setActiveTab] = useState('play'); // 'play' | 'build'
  
  // Custom & default stories loader
  const [stories, setStories] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_stories');
      return saved ? JSON.parse(saved) : defaultStories;
    } catch (e) {
      console.error("Error reading fe_stories", e);
      return defaultStories;
    }
  });

  const [activeStoryKey, setActiveStoryKey] = useState('castor');
  const [currentNodeKey, setCurrentNodeKey] = useState('start');

  // Builder form states
  const [editingNodeKey, setEditingNodeKey] = useState('start');
  const [nodeText, setNodeText] = useState('');
  const [newChoiceText, setNewChoiceText] = useState('');
  const [newChoiceNext, setNewChoiceNext] = useState('');
  
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newNodeKeyToAdd, setNewNodeKeyToAdd] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fe_stories', JSON.stringify(stories));
  }, [stories]);

  const activeStory = stories[activeStoryKey] || stories.castor || defaultStories.castor;
  const currentNode = activeStory.nodes[currentNodeKey] || activeStory.nodes.start || { text: '', choices: [] };

  // Sync builder text input when editing node changes
  useEffect(() => {
    if (activeStory && activeStory.nodes[editingNodeKey]) {
      setNodeText(activeStory.nodes[editingNodeKey].text);
    } else {
      setNodeText('');
    }
  }, [editingNodeKey, activeStoryKey]);

  const handleCreateStory = (e) => {
    e.preventDefault();
    if (!newStoryTitle.trim()) return;
    const newKey = 'story_' + Date.now();
    const newStoryObj = {
      title: newStoryTitle.trim(),
      startNode: 'start',
      nodes: {
        start: {
          text: "Il était une fois... (Écrivez votre introduction ici)",
          choices: []
        }
      }
    };
    setStories({ ...stories, [newKey]: newStoryObj });
    setActiveStoryKey(newKey);
    setCurrentNodeKey('start');
    setEditingNodeKey('start');
    setNewStoryTitle('');
  };

  const handleUpdateNodeText = () => {
    if (!editingNodeKey) return;
    setStories(prev => {
      const next = { ...prev };
      if (next[activeStoryKey].nodes[editingNodeKey]) {
        next[activeStoryKey].nodes[editingNodeKey].text = nodeText;
      }
      return next;
    });
    alert('Nœud d\'histoire mis à jour !');
  };

  const handleAddChoice = (e) => {
    e.preventDefault();
    if (!newChoiceText.trim() || !newChoiceNext.trim()) return;

    setStories(prev => {
      const next = { ...prev };
      const node = next[activeStoryKey].nodes[editingNodeKey];
      if (node) {
        if (!node.choices) node.choices = [];
        node.choices.push({
          text: newChoiceText.trim(),
          next: newChoiceNext.trim()
        });
        
        // Auto-create destination node if it doesn't exist
        if (!next[activeStoryKey].nodes[newChoiceNext.trim()]) {
          next[activeStoryKey].nodes[newChoiceNext.trim()] = {
            text: `(Nouveau nœud d'histoire "${newChoiceNext.trim()}". Écrivez la suite ici.)`,
            choices: []
          };
        }
      }
      return next;
    });

    setNewChoiceText('');
    setNewChoiceNext('');
  };

  const handleDeleteChoice = (idx) => {
    setStories(prev => {
      const next = { ...prev };
      const node = next[activeStoryKey].nodes[editingNodeKey];
      if (node && node.choices) {
        node.choices.splice(idx, 1);
      }
      return next;
    });
  };

  const handleAddNodeDirectly = (e) => {
    e.preventDefault();
    const cleanKey = newNodeKeyToAdd.trim();
    if (!cleanKey || activeStory.nodes[cleanKey]) {
      alert("Identifiant de nœud invalide ou déjà existant.");
      return;
    }

    setStories(prev => {
      const next = { ...prev };
      next[activeStoryKey].nodes[cleanKey] = {
        text: "Texte de la nouvelle scène...",
        choices: []
      };
      return next;
    });

    setEditingNodeKey(cleanKey);
    setNewNodeKeyToAdd('');
  };

  const handleDeleteStory = (keyToDelete) => {
    if (keyToDelete === 'castor') {
      alert("Impossible de supprimer l'histoire par défaut.");
      return;
    }
    if (confirm("Voulez-vous supprimer cette histoire ?")) {
      const nextStories = { ...stories };
      delete nextStories[keyToDelete];
      setStories(nextStories);
      setActiveStoryKey('castor');
      setCurrentNodeKey('start');
      setEditingNodeKey('start');
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            📖 Kids Story Weaver
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Lisez des contes interactifs à choix ou créez vos propres aventures à embranchements.
          </p>
        </div>
        <FolderButton toolId="story_weaver" toolName="StoryWeaver" localStorageKeys={['fe_stories']} />
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('play')} className={`btn-premium ${activeTab === 'play' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontWeight: 'bold' }}>
          📖 Lire une histoire
        </button>
        <button onClick={() => setActiveTab('build')} className={`btn-premium ${activeTab === 'build' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontWeight: 'bold' }}>
          🛠️ Créateur / Éditeur
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        
        {/* Left column: Story selection */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>Choisir une aventure</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(stories).map(([key, s]) => (
              <div 
                key={key}
                onClick={() => {
                  setActiveStoryKey(key);
                  setCurrentNodeKey('start');
                  setEditingNodeKey('start');
                }}
                style={{ 
                  padding: 10, 
                  borderRadius: 8, 
                  backgroundColor: activeStoryKey === key ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.01)', 
                  border: `1px solid ${activeStoryKey === key ? '#3b82f6' : 'var(--border-light)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: activeStoryKey === key ? 'bold' : 'normal', color: 'white' }}>
                  {s.title}
                </span>
                {key !== 'castor' && key !== 'erable' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(key); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateStory} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Créer un nouveau conte :</span>
            <input 
              type="text" 
              placeholder="Titre du conte..." 
              value={newStoryTitle} 
              onChange={e => setNewStoryTitle(e.target.value)} 
              className="input-premium"
              style={{ padding: 6, fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 6, fontSize: '0.8rem', justifyContent: 'center' }}>
              Create new
            </button>
          </form>
        </div>

        {/* Right column: Active Reader or Editor */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          
          {activeTab === 'play' ? (
            /* PLAY MODE RENDER */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', minHeight: 280, justifyContent: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 }}>
                {activeStory.title}
              </span>
              
              <p style={{ fontSize: '1.3rem', lineHeight: 1.6, color: 'white', fontWeight: 500, fontStyle: 'italic', textAlign: 'center', maxWidth: 600 }}>
                "{currentNode.text}"
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 450, marginTop: 12 }}>
                {currentNode.choices && currentNode.choices.length > 0 ? (
                  currentNode.choices.map((c, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentNodeKey(c.next)}
                      className="btn-premium btn-primary"
                      style={{ width: '100%', padding: 12, borderRadius: 8, justifyContent: 'center', fontSize: '0.9rem' }}
                    >
                      {c.text}
                    </button>
                  ))
                ) : (
                  <button 
                    onClick={() => setCurrentNodeKey('start')}
                    className="btn-premium btn-secondary"
                    style={{ width: '100%', padding: 12, borderRadius: 8, justifyContent: 'center', fontSize: '0.9rem' }}
                  >
                    🔄 Retourner au début
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* BUILDER MODE RENDER */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>
                Éditeur de nœuds : {activeStory.title}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
                {/* Nodes selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sélectionner une scène :</label>
                  <select 
                    value={editingNodeKey} 
                    onChange={e => setEditingNodeKey(e.target.value)} 
                    className="input-premium"
                    style={{ width: '100%', padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
                  >
                    {Object.keys(activeStory.nodes).map(k => (
                      <option key={k} value={k}>{k === 'start' ? 'Introduction (start)' : k}</option>
                    ))}
                  </select>

                  <form onSubmit={handleAddNodeGrid => handleAddNodeDirectly} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ajouter une scène :</label>
                    <input 
                      type="text" 
                      placeholder="ID unique (ex: riviere)" 
                      value={newNodeKeyToAdd} 
                      onChange={e => setNewNodeKeyToAdd(e.target.value)} 
                      className="input-premium"
                      style={{ padding: 6, fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={handleAddNodeDirectly} className="btn-premium btn-secondary" style={{ padding: 6, fontSize: '0.8rem', justifyContent: 'center' }}>
                      + Scène
                    </button>
                  </form>
                </div>

                {/* Edit node content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Texte de la scène :</label>
                    <textarea 
                      value={nodeText} 
                      onChange={e => setNodeText(e.target.value)}
                      className="input-premium"
                      rows="4"
                      style={{ width: '100%', padding: 10, resize: 'vertical' }}
                    />
                    <button onClick={handleUpdateNodeText} className="btn-premium btn-secondary" style={{ marginTop: 6, padding: '6px 12px', fontSize: '0.8rem' }}>
                      💾 Enregistrer le texte
                    </button>
                  </div>

                  {/* Choice managers */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0 0 10px 0' }}>Boutons / Choix de navigation</h4>
                    
                    {/* List of current choices */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {activeStory.nodes[editingNodeKey]?.choices?.map((choice, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 6, fontSize: '0.8rem', alignItems: 'center' }}>
                          <span>👉 "{choice.text}" mène vers <strong>{choice.next}</strong></span>
                          <button onClick={() => handleDeleteChoice(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>✕</button>
                        </div>
                      ))}
                    </div>

                    {/* Add choice form */}
                    <form onSubmit={handleAddChoice} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: 8, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Texte du bouton :</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="ex: Prendre le chemin de gauche" 
                          value={newChoiceText} 
                          onChange={e => setNewChoiceText(e.target.value)}
                          className="input-premium"
                          style={{ padding: 6, fontSize: '0.8rem', width: '100%', marginTop: 2 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Aller vers (ID) :</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="ex: gauche" 
                          value={newChoiceNext} 
                          onChange={e => setNewChoiceNext(e.target.value)}
                          className="input-premium"
                          style={{ padding: 6, fontSize: '0.8rem', width: '100%', marginTop: 2 }}
                        />
                      </div>
                      <button type="submit" className="btn-premium btn-primary" style={{ padding: 7, fontSize: '0.8rem', justifyContent: 'center' }}>
                        + Choix
                      </button>
                    </form>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}