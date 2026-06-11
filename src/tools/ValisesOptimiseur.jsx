import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function ValisesOptimiseur({ goBack }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('ff_packing');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Passeport & Documents', checked: false, category: 'Documents' },
      { id: '2', name: 'Brosse à dents', checked: false, category: 'Toiletrie' },
      { id: '3', name: 'T-shirts (x5)', checked: false, category: 'Vêtements' }
    ];
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Documents');

  useEffect(() => {
    localStorage.setItem('ff_packing', JSON.stringify(items));
  }, [items]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;

    const newItem = {
      id: Date.now().toString(),
      name,
      checked: false,
      category
    };

    setItems([...items, newItem]);
    setName('');
  };

  const toggleCheck = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const total = items.length;
  const checkedCount = items.filter(i => i.checked).length;
  const progress = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🧳 Packing List Optimizer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Préparez vos bagages sans rien oublier grâce à notre check-list intelligente.
          </p>
        </div>
        <FolderButton toolId="packing_list" toolName="ValisesOptimiseur" localStorageKeys={["ff_packing"]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Packing items list */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Contenu de votre valise</h2>
            <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 'bold' }}>{progress}% complété</span>
          </div>

          <div style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', marginBottom: 20 }}>
            <div style={{ width: progress + '%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 6 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Votre valise est vide...</span>
            ) : (
              items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={i.checked} onChange={() => toggleCheck(i.id)} style={{ cursor: 'pointer', width: 18, height: 18 }} />
                    <span style={{ textDecoration: i.checked ? 'line-through' : 'none', color: i.checked ? 'var(--text-secondary)' : 'white', fontWeight: 600 }}>
                      {i.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 8 }}>({i.category})</span>
                    </span>
                  </div>
                  <button onClick={() => handleDelete(i.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Ajouter un article</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nom de l'objet</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-premium" required placeholder="Brosse à dents" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-premium" style={{ width: '100%', marginTop: 4 }}>
                <option value="Documents">Documents & Billets</option>
                <option value="Toiletrie">Toiletrie & Hygiène</option>
                <option value="Vêtements">Vêtements</option>
                <option value="Électronique">Électronique & Chargeurs</option>
              </select>
            </div>
            <button type="submit" className="btn-premium btn-primary" style={{ padding: 10, marginTop: 8, fontWeight: 'bold' }}>
              Ajouter à la valise
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}