import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function MeditationSons({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(50);
  const [volBinaural, setVolBinaural] = useState(40);
  const [volBowl, setVolBowl] = useState(40);
  const [volRain, setVolRain] = useState(30);
  const [volChime, setVolChime] = useState(40);

  // Timer auto-stop
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  
  // Individual Gain Nodes
  const gainBinauralRef = useRef(null);
  const gainBowlRef = useRef(null);
  const gainRainRef = useRef(null);
  const gainChimeRef = useRef(null);

  // Sound sources
  const sourcesRef = useRef([]);

  // Timer interval ref
  const timerIntervalRef = useRef(null);

  const startAmbient = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      // Master Gain
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(masterVolume / 100, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
      masterGainRef.current = masterGain;

      // 1. Binaural Beats (Delta: 100Hz Left, 104Hz Right)
      const gainBinaural = audioCtx.createGain();
      gainBinaural.gain.setValueAtTime(volBinaural / 100, audioCtx.currentTime);
      gainBinaural.connect(masterGain);
      gainBinauralRef.current = gainBinaural;

      const oscL = audioCtx.createOscillator();
      oscL.frequency.setValueAtTime(100, audioCtx.currentTime);
      const oscR = audioCtx.createOscillator();
      oscR.frequency.setValueAtTime(104, audioCtx.currentTime);

      const pannerL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
      const pannerR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-1, audioCtx.currentTime);
        pannerR.pan.setValueAtTime(1, audioCtx.currentTime);
        oscL.connect(pannerL).connect(gainBinaural);
        oscR.connect(pannerR).connect(gainBinaural);
      } else {
        oscL.connect(gainBinaural);
        oscR.connect(gainBinaural);
      }
      oscL.start();
      oscR.start();
      sourcesRef.current.push(oscL, oscR);

      // 2. Tibetan Bowls (modulating harmonic frequency)
      const gainBowl = audioCtx.createGain();
      gainBowl.gain.setValueAtTime(volBowl / 100, audioCtx.currentTime);
      gainBowl.connect(masterGain);
      gainBowlRef.current = gainBowl;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, audioCtx.currentTime); // very slow 10s cycle
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.01, audioCtx.currentTime); // subtle pitch vibrato
      lfo.connect(lfoGain);

      const oscBowl1 = audioCtx.createOscillator();
      oscBowl1.frequency.setValueAtTime(144, audioCtx.currentTime); // F3 note
      lfoGain.connect(oscBowl1.frequency);

      const oscBowl2 = audioCtx.createOscillator();
      oscBowl2.frequency.setValueAtTime(216, audioCtx.currentTime); // C4 note

      const bowlFilter = audioCtx.createBiquadFilter();
      bowlFilter.type = 'lowpass';
      bowlFilter.frequency.setValueAtTime(400, audioCtx.currentTime);

      oscBowl1.connect(bowlFilter);
      oscBowl2.connect(bowlFilter);
      bowlFilter.connect(gainBowl);

      lfo.start();
      oscBowl1.start();
      oscBowl2.start();
      sourcesRef.current.push(lfo, oscBowl1, oscBowl2);

      // 3. Rain / White Noise with Lowpass filter
      const gainRain = audioCtx.createGain();
      gainRain.gain.setValueAtTime((volRain / 100) * 0.15, audioCtx.currentTime); // keep rain softer
      gainRain.connect(masterGain);
      gainRainRef.current = gainRain;

      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const rainFilter = audioCtx.createBiquadFilter();
      rainFilter.type = 'peaking';
      rainFilter.frequency.setValueAtTime(700, audioCtx.currentTime);
      rainFilter.Q.setValueAtTime(1.0, audioCtx.currentTime);
      rainFilter.gain.setValueAtTime(3.0, audioCtx.currentTime);

      noiseSource.connect(rainFilter).connect(gainRain);
      noiseSource.start();
      sourcesRef.current.push(noiseSource);

      // 4. Chimes Setup
      const gainChime = audioCtx.createGain();
      gainChime.gain.setValueAtTime(volChime / 100, audioCtx.currentTime);
      gainChime.connect(masterGain);
      gainChimeRef.current = gainChime;
      setIsPlaying(true);

      // Trigger automatic chimes occasionally
      const chimeTimerId = setInterval(() => {
        if (Math.random() > 0.4) {
          triggerChimeSound(audioCtx, gainChime);
        }
      }, 7000);
      timerIntervalRef.current = chimeTimerId;

      // Start Countdown Timer if active
      if (timerActive) {
        setTimerLeft(timerMinutes * 60);
      }
    } catch (e) {
      console.error("Failed to start Web Audio:", e);
    }
  };

  const triggerChimeSound = (ctx, destinationNode) => {
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [784, 987, 1174, 1318]; // G5, B5, D6, E6
    const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
    
    // Create multiple micro-oscillators for a metallic chime sound
    [1, 1.5, 2, 2.5].forEach(multiplier => {
      const osc = ctx.createOscillator();
      const localGain = ctx.createGain();
      
      osc.frequency.setValueAtTime(randomFreq * multiplier, now);
      osc.type = 'sine';
      
      localGain.gain.setValueAtTime(0.04 / multiplier, now);
      localGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      
      osc.connect(localGain).connect(destinationNode);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  };

  const stopAmbient = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    sourcesRef.current.forEach(s => {
      try {
        s.stop();
      } catch (e) {}
    });
    sourcesRef.current = [];
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  // Autostop countdown timer logic
  useEffect(() => {
    let countdownInterval;
    if (isPlaying && timerActive && timerLeft > 0) {
      countdownInterval = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 6) {
            // Apply a gradual fade out over the last 5 seconds
            if (masterGainRef.current && audioCtxRef.current) {
              const now = audioCtxRef.current.currentTime;
              masterGainRef.current.gain.linearRampToValueAtTime(0, now + 5.0);
            }
          }
          if (prev <= 1) {
            clearInterval(countdownInterval);
            stopAmbient();
            alert("Minuterie complétée. La session de méditation est terminée.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [isPlaying, timerActive, timerLeft]);

  // Adjust volumes in real time
  useEffect(() => {
    if (isPlaying && masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(masterVolume / 100, audioCtxRef.current.currentTime);
    }
  }, [masterVolume, isPlaying]);

  useEffect(() => {
    if (isPlaying && gainBinauralRef.current && audioCtxRef.current) {
      gainBinauralRef.current.gain.setValueAtTime(volBinaural / 100, audioCtxRef.current.currentTime);
    }
  }, [volBinaural, isPlaying]);

  useEffect(() => {
    if (isPlaying && gainBowlRef.current && audioCtxRef.current) {
      gainBowlRef.current.gain.setValueAtTime(volBowl / 100, audioCtxRef.current.currentTime);
    }
  }, [volBowl, isPlaying]);

  useEffect(() => {
    if (isPlaying && gainRainRef.current && audioCtxRef.current) {
      gainRainRef.current.gain.setValueAtTime((volRain / 100) * 0.15, audioCtxRef.current.currentTime);
    }
  }, [volRain, isPlaying]);

  useEffect(() => {
    if (isPlaying && gainChimeRef.current && audioCtxRef.current) {
      gainChimeRef.current.gain.setValueAtTime(volChime / 100, audioCtxRef.current.currentTime);
    }
  }, [volChime, isPlaying]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleManualChime = () => {
    if (isPlaying && audioCtxRef.current && gainChimeRef.current) {
      triggerChimeSound(audioCtxRef.current, gainChimeRef.current);
    }
  };

  return (
    <div style={{ padding: 24, color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            🧘 Meditation Ambient Soundscape
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Générez une ambiance de méditation immersive avec ondes binaurales, bols tibétains, pluie et cloches zen.
          </p>
        </div>
        <FolderButton toolId="meditation_sounds" toolName="MeditationSons" localStorageKeys={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Playback Controls & Timer */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', alignSelf: 'flex-start', margin: 0 }}>Console Principale</h2>
          
          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center', marginTop: 12 }}>
            <button onClick={isPlaying ? stopAmbient : startAmbient} className="btn-premium btn-primary" style={{ padding: '14px 32px', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {isPlaying ? '⏸️ Arrêter l\'ambiance' : '▶️ Démarrer l\'ambiance'}
            </button>
            <button onClick={handleManualChime} disabled={!isPlaying} className="btn-premium btn-secondary" style={{ padding: '14px 20px', fontWeight: 'bold' }}>
              🔔 Tintement Zen
            </button>
          </div>

          {/* Master Volume */}
          <div style={{ width: '100%', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Volume Principal</label>
              <span style={{ fontWeight: 'bold' }}>{masterVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value={masterVolume} onChange={(e) => setMasterVolume(parseInt(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
          </div>

          {/* Timer Autostop Configuration */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={timerActive} onChange={e => {
                setTimerActive(e.target.checked);
                if (e.target.checked && isPlaying) {
                  setTimerLeft(timerMinutes * 60);
                }
              }} />
              Activer l'arrêt automatique après :
            </label>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select 
                value={timerMinutes} 
                disabled={timerActive && isPlaying}
                onChange={e => setTimerMinutes(parseInt(e.target.value))} 
                className="input-premium"
                style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-light)' }}
              >
                <option value="1">1 Minute (Test)</option>
                <option value="5">5 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
              
              {timerActive && isPlaying && (
                <div style={{ padding: '8px 14px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                  {formatTime(timerLeft)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mixer Channels */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>Console de Mixage Multi-Canaux</h2>

          {/* 1. Binaural Beats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>🧠 Ondes Delta Binaurales (100Hz / 104Hz)</span>
              <span>{volBinaural}%</span>
            </div>
            <input type="range" min="0" max="100" value={volBinaural} onChange={(e) => setVolBinaural(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          {/* 2. Tibetan Bowls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>🥣 Bols Tibétains Vibrants (Modulation LFO)</span>
              <span>{volBowl}%</span>
            </div>
            <input type="range" min="0" max="100" value={volBowl} onChange={(e) => setVolBowl(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          {/* 3. Rain */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>🌧️ Pluie Douce Locale (Générée)</span>
              <span>{volRain}%</span>
            </div>
            <input type="range" min="0" max="100" value={volRain} onChange={(e) => setVolRain(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>

          {/* 4. Zen Chimes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>🔔 Cloches Zen Aléatoires</span>
              <span>{volChime}%</span>
            </div>
            <input type="range" min="0" max="100" value={volChime} onChange={(e) => setVolChime(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}