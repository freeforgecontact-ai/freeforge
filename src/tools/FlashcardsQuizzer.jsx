import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

// Leitner Box intervals (in seconds for easy testing/demo)
const LEITNER_INTERVALS = {
  1: 5,      // Box 1: review in 5 seconds
  2: 20,     // Box 2: review in 20 seconds
  3: 60,     // Box 3: review in 1 minute
  4: 300,    // Box 4: review in 5 minutes
  5: 900     // Box 5: review in 15 minutes
};

const BOX_NAMES = {
  1: '📦 Boîte 1 (Révision Rapide)',
  2: '📦 Boîte 2 (Modérée)',
  3: '📦 Boîte 3 (Espacée)',
  4: '📦 Boîte 4 (Maîtrise en cours)',
  5: '🏆 Boîte 5 (Appris / Maîtrisé)'
};

export default function FlashcardsQuizzer({ goBack }) {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('ff_student_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default cards with box & nextReview properties
    return [
      { id: '1', question: "Quelle est la formule chimique de l'eau ?", answer: 'H2O', box: 1, nextReview: 0 },
      { id: '2', question: 'Qui a écrit "Les Misérables" ?', answer: 'Victor Hugo', box: 1, nextReview: 0 }
    ];
  });

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem('ff_student_cards', JSON.stringify(cards));
  }, [cards]);

  // Keep 'now' current to drive the countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!question || !answer) return;

    const newCard = { 
      id: Date.now().toString(), 
      question, 
      answer,
      box: 1,
      nextReview: 0
    };
    setCards([...cards, newCard]);
    setQuestion('');
    setAnswer('');
  };

  const getDueCards = () => {
    return cards.filter(c => c.nextReview <= now);
  };

  const currentDueCard = getDueCards()[0]; // Select the first due card

  const handleGotIt = () => {
    if (!currentDueCard) return;

    setCards(prevCards => {
      return prevCards.map(c => {
        if (c.id === currentDueCard.id) {
          const nextBox = Math.min(5, c.box + 1);
          const nextInterval = LEITNER_INTERVALS[nextBox] * 1000;
          return {
            ...c,
            box: nextBox,
            nextReview: Date.now() + nextInterval
          };
        }
        return c;
      });
    });
    setShowAnswer(false);
  };

  const handleNeedReview = () => {
    if (!currentDueCard) return;

    setCards(prevCards => {
      return prevCards.map(c => {
        if (c.id === currentDueCard.id) {
          const nextInterval = LEITNER_INTERVALS[1] * 1000;
          return {
            ...c,
            box: 1, // Fall back to Box 1
            nextReview: Date.now() + nextInterval
          };
        }
        return c;
      });
    });
    setShowAnswer(false);
  };

  const handleForceReviewAll = () => {
    setCards(prev => prev.map(c => ({ ...c, nextReview: 0 })));
    setShowAnswer(false);
  };

  const handleDeleteCard = (id) => {
    const filtered = cards.filter(c => c.id !== id);
    setCards(filtered);
    setShowAnswer(false);
  };

  // Find next review timestamp in future
  const getNextReviewTime = () => {
    const futureCards = cards.filter(c => c.nextReview > now);
    if (futureCards.length === 0) return null;
    const minTime = Math.min(...futureCards.map(c => c.nextReview));
    return minTime;
  };

  const nextTimeLeft = getNextReviewTime() ? Math.round((getNextReviewTime() - now) / 1000) : null;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🧠 Active Recall Spaced Repetition (SRS)
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Mémorisez durablement vos cours avec le système Leitner de répétition espacée.
          </p>
        </div>
        <FolderButton toolId="flashcards" toolName="FlashcardsQuizzer" localStorageKeys={["ff_student_cards"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Play Quiz panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {cards.length === 0 ? (
            <div className="glass-panel" style={{ padding: 48, borderRadius: 16, textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Aucune carte-mémoire disponible. Utilisez le formulaire pour en créer une.</h3>
            </div>
          ) : currentDueCard ? (
            <div className="glass-panel" style={{ padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 280, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>🔥 À réviser maintenant ({getDueCards().length} dues)</span>
                <span style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{BOX_NAMES[currentDueCard.box]}</span>
              </div>

              {/* Card display */}
              <div 
                onClick={() => setShowAnswer(!showAnswer)}
                style={{ 
                  width: '100%', 
                  padding: 32, 
                  backgroundColor: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 12, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: 'white',
                  transition: 'all 0.3s',
                  marginTop: 16
                }}
              >
                {showAnswer ? currentDueCard.answer : currentDueCard.question}
              </div>

              <div style={{ display: 'flex', gap: 16, width: '100%', marginTop: 24 }}>
                {!showAnswer ? (
                  <button onClick={() => setShowAnswer(true)} className="btn-premium btn-primary" style={{ flex: 1, padding: 12, fontWeight: 'bold', justifyContent: 'center' }}>
                    👀 Révéler la réponse
                  </button>
                ) : (
                  <>
                    <button onClick={handleGotIt} className="btn-premium" style={{ flex: 1, padding: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontWeight: 'bold', justifyContent: 'center' }}>
                      ✅ C'est compris !
                    </button>
                    <button onClick={handleNeedReview} className="btn-premium" style={{ flex: 1, padding: 12, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 'bold', justifyContent: 'center' }}>
                      ❌ À revoir...
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 48, borderRadius: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>🎉</span>
              <h3 style={{ color: 'white', margin: 0, fontWeight: 700 }}>Toutes vos cartes sont à jour !</h3>
              {nextTimeLeft !== null && (
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  Prochaine révision planifiée dans <strong style={{ color: 'var(--secondary)' }}>{nextTimeLeft}s</strong>.
                </p>
              )}
              <button onClick={handleForceReviewAll} className="btn-premium btn-secondary" style={{ marginTop: 10, padding: '8px 16px', fontSize: '0.85rem' }}>
                🔄 Forcer la révision de toutes les cartes
              </button>
            </div>
          )}

          {/* Spaced Repetition box statistics */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Statistiques des Boîtes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(b => {
                const count = cards.filter(c => c.box === b).length;
                return (
                  <div key={b} style={{ textAlign: 'center', padding: '10px 4px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Boîte {b}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginTop: 4 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Create Card Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Nouvelle Carte</h3>
          <form onSubmit={handleCreateCard} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Question / Concept</label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="input-premium" required rows="2" style={{ width: '100%', marginTop: 4, resize: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Réponse / Définition</label>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className="input-premium" required rows="2" style={{ width: '100%', marginTop: 4, resize: 'none' }} />
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, fontWeight: 'bold', justifyContent: 'center' }}>
              Ajouter la carte
            </button>
          </form>

          {/* List of cards below form */}
          <h4 style={{ fontSize: '0.9rem', color: 'white', marginTop: 24, marginBottom: 12 }}>Liste des cartes ({cards.length})</h4>
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cards.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, paddingRight: 6 }}>
                  <span style={{ fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'white' }} title={c.question}>{c.question}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Boîte {c.box}</span>
                </div>
                <button onClick={() => handleDeleteCard(c.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}>Supprimer</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}