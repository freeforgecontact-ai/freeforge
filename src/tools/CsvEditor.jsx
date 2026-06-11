import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

export default function CsvEditor({ goBack }) {
  const [headers, setHeaders] = useState(['Nom', 'Prénom', 'Email', 'Rôle']);
  const [rows, setRows] = useState([
    ['Dupont', 'Jean', 'jean.dupont@company.com', 'Développeur'],
    ['Tremblay', 'Sophie', 'sophie.t@company.com', 'Designer'],
    ['Roy', 'Michel', 'm.roy@company.com', 'Gestionnaire']
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, colIndex }
  const [cellValue, setCellValue] = useState('');

  // Simple CSV Parser
  const parseCSV = (text) => {
    // Detect delimiter
    const commaCount = (text.match(/,/g) || []).length;
    const semiCount = (text.match(/;/g) || []).length;
    const delim = semiCount > commaCount ? ';' : ',';
    setDelimiter(delim);

    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    // Helper to split line respecting quotes
    const splitLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parsedHeaders = splitLine(lines[0]);
    const parsedRows = lines.slice(1).map(line => {
      const row = splitLine(line);
      // Pad or truncate row to match headers count
      while (row.length < parsedHeaders.length) row.push('');
      return row.slice(0, parsedHeaders.length);
    });

    setHeaders(parsedHeaders);
    setRows(parsedRows);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      parseCSV(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleCellClick = (rowIndex, colIndex, val) => {
    setEditingCell({ rowIndex, colIndex });
    setCellValue(val);
  };

  const saveCellEdit = () => {
    if (!editingCell) return;
    const newRows = [...rows];
    newRows[editingCell.rowIndex][editingCell.colIndex] = cellValue;
    setRows(newRows);
    setEditingCell(null);
  };

  const handleHeaderEdit = (colIndex, val) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = val;
    setHeaders(newHeaders);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill('');
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const addColumn = () => {
    const colName = `Colonne_${headers.length + 1}`;
    setHeaders(prev => [...prev, colName]);
    setRows(prev => prev.map(row => [...row, '']));
  };

  const deleteColumn = (colIndex) => {
    if (headers.length <= 1) return;
    setHeaders(prev => prev.filter((_, i) => i !== colIndex));
    setRows(prev => prev.map(row => row.filter((_, i) => i !== colIndex)));
  };

  // Stringify Table to CSV
  const exportCSV = () => {
    const escapeField = (val) => {
      if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const headerLine = headers.map(escapeField).join(delimiter);
    const rowsLines = rows.map(row => row.map(escapeField).join(delimiter));
    const csvContent = [headerLine, ...rowsLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `edited_data_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert and Download JSON
  const exportJSON = () => {
    const jsonArr = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });

    const blob = new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `edited_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = rows.filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Éditeur de Tableur CSV</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Visualisez et modifiez vos bases de données CSV de façon 100% visuelle et locale.</p>
        </div>
        <FolderButton toolId="csv_editor" toolName="Éditeur CSV" />
      </div>

      <div className="card-premium" style={{ gap: 20 }}>
        {/* Toolbar controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }} className="no-print">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label className="btn-premium btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
              📁 Importer un CSV
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={addRow} className="btn-premium btn-secondary" style={{ fontSize: '0.85rem' }}>
              ➕ Ligne
            </button>
            <button onClick={addColumn} className="btn-premium btn-secondary" style={{ fontSize: '0.85rem' }}>
              ➕ Colonne
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="input-premium"
              style={{ width: 200, padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button onClick={exportCSV} className="btn-premium btn-primary" style={{ fontSize: '0.85rem', padding: '10px 16px' }}>
              📥 Exporter CSV
            </button>
            <button onClick={exportJSON} className="btn-premium btn-secondary" style={{ fontSize: '0.85rem', padding: '10px 16px' }}>
              📥 Exporter JSON
            </button>
          </div>
        </div>

        {/* Dynamic CSV Table */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => handleHeaderEdit(i, e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none', width: '100%' }}
                        />
                        <button 
                          onClick={() => deleteColumn(i)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Supprimer la colonne"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ width: 80 }} className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '10px 16px', cursor: 'pointer' }}>
                        {editingCell && editingCell.rowIndex === rIdx && editingCell.colIndex === cIdx ? (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={saveCellEdit}
                            onKeyDown={(e) => e.key === 'Enter' && saveCellEdit()}
                            autoFocus
                            className="input-premium"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        ) : (
                          <div onClick={() => handleCellClick(rIdx, cIdx, cell)} style={{ minHeight: 20 }}>
                            {cell || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>vide</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="no-print" style={{ padding: '10px 16px' }}>
                      <button 
                        onClick={() => deleteRow(rIdx)} 
                        className="btn-premium" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Suppr.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
