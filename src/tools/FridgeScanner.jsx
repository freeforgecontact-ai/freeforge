import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

const defaultIngredients = ['oeuf', 'lait', 'farine', 'fromage', 'tomate', 'pates', 'riz', 'poulet', 'curry'];

const defaultRecipes = [
  { name: 'Crêpes Classiques 🥞', req: ['oeuf', 'lait', 'farine'], desc: 'Mélangez la farine, le lait et les œufs puis cuisez à la poêle.' },
  { name: 'Omelette au fromage 🍳', req: ['oeuf', 'fromage'], desc: 'Battez les œufs et incorporez le fromage râpé en fin de cuisson.' },
  { name: 'Pâtes Tomate Fromage 🍝', req: ['pates', 'tomate', 'fromage'], desc: 'Faites cuire les pâtes, ajoutez la sauce tomate et saupoudrez de fromage.' },
  { name: 'Riz au Poulet Curry 🍛', req: ['riz', 'poulet', 'curry'], desc: 'Cuisez le riz, faites dorer le poulet, saupoudrez de curry et mélangez.' }
];

export default function FridgeScanner({ goBack }) {
  // Load ingredient choices
  const [choices, setChoices] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_fridge_choices');
      return saved ? JSON.parse(saved) : defaultIngredients;
    } catch (e) {
      return defaultIngredients;
    }
  });

  // Load active checked items in fridge
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_fridge_checked');
      return saved ? JSON.parse(saved) : { egg: true, milk: true, flour: true };
    } catch (e) {
      return {};
    }
  });

  // Load recipes (both default and custom)
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_fridge_recipes');
      return saved ? JSON.parse(saved) : defaultRecipes;
    } catch (e) {
      return defaultRecipes;
    }
  });

  // Form states
  const [newIngredient, setNewIngredient] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [recipeReqs, setRecipeReqs] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('fe_fridge_choices', JSON.stringify(choices));
  }, [choices]);

  useEffect(() => {
    localStorage.setItem('fe_fridge_checked', JSON.stringify(checked));
  }, [checked]);

  useEffect(() => {
    localStorage.setItem('fe_fridge_recipes', JSON.stringify(recipes));
  }, [recipes]);

  const handleToggle = (item) => {
    setChecked(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    const clean = newIngredient.trim().toLowerCase();
    if (!clean) return;
    if (!choices.includes(clean)) {
      setChoices([...choices, clean]);
    }
    setChecked(prev => ({ ...prev, [clean]: true }));
    setNewIngredient('');
  };

  const handleDeleteIngredient = (item) => {
    setChoices(choices.filter(c => c !== item));
    setChecked(prev => {
      const copy = { ...prev };
      delete copy[item];
      return copy;
    });
  };

  const handleAddRecipe = (e) => {
    e.preventDefault();
    if (!recipeName.trim() || !recipeReqs.trim()) return;

    // Split requirements by commas, clean inputs
    const reqList = recipeReqs
      .split(',')
      .map(r => r.trim().toLowerCase())
      .filter(r => r.length > 0);

    const newRecipe = {
      name: recipeName.trim(),
      req: reqList,
      desc: recipeDesc.trim() || 'Aucune instruction fournie.'
    };

    setRecipes([...recipes, newRecipe]);
    
    // Auto-add missing ingredients to the choices database to make toggling them possible
    const missing = reqList.filter(r => !choices.includes(r));
    if (missing.length > 0) {
      setChoices([...choices, ...missing]);
    }

    setRecipeName('');
    setRecipeReqs('');
    setRecipeDesc('');
    alert('Recette personnalisée ajoutée !');
  };

  const handleDeleteRecipe = (name) => {
    if (confirm(`Voulez-vous supprimer la recette "${name}" ?`)) {
      setRecipes(recipes.filter(r => r.name !== name));
    }
  };

  // Logic to calculate matched and almost matched recipes
  const getMatchedRecipes = () => {
    const active = Object.keys(checked).filter(k => checked[k]);
    
    const fullyMatched = [];
    const almostMatched = []; // Missing 1 or 2 items

    recipes.forEach(r => {
      const missing = r.req.filter(reqIng => !active.includes(reqIng));
      if (missing.length === 0) {
        fullyMatched.push(r);
      } else if (missing.length <= 2) {
        almostMatched.push({ recipe: r, missing });
      }
    });

    return { fullyMatched, almostMatched };
  };

  const { fullyMatched, almostMatched } = getMatchedRecipes();

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🍳 Scanner de Frigo & Recettes
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Ajoutez vos ingrédients et créez des recettes. Voyez instantanément ce que vous pouvez préparer.
          </p>
        </div>
        <FolderButton 
          toolId="fridge_scanner" 
          toolName="FridgeScanner" 
          localStorageKeys={['fe_fridge_choices', 'fe_fridge_recipes', 'fe_fridge_checked']} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Mon Frigo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Mon Frigo</h2>
            
            {/* Add free ingredient form */}
            <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: 6 }}>
              <input 
                type="text" 
                value={newIngredient} 
                onChange={e => setNewIngredient(e.target.value)} 
                placeholder="ex: Oignon, Ail..."
                className="input-premium" 
                style={{ flex: 1, padding: 8, fontSize: '0.85rem' }} 
              />
              <button type="submit" className="btn-premium btn-primary" style={{ padding: '8px 12px' }}>+</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', marginTop: 6 }}>
              {choices.map(item => (
                <div 
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: checked[item] ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                    borderRadius: 8,
                    border: `1px solid ${checked[item] ? 'rgba(16,185,129,0.2)' : 'var(--border-light)'}`
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={!!checked[item]} 
                      onChange={() => handleToggle(item)} 
                      style={{ accentColor: 'var(--secondary)' }}
                    />
                    <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: checked[item] ? 'white' : 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </label>
                  
                  <button 
                    onClick={() => handleDeleteIngredient(item)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: 4 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom recipe form */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: 0, marginBottom: 12 }}>Ajouter une recette</h3>
            <form onSubmit={handleAddRecipe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nom de la recette :</label>
                <input type="text" value={recipeName} onChange={e => setRecipeName(e.target.value)} required placeholder="ex: Soupe à l'oignon" className="input-premium" style={{ width: '100%', padding: 6, marginTop: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ingrédients requis (séparés par virgule) :</label>
                <input type="text" value={recipeReqs} onChange={e => setRecipeReqs(e.target.value)} required placeholder="ex: oignon, fromage, farine" className="input-premium" style={{ width: '100%', padding: 6, marginTop: 2 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instructions :</label>
                <textarea value={recipeDesc} onChange={e => setRecipeDesc(e.target.value)} placeholder="Décrivez les étapes..." className="input-premium" rows="2" style={{ width: '100%', padding: 6, marginTop: 2, resize: 'none' }} />
              </div>
              <button type="submit" className="btn-premium btn-primary" style={{ padding: 8, fontWeight: 'bold', justifyContent: 'center' }}>
                💾 Ajouter la recette
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Recipe Matches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Fully Matched Recipes */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
              🍽️ Recettes prêtes à cuisiner ({fullyMatched.length})
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fullyMatched.length > 0 ? fullyMatched.map((r, idx) => (
                <div key={idx} style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 10, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#10b981', margin: 0 }}>{r.name}</h3>
                    <button 
                      onClick={() => handleDeleteRecipe(r.name)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="Supprimer la recette"
                    >
                      🗑️
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 8, lineHeight: 1.4 }}>{r.desc}</p>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
                    Requis : {r.req.join(', ')}
                  </span>
                </div>
              )) : (
                <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Aucune recette disponible avec vos ingrédients actuels. Cochez-en d'autres à gauche !
                </div>
              )}
            </div>
          </div>

          {/* Almost Matched Recipes */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
              🕒 Recettes presque prêtes ({almostMatched.length})
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {almostMatched.length > 0 ? almostMatched.map(({ recipe, missing }, idx) => (
                <div key={idx} style={{ padding: 16, backgroundColor: 'rgba(245,158,11,0.02)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10 }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#f59e0b', margin: 0 }}>{recipe.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 8, lineHeight: 1.4 }}>{recipe.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Requis : {recipe.req.join(', ')}</span>
                    <strong style={{ color: '#ef4444' }}>Manque : {missing.join(', ')}</strong>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Aucune recette presque prête.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}