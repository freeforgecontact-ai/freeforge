import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CalorieMacroTracker({ goBack }) {
  const [meals, setMeals] = useState(() => {
    try {
      const val = localStorage.getItem('fl_calories');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      console.error("Failed to parse meals:", e);
      return [];
    }
  });
  
  const [name, setName] = useState('');
  const [cals, setCals] = useState(250);
  const [pro, setPro] = useState(20);
  const [carb, setCarb] = useState(30);
  const [fat, setFat] = useState(10);

  useEffect(() => {
    localStorage.setItem('fl_calories', JSON.stringify(meals));
  }, [meals]);

  const handleAddMeal = (e) => {
    e.preventDefault();
    if (!name) return;
    const newMeal = {
      id: Date.now().toString(),
      name, 
      cals: parseInt(cals, 10) || 0, 
      pro: parseInt(pro, 10) || 0, 
      carb: parseInt(carb, 10) || 0, 
      fat: parseInt(fat, 10) || 0
    };
    setMeals([...meals, newMeal]);
    setName('');
  };

  const handleRemoveMeal = (id) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const handleClear = () => {
    if (confirm("Voulez-vous vraiment effacer le journal nutritionnel ?")) setMeals([]);
  };

  const getTotalCals = () => meals.reduce((acc, m) => acc + m.cals, 0);
  const getTotalPro = () => meals.reduce((acc, m) => acc + m.pro, 0);
  const getTotalCarb = () => meals.reduce((acc, m) => acc + m.carb, 0);
  const getTotalFat = () => meals.reduce((acc, m) => acc + m.fat, 0);

  // Caloric calculations: 4 kcal/g for protein/carb, 9 kcal/g for fat
  const pCals = getTotalPro() * 4;
  const gCals = getTotalCarb() * 4;
  const fCals = getTotalFat() * 9;
  const calculatedTotal = pCals + gCals + fCals;

  const pctP = calculatedTotal > 0 ? pCals / calculatedTotal : 0;
  const pctG = calculatedTotal > 0 ? gCals / calculatedTotal : 0;
  const pctF = calculatedTotal > 0 ? fCals / calculatedTotal : 0;

  // Donut SVG values (radius = 35, stroke = 10, circ = 219.91)
  const radius = 35;
  const circ = 2 * Math.PI * radius;
  const dashP = pctP * circ;
  const dashG = pctG * circ;
  const dashF = pctF * circ;

  const offsetP = 0;
  const offsetG = -dashP;
  const offsetF = -(dashP + dashG);

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Retour</button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>🍎 Calorie & Macro Tracker</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Suivez vos repas et vos objectifs nutritionnels au quotidien.</p>
        </div>
        <FolderButton toolId="calorie" toolName="CalorieMacroTracker" localStorageKeys={['fl_calories']} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Form to add item */}
          <form onSubmit={handleAddMeal} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Ajouter un aliment</h2>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'aliment (ex: Blanc de poulet, Pomme)" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calories :</label>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981' }}>{cals} kcal</span>
              </div>
              <input type="range" min="0" max="1500" step="5" value={cals} onChange={e => setCals(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prot (g) :</label>
                <input type="number" min="0" value={pro} onChange={e => setPro(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gluc (g) :</label>
                <input type="number" min="0" value={carb} onChange={e => setCarb(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lip (g) :</label>
                <input type="number" min="0" value={fat} onChange={e => setFat(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
              </div>
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', marginTop: 10 }}>💾 Ajouter</button>
          </form>

          {/* Donut macro chart */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12, alignSelf: 'flex-start' }}>Répartition des Macronutriments</h2>
            {meals.length > 0 && calculatedTotal > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, width: '100%' }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#2a2e35" strokeWidth="10" />
                    
                    {/* Proteins (Red) */}
                    {pctP > 0 && (
                      <circle cx="50" cy="50" r={radius} fill="transparent" 
                              stroke="#f43f5e" strokeWidth="10" 
                              strokeDasharray={`${dashP} ${circ}`} 
                              strokeDashoffset={offsetP} 
                              transform="rotate(-90 50 50)" />
                    )}
                    {/* Carbs (Blue) */}
                    {pctG > 0 && (
                      <circle cx="50" cy="50" r={radius} fill="transparent" 
                              stroke="#3b82f6" strokeWidth="10" 
                              strokeDasharray={`${dashG} ${circ}`} 
                              strokeDashoffset={offsetG} 
                              transform="rotate(-90 50 50)" />
                    )}
                    {/* Fats (Yellow) */}
                    {pctF > 0 && (
                      <circle cx="50" cy="50" r={radius} fill="transparent" 
                              stroke="#eab308" strokeWidth="10" 
                              strokeDasharray={`${dashF} ${circ}`} 
                              strokeDashoffset={offsetF} 
                              transform="rotate(-90 50 50)" />
                    )}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {getTotalCals()} kcal
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f43f5e' }}></span>
                    <span style={{ fontWeight: 'bold', width: 70 }}>Protéines:</span>
                    <span>{getTotalPro()}g ({Math.round(pctP * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                    <span style={{ fontWeight: 'bold', width: 70 }}>Glucides:</span>
                    <span>{getTotalCarb()}g ({Math.round(pctG * 100)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                    <span style={{ fontWeight: 'bold', width: 70 }}>Lipides:</span>
                    <span>{getTotalFat()}g ({Math.round(pctF * 100)}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Ajoutez des aliments avec macronutriments pour voir le graphique.</div>
            )}
          </div>
        </div>

        {/* Dashboard and list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dashboard totals */}
          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Calories</div>
              <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 800, marginTop: 4 }}>{getTotalCals()} kcal</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protéines</div>
              <div style={{ fontSize: '1.5rem', color: '#f43f5e', fontWeight: 800, marginTop: 4 }}>{getTotalPro()} g</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Glucides</div>
              <div style={{ fontSize: '1.5rem', color: '#3b82f6', fontWeight: 800, marginTop: 4 }}>{getTotalCarb()} g</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lipides</div>
              <div style={{ fontSize: '1.5rem', color: '#eab308', fontWeight: 800, marginTop: 4 }}>{getTotalFat()} g</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Journal du jour ({meals.length} aliment{meals.length > 1 ? 's' : ''})</h2>
              {meals.length > 0 && <button onClick={handleClear} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6, color: '#ef4444' }}>Tout effacer</button>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {meals.length > 0 ? meals.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>{m.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>P: {m.pro}g | G: {m.carb}g | L: {m.fat}g</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{m.cals} kcal</span>
                    <button onClick={() => handleRemoveMeal(m.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }} title="Supprimer">×</button>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 16, textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>Aucun repas enregistré.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}