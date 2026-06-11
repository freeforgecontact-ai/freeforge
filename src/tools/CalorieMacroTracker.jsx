import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CalorieMacroTracker({ goBack }) {
  const [meals, setMeals] = useState(() => {
    const val = localStorage.getItem('fl_calories');
    return val ? JSON.parse(val) : [];
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
      name, cals: parseInt(cals), pro: parseInt(pro), carb: parseInt(carb), fat: parseInt(fat)
    };
    setMeals([...meals, newMeal]);
    setName('');
  };

  const handleClear = () => {
    if (confirm("Effacer le journal ?")) setMeals([]);
  };

  const getTotalCals = () => meals.reduce((acc, m) => acc + m.cals, 0);
  const getTotalPro = () => meals.reduce((acc, m) => acc + m.pro, 0);
  const getTotalCarb = () => meals.reduce((acc, m) => acc + m.carb, 0);
  const getTotalFat = () => meals.reduce((acc, m) => acc + m.fat, 0);

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

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <form onSubmit={handleAddMeal} className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Ajouter un aliment</h2>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'aliment" className="input-premium" style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calories ({cals} kcal) :</label>
            <input type="range" min="10" max="1500" step="10" value={cals} onChange={e => setCals(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prot (g) :</label>
              <input type="number" value={pro} onChange={e => setPro(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gluc (g) :</label>
              <input type="number" value={carb} onChange={e => setCarb(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lip (g) :</label>
              <input type="number" value={fat} onChange={e => setFat(e.target.value)} className="input-premium" style={{ width: '100%', padding: 6, borderRadius: 6 }} />
            </div>
          </div>
          <button type="submit" className="btn-premium btn-primary" style={{ width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', justifyContent: 'center', marginTop: 10 }}>💾 Ajouter</button>
        </form>

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
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Journal du jour</h2>
              {meals.length > 0 && <button onClick={handleClear} className="btn-premium btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6, color: '#ef4444' }}>Tout effacer</button>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {meals.length > 0 ? meals.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{m.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{m.cals} kcal | P:{m.pro}g G:{m.carb}g L:{m.fat}g</span>
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