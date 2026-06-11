import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function ShiftScheduler({ goBack }) {
  // Employees list
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('freeforge_scheduler_employees');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Tremblay, Jean', wage: 18.5 },
      { id: 2, name: 'Gagnon, Marie', wage: 20.0 },
      { id: 3, name: 'Roy, Pierre', wage: 17.0 }
    ];
  });

  // Schedule Grid: { [employeeId]: { mon: '09:00-17:00 (30)', tue: 'OFF', ... } }
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('freeforge_scheduler_grid');
    return saved ? JSON.parse(saved) : {};
  });

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('18.00');

  useEffect(() => {
    localStorage.setItem('freeforge_scheduler_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('freeforge_scheduler_grid', JSON.stringify(schedule));
  }, [schedule]);

  const addEmployee = (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const newEmp = {
      id: Date.now(),
      name: newEmpName.trim(),
      wage: parseFloat(newEmpWage) || 15.25 // minimum wage default
    };
    setEmployees([...employees, newEmp]);
    setNewEmpName('');
  };

  const removeEmployee = (id) => {
    if (confirm("Retirer cet employé et supprimer ses horaires planifiés ?")) {
      setEmployees(employees.filter(e => e.id !== id));
      const updatedSchedule = { ...schedule };
      delete updatedSchedule[id];
      setSchedule(updatedSchedule);
    }
  };

  const updateShift = (empId, day, value) => {
    setSchedule(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [day]: value
      }
    }));
  };

  // Helper to parse shift time e.g., '09:00-17:00 (30)' -> hours
  const parseShiftHours = (shiftString) => {
    if (!shiftString || typeof shiftString !== 'string') return 0;
    const clean = shiftString.toUpperCase().trim();
    if (clean === 'OFF' || clean === 'CONGÉ' || clean === 'CONGE' || clean === '') return 0;
    
    try {
      // Look for format like 09:00-17:00 or 09:00 - 17:00
      const timeMatch = clean.match(/(\d{1,2})[h:]?(\d{2})?\s*-\s*(\d{1,2})[h:]?(\d{2})?/i);
      if (!timeMatch) return 0;

      const startH = parseInt(timeMatch[1]);
      const startM = parseInt(timeMatch[2] || '0');
      const endH = parseInt(timeMatch[3]);
      const endM = parseInt(timeMatch[4] || '0');

      let startMin = startH * 60 + startM;
      let endMin = endH * 60 + endM;

      // Handle overnight shifts e.g. 23:00 - 07:00
      if (endMin < startMin) {
        endMin += 24 * 60;
      }

      let durationMin = endMin - startMin;

      // Deduct break in minutes if specified, e.g. (30) or (45) or (60)
      const breakMatch = clean.match(/\((\d+)\)/);
      if (breakMatch) {
        const breakMin = parseInt(breakMatch[1]);
        durationMin = Math.max(0, durationMin - breakMin);
      }

      return parseFloat((durationMin / 60).toFixed(2));
    } catch (err) {
      return 0;
    }
  };

  // Calculations for employee totals
  const getEmployeeWeeklyHours = (empId) => {
    const empShifts = schedule[empId] || {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return days.reduce((sum, day) => sum + parseShiftHours(empShifts[day]), 0);
  };

  // Grand totals
  const totalWeeklyHours = employees.reduce((sum, e) => sum + getEmployeeWeeklyHours(e.id), 0);
  const totalWeeklyWage = employees.reduce((sum, e) => sum + (getEmployeeWeeklyHours(e.id) * e.wage), 0);

  const daysList = [
    { key: 'mon', label: 'Lundi' },
    { key: 'tue', label: 'Mardi' },
    { key: 'wed', label: 'Mercredi' },
    { key: 'thu', label: 'Jeudi' },
    { key: 'fri', label: 'Vendredi' },
    { key: 'sat', label: 'Samedi' },
    { key: 'sun', label: 'Dimanche' }
  ];

  // CSV exporter
  const exportToCsv = () => {
    if (employees.length === 0) return;
    
    let csv = "Employe,Taux horaire ($),Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche,Total Heures,Cout salarial ($)\n";
    
    employees.forEach(e => {
      const empShifts = schedule[e.id] || {};
      const hours = getEmployeeWeeklyHours(e.id);
      const row = [
        `"${e.name.replace(/"/g, '""')}"`,
        e.wage,
        `"${(empShifts.mon || '').replace(/"/g, '""')}"`,
        `"${(empShifts.tue || '').replace(/"/g, '""')}"`,
        `"${(empShifts.wed || '').replace(/"/g, '""')}"`,
        `"${(empShifts.thu || '').replace(/"/g, '""')}"`,
        `"${(empShifts.fri || '').replace(/"/g, '""')}"`,
        `"${(empShifts.sat || '').replace(/"/g, '""')}"`,
        `"${(empShifts.sun || '').replace(/"/g, '""')}"`,
        hours.toFixed(2),
        (hours * e.wage).toFixed(2)
      ].join(",");
      csv += row + "\n";
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `horaires_employes_semaine_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllSchedule = () => {
    if (confirm("Voulez-vous réinitialiser toute la grille d'horaire pour la semaine ?")) {
      setSchedule({});
    }
  };

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">RH & Opérations</span>
        <FolderButton toolId="scheduler" toolName="Horaires d'Employés" localStorageKeys={['freeforge_scheduler_employees', 'freeforge_scheduler_grid']} />
      </div>

      <h1 className="page-title">Planificateur d'Horaires d'Employés</h1>
      <p className="page-subtitle">Créez et distribuez les quarts de travail hebdomadaires et estimez instantanément vos coûts de main-d'œuvre.</p>

      {/* Stats row */}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Masse salariale hebdomadaire</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{totalWeeklyWage.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
        </div>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Heures planifiées totales</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{totalWeeklyHours.toFixed(1)} h</div>
        </div>
        <div className="card-premium" style={{ cursor: 'default', padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Employés actifs</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{employees.length}</div>
        </div>
      </div>

      {/* Main split */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Top bar: Add Employee */}
        <form className="card-premium" onSubmit={addEmployee} style={{ cursor: 'default', flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, padding: '16px 20px' }}>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Nom de l'employé</label>
            <input 
              type="text" 
              className="input-premium" 
              placeholder="Ex: Tremblay, Jean" 
              value={newEmpName}
              onChange={e => setNewEmpName(e.target.value)}
              required
            />
          </div>
          <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Taux horaire ($/h)</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              className="input-premium" 
              value={newEmpWage}
              onChange={e => setNewEmpWage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-premium btn-primary">
            + Ajouter
          </button>
        </form>

        {/* Schedule grid */}
        <div className="card-premium" style={{ cursor: 'default', width: '100%', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>📅 Grille de la semaine</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format de quart : <code>09:00-17:00 (30)</code> ou <code>OFF</code></span>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              {employees.length > 0 && (
                <>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={exportToCsv}>
                    📥 Exporter CSV
                  </button>
                  <button className="btn-premium btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }} onClick={clearAllSchedule}>
                    Vider la grille
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%', borderRadius: 8 }}>
            <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 12, width: 180 }}>Employé</th>
                  {daysList.map(d => (
                    <th key={d.key} style={{ padding: 12, textAlign: 'center' }}>{d.label}</th>
                  ))}
                  <th style={{ padding: 12, textAlign: 'right', width: 90 }}>Heures</th>
                  <th style={{ padding: 12, textAlign: 'right', width: 100 }}>Coût</th>
                  <th style={{ padding: 12, textAlign: 'center', width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => {
                  const empShifts = schedule[e.id] || {};
                  const hours = getEmployeeWeeklyHours(e.id);
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* Name & Rate */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 'bold' }}>{e.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.wage.toFixed(2)} $/h</div>
                      </td>

                      {/* Shifts Mon-Sun inputs */}
                      {daysList.map(d => (
                        <td key={d.key} style={{ padding: 6 }}>
                          <input 
                            type="text"
                            placeholder="OFF"
                            className="input-premium"
                            style={{ padding: '6px 8px', fontSize: '0.75rem', textAlign: 'center', minWidth: 100 }}
                            value={empShifts[d.key] || ''}
                            onChange={(event) => updateShift(e.id, d.key, event.target.value)}
                          />
                        </td>
                      ))}

                      {/* Weekly Hours total */}
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {hours.toFixed(1)} h
                      </td>

                      {/* Weekly Cost total */}
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {(hours * e.wage).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </td>

                      {/* Remove employee button */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => removeEmployee(e.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
