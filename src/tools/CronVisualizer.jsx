import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CronVisualizer({ goBack }) {
  const [cronExpression, setCronExpression] = useState('*/5 * * * *');
  const [description, setDescription] = useState('');
  const [nextDates, setNextDates] = useState([]);
  const [error, setError] = useState('');

  const parseCronField = (field, min, max, label) => {
    if (field === '*') return `chaque ${label}`;
    if (field.includes('/')) {
      const parts = field.split('/');
      const step = parts[1];
      if (parts[0] === '*') {
        return `toutes les ${step} ${label}s`;
      }
      return `toutes les ${step} ${label}s à partir de ${parts[0]}`;
    }
    if (field.includes('-')) {
      const parts = field.split('-');
      return `de la ${label} ${parts[0]} à la ${label} ${parts[1]}`;
    }
    if (field.includes(',')) {
      const parts = field.split(',');
      return `aux ${label}s (${parts.join(', ')})`;
    }
    return `à la ${label} ${field}`;
  };

  const getDayOfWeekName = (num) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[parseInt(num, 10)] || num;
  };

  const getMonthName = (num) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[parseInt(num, 10) - 1] || num;
  };

  const explainCron = (expr) => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error("Une expression CRON standard doit comporter exactement 5 champs (Minute, Heure, Jour, Mois, Jour de la semaine).");
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Validate fields format roughly
    const reg = /^[0-9*,\-\/]+$/;
    parts.forEach((p, idx) => {
      if (!reg.test(p)) {
        throw new Error(`Le champ #${idx + 1} contient des caractères invalides.`);
      }
    });

    let desc = "S'exécutera ";

    // Day of week mapping
    let dayOfWeekDesc = '';
    if (dayOfWeek !== '*') {
      if (dayOfWeek.includes(',')) {
        dayOfWeekDesc = "les " + dayOfWeek.split(',').map(d => getDayOfWeekName(d)).join(', ');
      } else if (dayOfWeek.includes('-')) {
        const [d1, d2] = dayOfWeek.split('-');
        dayOfWeekDesc = `du ${getDayOfWeekName(d1)} au ${getDayOfWeekName(d2)}`;
      } else {
        dayOfWeekDesc = `les ${getDayOfWeekName(dayOfWeek)}s`;
      }
    }

    // Month mapping
    let monthDesc = '';
    if (month !== '*') {
      if (month.includes(',')) {
        monthDesc = "en " + month.split(',').map(m => getMonthName(m)).join(', ');
      } else {
        monthDesc = `en ${getMonthName(month)}`;
      }
    }

    // Hour/Minute descriptions
    let timeDesc = '';
    if (hour === '*' && minute === '*') {
      timeDesc = "chaque minute de chaque heure";
    } else if (hour === '*' && minute.includes('/')) {
      timeDesc = `toutes les ${minute.split('/')[1]} minutes`;
    } else if (hour.includes('/') && minute === '0') {
      timeDesc = `toutes les ${hour.split('/')[1]} heures au début de l'heure`;
    } else {
      const minVal = minute === '*' ? 'chaque minute' : `minute ${minute}`;
      const hourVal = hour === '*' ? 'chaque heure' : `heure ${hour}`;
      timeDesc = `à la ${minVal} de ${hourVal}`;
    }

    let dayOfMonthDesc = '';
    if (dayOfMonth !== '*') {
      dayOfMonthDesc = `le ${dayOfMonth} du mois`;
    }

    const sentences = [];
    sentences.push(timeDesc);
    if (dayOfMonthDesc) sentences.push(dayOfMonthDesc);
    if (monthDesc) sentences.push(monthDesc);
    if (dayOfWeekDesc) sentences.push(dayOfWeekDesc);

    return desc + sentences.join(', ') + '.';
  };

  // Mock next executions generator
  const calculateNextRuns = (expr) => {
    // Generate dates based on simple heuristic for common expressions (or fallbacks)
    const dates = [];
    let current = new Date();
    
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    let stepMin = 1;
    if (minute.includes('/')) {
      stepMin = parseInt(minute.split('/')[1], 10) || 1;
    } else if (minute !== '*') {
      // Pick first static minute
      stepMin = parseInt(minute.split(',')[0].split('-')[0], 10) || 0;
    }

    let stepHour = 1;
    if (hour.includes('/')) {
      stepHour = parseInt(hour.split('/')[1], 10) || 1;
    } else if (hour !== '*') {
      stepHour = parseInt(hour.split(',')[0].split('-')[0], 10) || 0;
    }

    // Round minutes to step
    if (minute !== '*') {
      current.setMinutes(stepMin);
    }
    if (hour !== '*') {
      current.setHours(stepHour);
    }
    current.setSeconds(0);
    current.setMilliseconds(0);

    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        if (minute === '*') {
          current = new Date(current.getTime() + 60000); // add 1 minute
        } else if (minute.includes('/')) {
          current = new Date(current.getTime() + stepMin * 60000);
        } else if (hour === '*') {
          current = new Date(current.getTime() + 3600000); // add 1 hour
        } else {
          current = new Date(current.getTime() + 86400000); // add 1 day
        }
      }
      dates.push(new Date(current));
    }
    return dates;
  };

  useEffect(() => {
    try {
      setError('');
      const desc = explainCron(cronExpression);
      setDescription(desc);
      const runs = calculateNextRuns(cronExpression);
      setNextDates(runs);
    } catch (err) {
      setError(err.message);
      setDescription('');
      setNextDates([]);
    }
  }, [cronExpression]);

  const setPreset = (preset) => {
    setCronExpression(preset);
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            ⏰ Cron Builder & Visualizer
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Visualisez et planifiez vos tâches planifiées locales sans effort en concevant des expressions CRON.
          </p>
        </div>
        <FolderButton toolId="cron" toolName="CronVisualizer" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Designer panel */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Expression CRON</h2>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input 
              type="text" 
              value={cronExpression} 
              onChange={(e) => setCronExpression(e.target.value)}
              className="input-premium"
              style={{ flex: 1, padding: 14, borderRadius: 10, fontSize: '1.2rem', letterSpacing: 2, fontFamily: 'monospace', textAlign: 'center' }}
              placeholder="* * * * *"
            />
          </div>

          {error ? (
            <div style={{ padding: 16, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#fca5a5', fontSize: '0.9rem' }}>
              ⚠️ Erreur de syntaxe : {error}
            </div>
          ) : (
            <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 800 }}>Traduction en clair</span>
              <p style={{ fontSize: '1.05rem', color: 'white', fontWeight: 600, lineHeight: 1.4 }}>{description}</p>
            </div>
          )}

          {/* Quick presets */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 24, marginBottom: 12, color: 'white' }}>Raccourcis & Exemples</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button onClick={() => setPreset('* * * * *')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>Chaque minute</button>
            <button onClick={() => setPreset('*/5 * * * *')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>Chaque 5 minutes</button>
            <button onClick={() => setPreset('0 * * * *')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>Chaque heure</button>
            <button onClick={() => setPreset('0 0 * * *')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>Chaque minuit</button>
            <button onClick={() => setPreset('0 8 * * 1-5')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>Semaine à 8:00</button>
            <button onClick={() => setPreset('0 12 1 * *')} className="btn-premium btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8 }}>1er du mois à 12:00</button>
          </div>
        </div>

        {/* Next runs sidebar */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'white' }}>Prochaines exécutions</h2>
          
          {nextDates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nextDates.map((date, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              Aucune date disponible (expression invalide)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
