import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function PantryStock({ goBack }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('ff_pantry');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Riz Basmati', quantity: '2 kg', category: 'Sec', exp: '2027-01-01' },
      { id: '2', name: 'Lait d\'amande', quantity: '1 L', category: 'Frais', exp: '2026-06-30' }
    ];
  });

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Sec');
  const [exp, setExp] = useState('');

  useEffect(() => {
    localStorage.setItem('ff_pantry', JSON.stringify(items));
  }, [items]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;

    const newItem = {
      id: Date.now().toString(),
      name,
      quantity,
      category,
      exp
    };

    setItems([...items, newItem]);
    setName('');
    setQuantity('');
    setExp('');
  };

  const handleDelete = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🥫 Pantry & Expiration Tracker
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Gérez vos réserves de nourriture et prévenez le gaspillage grâce à un suivi local des dates de péremption.
          </p>
        </div>
        <FolderButton toolId="pantry_tracker" toolName="PantryStock" localStorageKeys={["ff_pantry"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Table of items */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Vos Ingrédients en Stock</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: 12 }}>Ingrédient</th>
                <th style={{ padding: 12 }}>Quantité</th>
                <th style={{ padding: 12 }}>Catégorie</th>
                <th style={{ padding: 12 }}>Péremption</th>
                <th style={{ padding: 12 }} className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Aucun aliment répertorié.</td>
                </tr>
              ) : (
                items.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                    <td style={{ padding: 12, fontWeight: 'bold', color: 'white' }}>{i.name}</td>
                    <td style={{ padding: 12 }}>{i.quantity || '-'}</td>
                    <td style={{ padding: 12 }}>{i.category}</td>
                    <td style={{ padding: 12, color: '#f59e0b' }}>{i.exp || 'Non spécifiée'}</td>
                    <td style={{ padding: 12 }} className="no-print">
                      <button onClick={() => handleDelete(i.id)} className="btn-premium btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Supprimer</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Input Form */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Ajouter un ingrédient</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom de l'aliment</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" required placeholder="Riz Basmati" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantité (ex: 2 kg, 1L)</label>
              <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-premium" placeholder="2 kg" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value="Sec">Sec & Conserven</option>
                <option value="Frais">Frais & Laitiers</option>
                <option value="Surgelé">Surgelés</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date de péremption</label>
              <input type="date" value={exp} onChange={(e) => setExp(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter au stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}