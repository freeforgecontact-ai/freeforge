import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function NutrimentsMacros({ goBack }) {
  const [calories, setCalories] = useState(2000);
  const [goal, setGoal] = useState('recomp');

  const getMacros = () => {
    let proteinPct = 30;
    let carbPct = 40;
    let fatPct = 30;

    if (goal === 'cut') {
      proteinPct = 40;
      carbPct = 30;
      fatPct = 30;
    } else if (goal === 'bulk') {
      proteinPct = 25;
      carbPct = 50;
      fatPct = 25;
    }

    const proteinG = (calories * (proteinPct / 100)) / 4;
    const carbG = (calories * (carbPct / 100)) / 4;
    const fatG = (calories * (fatPct / 100)) / 9;

    return {
      proteinPct, carbPct, fatPct,
      proteinG: Math.round(proteinG),
      carbG: Math.round(carbG),
      fatG: Math.round(fatG)
    };
  };

  const macros = getMacros();

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🥩 Calculateur de Nutriments & Macros
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Répartissez vos macronutriments (Protéines, Glucides, Lipides) selon vos objectifs physiques.
          </p>
        </div>
        <FolderButton toolId="nutrition_calc" toolName="NutrimentsMacros" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Results Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 12, textAlign: 'center', borderTop: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PROTÉINES</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 8 }}>{macros.proteinG}g</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>{macros.proteinPct}% (4 kcal/g)</span>
          </div>

          <div className="glass-panel" style={{ padding: 24, borderRadius: 12, textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GLUCIDES</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 8 }}>{macros.carbG}g</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>{macros.carbPct}% (4 kcal/g)</span>
          </div>

          <div className="glass-panel" style={{ padding: 24, borderRadius: 12, textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LIPIDES</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 8 }}>{macros.fatG}g</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>{macros.fatPct}% (9 kcal/g)</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Cibles Énergétiques</h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calories cibles (kcal)</label>
            <input type="number" step="50" value={calories} onChange={(e) => setCalories(Math.max(100, parseInt(e.target.value) || 100))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Objectif physique</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value="recomp">Recomposition (30/40/30)</option>
              <option value="cut">Sèche / Perte (40/30/30)</option>
              <option value="bulk">Prise de masse (25/50/25)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}