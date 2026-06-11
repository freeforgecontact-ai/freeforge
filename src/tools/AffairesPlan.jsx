import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function AffairesPlan({ goBack }) {
  const [activeStep, setActiveStep] = useState('summary');
  
  // Form states (saved to localStorage)
  const [planData, setPlanData] = useState(() => {
    const saved = localStorage.getItem('freeforge_affaires_plan');
    return saved ? JSON.parse(saved) : {
      title: 'Mon Entreprise Québec',
      author: 'Entrepreneur Solo',
      summary: '',
      projectDesc: '',
      marketStudy: '',
      marketingStrategy: '',
      operations: '',
      finance: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('freeforge_affaires_plan', JSON.stringify(planData));
  }, [planData]);

  const handleChange = (key, value) => {
    setPlanData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const steps = [
    {
      id: 'summary',
      name: '1. Sommaire Exécutif',
      desc: 'Présentez brièvement votre entreprise, votre mission et ce qui fera votre succès auprès de vos partenaires.',
      tip: 'Rédigez cette section à la fin. Elle doit être percutante et faire tenir le projet sur 1 ou 2 pages max.',
      key: 'summary'
    },
    {
      id: 'project',
      name: '2. Description du Projet',
      desc: 'Définissez la structure légale (Inc., entreprise individuelle, coopérative), le NEQ (Numéro d\'entreprise du Québec), et l\'historique.',
      tip: 'Au Québec, vous devez vous enregistrer auprès du Registre des entreprises (REQ) pour obtenir votre NEQ. Indiquez ici si vous possédez déjà votre nom enregistré.',
      key: 'project'
    },
    {
      id: 'market',
      name: '3. Étude de Marché',
      desc: 'Analysez votre clientèle cible, vos concurrents directs et indirects au Québec et la taille de votre marché.',
      tip: 'Utilisez des données d\'organismes comme Statistique Canada ou l\'Institut de la statistique du Québec pour appuyer vos prévisions de croissance.',
      key: 'market'
    },
    {
      id: 'marketing',
      name: '4. Stratégie Marketing',
      desc: 'Détaillez vos prix de vente, vos canaux de distribution et vos méthodes de communication locale (réseaux, pub, partenariats).',
      tip: 'Présentez comment vous comptez attirer vos premiers clients québécois et fidéliser votre communauté.',
      key: 'marketing'
    },
    {
      id: 'operations',
      name: '5. Structure Opérationnelle',
      desc: 'Décrivez les opérations de tous les jours : emplacement physique, fournisseurs locaux, matériel nécessaire et personnel.',
      tip: 'Indiquez si vous louez des locaux ou si vous travaillez à domicile, ainsi que les permis de zonage municipaux requis.',
      key: 'operations'
    },
    {
      id: 'finance',
      name: '6. Plan Financier',
      desc: 'Présentez vos prévisions de ventes, votre coût de démarrage estimé et vos besoins de financement ou subventions.',
      tip: 'Des organismes comme Futurpreneur Canada ou vos SADC/CAE locaux offrent des aides financières spécifiques aux jeunes entreprises du Québec.',
      key: 'finance'
    }
  ];

  const currentStepObj = steps.find(s => s.id === activeStep) || steps[0];

  // Helper stats
  const getWordCount = (text) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const totalWords = getWordCount(planData.summary) +
                     getWordCount(planData.projectDesc) +
                     getWordCount(planData.marketStudy) +
                     getWordCount(planData.marketingStrategy) +
                     getWordCount(planData.operations) +
                     getWordCount(planData.finance);

  // Compile document to Markdown (.md)
  const exportMarkdown = () => {
    const markdown = `# Plan d'Affaires : ${planData.title}
**Créateur :** ${planData.author}  
**Date de génération :** ${new Date().toLocaleDateString('fr-CA')}  

---

## 1. Sommaire Exécutif
${planData.summary || '*Section non rédigée.*'}

## 2. Description du Projet
${planData.projectDesc || '*Section non rédigée.*'}

## 3. Étude de Marché
${planData.marketStudy || '*Section non rédigée.*'}

## 4. Stratégie Marketing & Ventes
${planData.marketingStrategy || '*Section non rédigée.*'}

## 5. Structure Opérationnelle
${planData.operations || '*Section non rédigée.*'}

## 6. Plan Financier
${planData.finance || '*Section non rédigée.*'}
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `plan_affaires_${planData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Navigation Row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }} className="no-print">
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Entrepreneuriat</span>
        <FolderButton toolId="affaires_plan" toolName="Plan d'Affaires Guidé" localStorageKeys={['freeforge_affaires_plan']} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          Total : <strong>{totalWords} mots</strong> rédigés
        </span>
      </div>

      <h1 className="page-title no-print">Rédacteur de Plan d'Affaires Guidé</h1>
      <p className="page-subtitle no-print">Concevez votre plan d'affaires pas-à-pas. Vos données restent stockées localement et en toute confidentialité dans votre navigateur.</p>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }} className="responsive-split no-print">
        
        {/* Navigation panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card-premium" style={{ cursor: 'default', padding: 16, gap: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>📁 Sections</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {steps.map(s => (
                <button
                  key={s.id}
                  className={`btn-premium ${activeStep === s.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem', borderRadius: 6 }}
                  onClick={() => setActiveStep(s.id)}
                >
                  {s.name}
                </button>
              ))}
              <hr style={{ borderColor: 'var(--border-light)', margin: '8px 0' }} />
              <button
                className={`btn-premium ${activeStep === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem', borderRadius: 6 }}
                onClick={() => setActiveStep('preview')}
              >
                👁️ Aperçu global & PDF
              </button>
            </div>
          </div>

          {/* Export card */}
          <div className="card-premium" style={{ cursor: 'default', padding: 16, gap: 12 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>💾 Télécharger</h3>
            <button className="btn-premium btn-primary" onClick={exportMarkdown} style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}>
              Markdown (.md)
            </button>
            <button className="btn-premium btn-secondary" onClick={triggerPrint} style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}>
              Imprimer / PDF
            </button>
          </div>
        </div>

        {/* Content panel */}
        <div className="card-premium" style={{ cursor: 'default', padding: 24, gap: 18 }}>
          {activeStep !== 'preview' ? (
            <>
              {/* Header of section */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentStepObj.name}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{currentStepObj.desc}</p>
              </div>

              {/* Input for Title / Creator if Summary tab */}
              {currentStepObj.id === 'summary' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nom de l'entreprise</label>
                    <input 
                      type="text" 
                      className="input-premium" 
                      value={planData.title} 
                      onChange={e => handleChange('title', e.target.value)} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Auteur / Porteur de projet</label>
                    <input 
                      type="text" 
                      className="input-premium" 
                      value={planData.author} 
                      onChange={e => handleChange('author', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {/* Text Area for writing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Rédaction :</span>
                  <span>{getWordCount(planData[currentStepObj.key])} mots</span>
                </div>
                <textarea
                  className="input-premium"
                  style={{ minHeight: 250, resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.5 }}
                  value={planData[currentStepObj.key]}
                  onChange={e => handleChange(currentStepObj.key, e.target.value)}
                  placeholder="Écrivez votre texte ici..."
                />
              </div>

              {/* Quebec Specific Help Card */}
              <div style={{ padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>⚜️ Conseils spécifiques pour le Québec :</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{currentStepObj.tip}</p>
              </div>
            </>
          ) : (
            // Preview Panel
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>👁️ Aperçu final du Plan d'Affaires</h2>
              
              <div style={{ maxHeight: 400, overflowY: 'auto', padding: 16, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16 }}>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{planData.title}</h1>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Présenté par : <strong>{planData.author}</strong> | Date : {new Date().toLocaleDateString('fr-CA')}
                  </p>
                </div>

                {steps.map(s => (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 4 }}>{s.name}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {planData[s.key] ? planData[s.key] : 'Section vide. Cliquez sur la section correspondante pour la rédiger.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print representation (only visible during printing) */}
      <div className="print-only" style={{ display: 'none', color: 'black', backgroundColor: 'white', padding: '40px' }}>
        <div style={{ borderBottom: '2px solid black', paddingBottom: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Plan d'Affaires : {planData.title}</h1>
          <p style={{ fontSize: '1rem', color: '#555', marginTop: 8 }}>
            Porteur de projet : {planData.author} | Date : {new Date().toLocaleDateString('fr-CA')}
          </p>
        </div>

        {steps.map(s => (
          <div key={s.id} style={{ marginBottom: 30, pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, borderBottom: '1px solid #ccc', paddingBottom: 6, marginBottom: 10 }}>{s.name}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#111' }}>
              {planData[s.key] ? planData[s.key] : 'Cette section n\'a pas encore été rédigée.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
