import React, { useState } from 'react';
import FolderButton from '../components/FolderButton';

export default function RecettesPortions({ goBack }) {
  const [servings, setServings] = useState(4);
  const [target, setTarget] = useState(6);

  const [ingredients, setIngredients] = useState([
    { id: '1', name: 'Farine', qty: 200, unit: 'g' },
    { id: '2', name: 'Sucre', qty: 100, unit: 'g' },
    { id: '3', name: 'Œufs', qty: 2, unit: 'unité' }
  ]);

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');

  const factor = servings > 0 ? target / servings : 1;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !qty) return;

    const newIng = {
      id: Date.now().toString(),
      name,
      qty: parseFloat(qty),
      unit
    };

    setIngredients([...ingredients, newIng]);
    setName('');
    setQty('');
  };

  const handleDelete = (id) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🍳 Recipe Scaler & Portions Converter
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Ajustez proportionnellement les quantités de vos ingrédients en changeant le nombre de portions.
          </p>
        </div>
        <FolderButton toolId="recipe_scaler" toolName="RecettesPortions" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Ingredients list showing calculated proportions */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portions Initiales</label>
              <input type="number" value={servings} onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portions Cibles</label>
              <input type="number" value={target} onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 12 }}>Ingrédients mis à l'échelle (Facteur x{factor.toFixed(2)})</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: 10 }}>Ingrédient</th>
                <th style={{ padding: 10 }}>Quantité Initiale</th>
                <th style={{ padding: 10 }}>Quantité Cible</th>
                <th style={{ padding: 10 }} className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(i => {
                const targetQty = i.qty * factor;
                return (
                  <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                    <td style={{ padding: 10, fontWeight: 'bold', color: 'white' }}>{i.name}</td>
                    <td style={{ padding: 10 }}>{i.qty} {i.unit}</td>
                    <td style={{ padding: 10, color: '#10b981', fontWeight: 'bold' }}>{targetQty.toFixed(1)} {i.unit}</td>
                    <td style={{ padding: 10 }} className="no-print">
                      <button onClick={() => handleDelete(i.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Retirer</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Input Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Ajouter un ingrédient</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom de l'ingrédient</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" required placeholder="Farine" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantité</label>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="input-premium" required placeholder="200" style={{ width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unité</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="input-premium" required placeholder="g" style={{ width: '100%', marginTop: 4 }} />
              </div>
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}