import React, { useState, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

const ENGLISH_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FRENCH_NOTES = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const FRENCH_FLAT_NOTES = ['Do', 'Réb', 'Ré', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

// Chord formulas as semitone offsets from root
const CHORD_FORMULAS = {
  '': [0, 4, 7],         // Major
  'm': [0, 3, 7],        // Minor
  '7': [0, 4, 7, 10],    // Dominant 7th
  'maj7': [0, 4, 7, 11], // Major 7th
  'm7': [0, 3, 7, 10],   // Minor 7th
  'sus4': [0, 5, 7],     // Suspended 4th
  'sus2': [0, 2, 7],     // Suspended 2nd
  'dim': [0, 3, 6],      // Diminished
  'aug': [0, 4, 8],      // Augmented
  'add9': [0, 4, 7, 14], // Add 9
  '6': [0, 4, 7, 9],     // Major 6th
  'm6': [0, 3, 7, 9],    // Minor 6th
};

const DEFAULT_SHEET = `[C] Gline au matin, la [Am] brume se lève,
[F] Sur les collines dorées par le [G] soleil.
[C] Le vent murmure un air de [Am] rêve,
Et la [F] nature sort doucement de son [G] sommeil.

Refrain:
[Am] Oh oh, c'est [Em] l'heure de chanter,
[F] Partir au loin et [C] voyager.
[F] Accorder nos guitares et nos [G] voix,
[F] Partager un instant de [G] joie !`;

export default function ChordTransposer({ goBack }) {
  const [sheetText, setSheetText] = useState(() => {
    return localStorage.getItem('freeforge_chord_sheet') || DEFAULT_SHEET;
  });
  const [semitones, setSemitones] = useState(() => {
    return parseInt(localStorage.getItem('freeforge_chord_semitones') || '0', 10);
  });
  const [notation, setNotation] = useState('english'); // english, french, flat
  const [isPlaying, setIsPlaying] = useState(null); // Active chord being played

  // Web Audio Context for playing chords
  const playChordSynth = (chordName) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      
      // Parse root note and chord quality
      const parsed = parseChord(chordName);
      if (!parsed) return;

      const { rootIndex, quality } = parsed;
      const baseFreq = 261.63; // C4
      // Calculate MIDI note value of the root (C4 is MIDI 60)
      const rootMidi = 60 + rootIndex;

      const formula = CHORD_FORMULAS[quality] || [0, 4, 7]; // Fallback to major triad
      
      const now = ctx.currentTime;
      const destination = ctx.destination;

      setIsPlaying(chordName);

      formula.forEach((offset, idx) => {
        const midiNote = rootMidi + offset;
        // Convert MIDI note to frequency
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

        // Simple Subtractive Synthesis: Sawtooth + Lowpass filter
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 800; // soft warmth

        // Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05 + idx * 0.025); // staggered strumming!
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });

      setTimeout(() => {
        setIsPlaying(null);
        ctx.close();
      }, 1400);

    } catch (err) {
      console.error("Erreur d'initialisation Web Audio", err);
    }
  };

  // Persist values in localStorage
  useEffect(() => {
    localStorage.setItem('freeforge_chord_sheet', sheetText);
  }, [sheetText]);

  useEffect(() => {
    localStorage.setItem('freeforge_chord_semitones', semitones.toString());
  }, [semitones]);

  // Find root note and rest of the chord
  const parseChord = (chordStr) => {
    // Clean spaces
    const cleanStr = chordStr.trim();
    if (!cleanStr) return null;

    let root = '';
    let rest = '';

    // Check if starts with a double letter note like C#, D#, F#, G#, A#, or Db, Eb, Gb, Ab, Bb
    if (cleanStr.length >= 2 && ['#', 'b'].includes(cleanStr[1])) {
      root = cleanStr.substring(0, 2);
      rest = cleanStr.substring(2);
    } else {
      root = cleanStr.substring(0, 1);
      rest = cleanStr.substring(1);
    }

    // Try to find index of root note
    let rootIndex = ENGLISH_NOTES.indexOf(root.toUpperCase());
    if (rootIndex === -1) {
      rootIndex = FLAT_NOTES.indexOf(root);
    }

    // Support French notations
    if (rootIndex === -1) {
      FRENCH_NOTES.forEach((fn, idx) => {
        if (root.toLowerCase() === fn.toLowerCase()) rootIndex = idx;
      });
      FRENCH_FLAT_NOTES.forEach((fn, idx) => {
        if (root.toLowerCase() === fn.toLowerCase()) rootIndex = idx;
      });
    }

    if (rootIndex === -1) return null;

    // Separate bass note if slashed chord like C/E
    let slashIndex = rest.indexOf('/');
    let bassIndex = -1;
    let quality = rest;

    if (slashIndex !== -1) {
      quality = rest.substring(0, slashIndex);
      const bassNote = rest.substring(slashIndex + 1);
      bassIndex = ENGLISH_NOTES.indexOf(bassNote.toUpperCase());
      if (bassIndex === -1) bassIndex = FLAT_NOTES.indexOf(bassNote);
      // Try French bass note
      if (bassIndex === -1) {
        FRENCH_NOTES.forEach((fn, idx) => {
          if (bassNote.toLowerCase() === fn.toLowerCase()) bassIndex = idx;
        });
      }
    }

    // Normalize quality to CHORD_FORMULAS keys
    let normQuality = '';
    if (quality.startsWith('m7')) normQuality = 'm7';
    else if (quality.startsWith('maj7')) normQuality = 'maj7';
    else if (quality.startsWith('sus4')) normQuality = 'sus4';
    else if (quality.startsWith('sus2')) normQuality = 'sus2';
    else if (quality.startsWith('add9')) normQuality = 'add9';
    else if (quality.startsWith('m')) normQuality = 'm';
    else if (quality.startsWith('7')) normQuality = '7';
    else if (quality.startsWith('dim')) normQuality = 'dim';
    else if (quality.startsWith('aug')) normQuality = 'aug';
    else if (quality.startsWith('6')) normQuality = '6';

    return { rootIndex, quality, bassIndex, normQuality };
  };

  // Convert note index to desired notation
  const getNoteName = (index, notationType) => {
    const idx = (index + 120) % 12;
    if (notationType === 'french') {
      return FRENCH_NOTES[idx];
    } else if (notationType === 'french-flat') {
      return FRENCH_FLAT_NOTES[idx];
    } else if (notationType === 'flat') {
      return FLAT_NOTES[idx];
    }
    return ENGLISH_NOTES[idx];
  };

  // Transpose a single chord
  const transposeChord = (chordStr, offset, notationType) => {
    // Check if it's a slashed chord
    const parsed = parseChord(chordStr);
    if (!parsed) return chordStr; // Return unmodified if parsing fails

    const { rootIndex, quality, bassIndex } = parsed;

    const transposedRootIdx = (rootIndex + offset + 120) % 12;
    const newRoot = getNoteName(transposedRootIdx, notationType);

    // Filter out slash note part or transpose it too
    let newQuality = quality;
    let slashIndex = quality.indexOf('/');
    if (slashIndex !== -1) {
      newQuality = quality.substring(0, slashIndex);
    }

    if (bassIndex !== -1) {
      const transposedBassIdx = (bassIndex + offset + 120) % 12;
      const newBass = getNoteName(transposedBassIdx, notationType);
      return `${newRoot}${newQuality}/${newBass}`;
    }

    return `${newRoot}${newQuality}`;
  };

  // Parse text sheet and return array of lines containing either lyrics or chord spans
  const getTransposedLines = () => {
    const lines = sheetText.split('\n');
    return lines.map((line) => {
      // Regex to match anything inside square brackets like [C], [Am], [F#m/G]
      const parts = [];
      let lastIdx = 0;
      const regex = /\[([^\]]+)\]/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        const textBefore = line.substring(lastIdx, match.index);
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore });
        }
        
        const origChord = match[1];
        const transposed = transposeChord(origChord, semitones, notation);

        parts.push({
          type: 'chord',
          original: origChord,
          transposed: transposed
        });

        lastIdx = regex.lastIndex;
      }

      const textAfter = line.substring(lastIdx);
      if (textAfter || parts.length === 0) {
        parts.push({ type: 'text', content: textAfter });
      }

      return parts;
    });
  };

  // Re-build text representation for copy/paste
  const getTransposedText = () => {
    const lines = getTransposedLines();
    return lines.map(lineParts => {
      return lineParts.map(part => {
        if (part.type === 'chord') {
          return `[${part.transposed}]`;
        }
        return part.content;
      }).join('');
    }).join('\n');
  };

  const copyTransposedToClipboard = () => {
    navigator.clipboard.writeText(getTransposedText());
    alert("Partition transposée copiée dans le presse-papiers !");
  };

  // Find all unique chords in the current sheet to display clickable preview chips
  const getUniqueChords = () => {
    const regex = /\[([^\]]+)\]/g;
    const chords = new Set();
    let match;
    while ((match = regex.exec(sheetText)) !== null) {
      chords.add(match[1]);
    }
    return Array.from(chords);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Transpositeur d'Accords Musical</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Transposez vos partitions instantanément, changez de notation (FR/EN) et écoutez les accords synthétisés.
          </p>
        </div>
        <FolderButton 
          toolId="chord_transposer" 
          toolName="Transpositeur Accords" 
          localStorageKeys={['freeforge_chord_sheet', 'freeforge_chord_semitones']} 
        />
      </div>

      <div className="grid-2">
        {/* Left Column: Input text area and chords parser */}
        <div className="card-premium" style={{ gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Partition Originale</h2>
            <button 
              onClick={() => setSheetText('')} 
              className="btn-premium"
              style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.05)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.1)' }}
            >
              Effacer tout
            </button>
          </div>
          
          <textarea
            value={sheetText}
            onChange={(e) => setSheetText(e.target.value)}
            placeholder="Entrez vos paroles avec des accords entre crochets. Exemple :&#10;[C] Bonjour le [Am] monde, [F] comment ça [G] va..."
            style={{
              width: '100%',
              height: '350px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 12,
              color: '#f3f4f6',
              resize: 'vertical',
              outline: 'none'
            }}
          />

          {getUniqueChords().length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                🔊 Cliquez pour écouter les accords originaux :
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {getUniqueChords().map((chord) => (
                  <button
                    key={chord}
                    onClick={() => playChordSynth(chord)}
                    className="btn-premium btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 16,
                      background: isPlaying === chord ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.05)',
                      color: isPlaying === chord ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    🎵 {chord}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Transposer controls & Live Transposed sheet output */}
        <div className="card-premium" style={{ gap: 16 }}>
          <h2 className="card-title">Paramètres & Résultat</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 10, border: '1px solid var(--border-light)' }}>
            
            {/* Semitone offset selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Transposition (demi-tons) :</span>
                <span style={{ fontWeight: 'bold', color: 'var(--secondary)', fontSize: '1rem' }}>
                  {semitones > 0 ? `+${semitones}` : semitones}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button 
                  onClick={() => setSemitones(prev => Math.max(-11, prev - 1))}
                  className="btn-premium btn-secondary"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 8 }}
                >
                  -
                </button>
                <input 
                  type="range"
                  min="-11"
                  max="11"
                  step="1"
                  value={semitones}
                  onChange={(e) => setSemitones(parseInt(e.target.value, 10))}
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={() => setSemitones(prev => Math.min(11, prev + 1))}
                  className="btn-premium btn-secondary"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 8 }}
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button 
                  onClick={() => setSemitones(0)}
                  className="btn-premium btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 6, flex: 1, justifyContent: 'center' }}
                >
                  🔄 Réinitialiser à 0
                </button>
              </div>
            </div>

            {/* Notation selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Format de notation :</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <button
                  onClick={() => setNotation('english')}
                  className={`btn-premium ${notation === 'english' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 0', justifyContent: 'center', borderRadius: 6 }}
                >
                  Anglo-Saxon (A, C, G)
                </button>
                <button
                  onClick={() => setNotation('flat')}
                  className={`btn-premium ${notation === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 0', justifyContent: 'center', borderRadius: 6 }}
                >
                  Anglo-Flats (Db, Eb)
                </button>
                <button
                  onClick={() => setNotation('french')}
                  className={`btn-premium ${notation === 'french' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 0', justifyContent: 'center', borderRadius: 6 }}
                >
                  Français (Do, Ré, Sol)
                </button>
              </div>
            </div>
          </div>

          {/* Transposed partition display */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Partition Transposée :</span>
              <button 
                onClick={copyTransposedToClipboard}
                className="btn-premium btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8 }}
              >
                📋 Copier la partition
              </button>
            </div>

            <div
              style={{
                width: '100%',
                height: '240px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                padding: 12,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#fff',
                lineHeight: '1.6'
              }}
            >
              {getTransposedLines().map((lineParts, lineIdx) => (
                <div key={lineIdx} style={{ minHeight: '1.4em' }}>
                  {lineParts.map((part, partIdx) => {
                    if (part.type === 'chord') {
                      return (
                        <span 
                          key={partIdx} 
                          onClick={() => playChordSynth(part.transposed)}
                          style={{ 
                            color: 'var(--secondary)', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            backgroundColor: isPlaying === part.transposed ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                            padding: '2px 4px',
                            borderRadius: 4,
                            margin: '0 2px',
                            border: '1px dashed rgba(139, 92, 246, 0.3)'
                          }}
                          title="Cliquez pour écouter cet accord transposé"
                        >
                          {part.transposed}
                        </span>
                      );
                    }
                    return <span key={partIdx}>{part.content}</span>;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
