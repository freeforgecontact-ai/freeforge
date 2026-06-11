import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function IMCMetabolisme({ goBack }) {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState(1.375); // active

  const [output, setOutput] = useState({
    bmi: 0,
    bmiCategory: '',
    bmr: 0,
    tdee: 0
  });

  useEffect(() => {
    localStorage.setItem('ff_bmi', JSON.stringify({ weight, height, age, gender, activity }));
    calculateMetabolism();
  }, [weight, height, age, gender, activity]);

  const calculateMetabolism = () => {
    const hMeter = height / 100;
    const bmi = weight / (hMeter * hMeter);

    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Insuffisance pondérale';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Surpoids';
    else bmiCategory = 'Obésité';

    // Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    setOutput({
      bmi,
      bmiCategory,
      bmr,
      tdee: bmr * activity
    });
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ⚖️ Calculateur IMC & Métabolisme
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Déterminez votre Indice de Masse Corporelle (IMC), votre BMR (métabolisme de base) et vos besoins caloriques journaliers.
          </p>
        </div>
        <FolderButton toolId="bmi_calculator" toolName="IMCMetabolisme" localStorageKeys={["ff_bmi"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Vos Informations</h2>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Poids (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taille (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(Math.max(0, parseFloat(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Âge</label>
            <input type="number" value={age} onChange={(e) => setAge(Math.max(0, parseInt(e.target.value) || 0))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Genre</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Niveau d'activité physique</label>
            <select value={activity} onChange={(e) => setActivity(parseFloat(e.target.value))} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
              <option value={1.2}>Sédentaire</option>
              <option value={1.375}>Légèrement actif (1-3 fois/semaine)</option>
              <option value={1.55}>Modérément actif (3-5 fois/semaine)</option>
              <option value={1.725}>Très actif (tous les jours)</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Indice de Masse Corporelle (IMC)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
              {output.bmi.toFixed(1)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: 4 }}>{output.bmiCategory}</span>
          </div>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Métabolisme de Base (BMR)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginTop: 4 }}>
              {Math.round(output.bmr)} kcal
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Besoins Énergétiques (TDEE)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {Math.round(output.tdee)} kcal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}