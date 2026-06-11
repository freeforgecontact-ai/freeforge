import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function MealPrepMenu({ goBack }) {
  const [meals, setMeals] = useState(() => {
    try {
      const saved = localStorage.getItem('ff_mealprep');
      return saved ? JSON.parse(saved) : {
        Lundi: { breakfast: 'Gruau aux fruits', lunch: 'Salade de poulet', dinner: 'Saumon au four' },
        Mardi: { breakfast: 'Gruau aux fruits', lunch: 'Salade de poulet', dinner: 'Sauté de bœuf' },
        Mercredi: { breakfast: 'Œufs brouillés', lunch: 'Sauté de bœuf', dinner: 'Pâtes pesto' }
      };
    } catch (e) {
      console.error("Erreur lors de la lecture de ff_mealprep:", e);
      return {
        Lundi: { breakfast: 'Gruau aux fruits', lunch: 'Salade de poulet', dinner: 'Saumon au four' },
        Mardi: { breakfast: 'Gruau aux fruits', lunch: 'Salade de poulet', dinner: 'Sauté de bœuf' },
        Mercredi: { breakfast: 'Œufs brouillés', lunch: 'Sauté de bœuf', dinner: 'Pâtes pesto' }
      };
    }
  });

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    localStorage.setItem('ff_mealprep', JSON.stringify(meals));
  }, [meals]);

  const handleChange = (day, mealType, val) => {
    setMeals({
      ...meals,
      [day]: {
        ...meals[day],
        [mealType]: val
      }
    });
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meals, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "mealprep_weekly_plan.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);
        
        const validated = {};
        days.forEach(day => {
          validated[day] = {
            breakfast: (parsed[day] && parsed[day].breakfast) || '',
            lunch: (parsed[day] && parsed[day].lunch) || '',
            dinner: (parsed[day] && parsed[day].dinner) || ''
          };
        });
        setMeals(validated);
        alert("Menu hebdomadaire importé avec succès !");
      } catch (err) {
        console.error(err);
        alert("Erreur lors du chargement du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🍳 Meal Prep Weekly Planner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Organisez vos repas de la semaine et exportez ou importez votre plan alimentaire sous forme de fichier JSON pour le partager.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleExportJSON} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem' }} title="Partager le plan sous forme de fichier JSON téléchargé">
            📤 Exporter / Partager
          </button>
          <label className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer' }} title="Importer un plan au format JSON partagé">
            📥 Importer
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
          <FolderButton toolId="mealprep" toolName="MealPrepMenu" localStorageKeys={["ff_mealprep"]} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {days.map(d => {
          const item = meals[d] || { breakfast: '', lunch: '', dinner: '' };
          return (
            <div key={d} className="glass-panel" style={{ padding: 18, borderRadius: 12, display: 'grid', gridTemplateColumns: '120px repeat(3, 1fr)', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{d}</span>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Déjeuner</label>
                <input type="text" value={item.breakfast} onChange={(e) => handleChange(d, 'breakfast', e.target.value)} className="input-premium" style={{ width: '90%', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dîner</label>
                <input type="text" value={item.lunch} onChange={(e) => handleChange(d, 'lunch', e.target.value)} className="input-premium" style={{ width: '90%', marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Souper</label>
                <input type="text" value={item.dinner} onChange={(e) => handleChange(d, 'dinner', e.target.value)} className="input-premium" style={{ width: '90%', marginTop: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}