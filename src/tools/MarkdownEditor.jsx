import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';
import { marked } from 'marked';

export default function MarkdownEditor({ goBack }) {
  const [markdown, setMarkdown] = useState(`# Titre du Document (H1)

Voici un exemple de document **Markdown** édité en direct sur **FreeForge**.

## Fonctionnalités clés (H2)
- Rendu en direct instantané
- Génération de PDF impeccable via l'impression du navigateur
- Zéro serveur, respect de votre vie privée

### Code block et Tableaux (H3)
\`\`\`javascript
function saluer() {
  console.log("Bienvenue sur FreeForge !");
}
\`\`\`

| Fonction | Performance | Local |
| :--- | :--- | :--- |
| Compression d'image | Ultra rapide | Oui |
| Rendu Markdown | Immédiat | Oui |

> "La simplicité est la sophistication suprême." - Léonard de Vinci
`);

  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Parse markdown to HTML
    try {
      const parsedHtml = marked.parse(markdown);
      setHtmlContent(parsedHtml);
    } catch (e) {
      console.error(e);
    }
  }, [markdown]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }} className="no-print">
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Document</span>
        <FolderButton toolId="markdown" toolName="Éditeur Markdown" localStorageKeys={[]} />
      </div>

      <div className="no-print">
        <h1 className="page-title">Éditeur Markdown vers PDF</h1>
        <p className="page-subtitle">Rédigez en Markdown et exportez des documents PDF parfaitement mis en page avec nos styles intégrés.</p>
      </div>

      {/* Editor layout grid */}
      <div className="grid-2" style={{ gridTemplateColumns: '48% 52%' }}>
        {/* Editor text pane (hidden during printing) */}
        <div className="card-premium markdown-editor-pane no-print" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Édition Markdown</h2>
            <button className="btn-premium btn-secondary" onClick={() => setMarkdown('')} style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444' }}>
              Effacer
            </button>
          </div>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Saisissez votre document..."
            style={{
              width: '100%',
              height: '400px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-light)',
              borderRadius: 10,
              padding: 16,
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5'
            }}
          />
        </div>

        {/* Live Preview Panel (expanded to fill screen during printing) */}
        <div className="card-premium markdown-preview-pane" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
            <h2 className="card-title" style={{ fontSize: '1rem' }}>Rendu Visuel</h2>
            <button className="btn-premium btn-primary" onClick={handlePrint} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Exporter en PDF
            </button>
          </div>

          {/* Render container with scoped printable styles */}
          <div 
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            style={{
              flexGrow: 1,
              overflowY: 'auto',
              maxHeight: '400px',
              padding: 24,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 10,
              border: '1px solid var(--border-light)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Embedded CSS rules specifically for printing format */}
      <style>{`
        .markdown-body h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
          color: white;
        }
        .markdown-body h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 12px;
          color: var(--primary);
        }
        .markdown-body h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin-top: 18px;
          margin-bottom: 8px;
        }
        .markdown-body p {
          margin-bottom: 14px;
          color: var(--text-secondary);
        }
        .markdown-body ul, .markdown-body ol {
          margin-left: 20px;
          margin-bottom: 16px;
          color: var(--text-secondary);
        }
        .markdown-body li {
          margin-bottom: 6px;
        }
        .markdown-body blockquote {
          border-left: 4px solid var(--primary);
          padding-left: 16px;
          font-style: italic;
          color: var(--text-secondary);
          background-color: rgba(139, 92, 246, 0.05);
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 16px;
        }
        .markdown-body pre {
          background-color: rgba(0,0,0,0.4);
          border: 1px solid var(--border-light);
          padding: 14px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.8rem;
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .markdown-body code {
          font-family: monospace;
          background-color: rgba(255,255,255,0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        .markdown-body pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.8rem;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid var(--border-light);
          padding: 10px 12px;
          text-align: left;
          font-size: 0.85rem;
        }
        .markdown-body th {
          background-color: rgba(255,255,255,0.02);
          font-weight: bold;
        }

        /* Printable styles override */
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .forge-sidebar {
            display: none !important;
          }
          .forge-workspace {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .grid-2 {
            display: block !important;
          }
          .markdown-preview-pane {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .markdown-body {
            background: white !important;
            border: none !important;
            color: black !important;
            max-height: none !important;
            padding: 0 !important;
            overflow-y: visible !important;
          }
          .markdown-body h1 {
            color: black !important;
            border-bottom: 1px solid #ddd !important;
          }
          .markdown-body h2 {
            color: #4f46e5 !important;
          }
          .markdown-body p, .markdown-body li, .markdown-body blockquote {
            color: #333 !important;
          }
          .markdown-body blockquote {
            background-color: #f3f4f6 !important;
            border-left: 4px solid #4f46e5 !important;
          }
          .markdown-body pre {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            color: black !important;
          }
          .markdown-body code {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
          }
          .markdown-body th {
            background-color: #f3f4f6 !important;
          }
          .markdown-body th, .markdown-body td {
            border: 1px solid #e5e7eb !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
