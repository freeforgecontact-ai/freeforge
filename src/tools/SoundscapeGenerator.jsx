import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function SoundscapeGenerator({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [sleepTimer, setSleepTimer] = useState(0); // 0 = disabled, or minutes
  const [timeLeft, setTimeLeft] = useState(null); // seconds left

  // Channels state
  const [channels, setChannels] = useState({
    rain: { name: '🌧️ Pluie', volume: 0.5, active: true },
    ocean: { name: '🌊 Vagues d\'Océan', volume: 0.4, active: false },
    wind: { name: '🍃 Vent Soufflant', volume: 0.3, active: false },
    fire: { name: '🔥 Feu de Camp', volume: 0.4, active: false },
    bowl: { name: '🥣 Bols Tibétains', volume: 0.2, active: false },
    birds: { name: '🐦 Oiseaux Sauvages', volume: 0.3, active: false }
  });

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  
  // Ref for active nodes to stop/change them
  const activeNodesRef = useRef({});
  const timerIntervalRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);

  // Initialize or resume AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      masterGain.connect(analyser);
      analyserRef.current = analyser;
    }
    return audioCtxRef.current;
  };

  // Helper: Create White Noise Buffer
  const createNoiseBuffer = (ctx, duration = 2.0) => {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  // Start a specific soundscape channel
  const startChannel = (key) => {
    const ctx = getAudioContext();
    if (!ctx || activeNodesRef.current[key]) return;

    const channelGain = ctx.createGain();
    channelGain.gain.value = channels[key].volume;
    channelGain.connect(masterGainRef.current);

    const nodes = { gain: channelGain };

    if (key === 'rain') {
      // Rain: White noise + Lowpass filter (rumble)
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3.0);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      noise.connect(filter);
      filter.connect(channelGain);
      noise.start();

      nodes.source = noise;
      nodes.filter = filter;

    } else if (key === 'ocean') {
      // Ocean: Brownish-filtered noise modulated by slow LFO
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4.0);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.value = 250;
      filter2.Q.value = 0.8;

      // Slow LFO for volume & cutoff wave sweep
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08; // Wave frequency (once per 12.5 seconds)

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200; // Modulate cutoff frequency up and down

      const lfoVolGain = ctx.createGain();
      lfoVolGain.gain.value = 0.45; // Modulate volume

      // Modulate Filter Cutoff
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Modulate Gain (fade ocean wave in and out)
      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.5;
      lfo.connect(lfoVolGain);
      lfoVolGain.connect(waveGain.gain);

      noise.connect(filter);
      filter.connect(filter2);
      filter2.connect(waveGain);
      waveGain.connect(channelGain);

      noise.start();
      lfo.start();

      nodes.source = noise;
      nodes.lfo = lfo;
      nodes.filter = filter;

    } else if (key === 'wind') {
      // Wind: Resonant Bandpass filter sweep on white noise
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 3.5);
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 4.0; // Resonant whistle

      // LFO for whistling wind gusts
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05; // 20s cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 350;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(channelGain);

      noise.start();
      lfo.start();

      nodes.source = noise;
      nodes.lfo = lfo;
      nodes.filter = filter;

    } else if (key === 'fire') {
      // Campfire: Low rumble noise + random cracking ticks
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 2.0);
      noise.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 180;

      noise.connect(rumbleFilter);
      rumbleFilter.connect(channelGain);
      noise.start();
      nodes.source = noise;

      // Crackling Loop generator via setInterval
      const crackleInterval = setInterval(() => {
        if (!isPlaying || !channels.fire.active) return;
        // Random chance of crackle spike
        if (Math.random() > 0.4) {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const amp = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + Math.random() * 2000, ctx.currentTime);
          
          filter.type = 'bandpass';
          filter.frequency.value = 2500;
          filter.Q.value = 2;

          amp.gain.setValueAtTime(0, ctx.currentTime);
          amp.gain.linearRampToValueAtTime(0.04 * channels.fire.volume, ctx.currentTime + 0.002);
          amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02 + Math.random() * 0.03);

          osc.connect(filter);
          filter.connect(amp);
          amp.connect(masterGainRef.current);

          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      }, 80);

      nodes.interval = crackleInterval;

    } else if (key === 'bowl') {
      // Tibetan bowls: Deep harmonic sines with amplitude/frequency modulation
      const bowlOscs = [];
      const bowlFreqs = [142.3, 284.6, 426.9, 569.2, 711.5]; // Harmonics of D3
      
      const now = ctx.currentTime;
      bowlFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Tremolo / LFO
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2 + idx * 0.07;
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.05 / (idx + 1); // quieter harmonics

        lfo.connect(lfoGain.gain); // modulate volume

        // Base volume
        const vol = 0.08 / (idx + 1);
        oscGain.gain.value = vol;

        osc.connect(oscGain);
        oscGain.connect(channelGain);

        osc.start();
        lfo.start();

        bowlOscs.push({ osc, lfo });
      });

      nodes.bowlOscs = bowlOscs;

    } else if (key === 'birds') {
      // Forest Birds: Schedule randomized sine chirps (sweeping frequencies)
      const chirpScheduler = setInterval(() => {
        if (!isPlaying || !channels.birds.active) return;
        
        // Random bird calls every few seconds
        if (Math.random() > 0.6) {
          const startTime = ctx.currentTime;
          const numChirps = 2 + Math.floor(Math.random() * 3);
          let timeOffset = 0;

          // Pitch characteristics
          const baseChirpFreq = 2200 + Math.random() * 1200;

          for (let i = 0; i < numChirps; i++) {
            const osc = ctx.createOscillator();
            const amp = ctx.createGain();

            osc.type = 'sine';
            // Fast frequency sweep (chirp!)
            osc.frequency.setValueAtTime(baseChirpFreq, startTime + timeOffset);
            osc.frequency.exponentialRampToValueAtTime(baseChirpFreq + 800, startTime + timeOffset + 0.08);

            amp.gain.setValueAtTime(0, startTime + timeOffset);
            amp.gain.linearRampToValueAtTime(0.03 * channels.birds.volume, startTime + timeOffset + 0.01);
            amp.gain.exponentialRampToValueAtTime(0.0001, startTime + timeOffset + 0.09);

            osc.connect(amp);
            amp.connect(masterGainRef.current);

            osc.start(startTime + timeOffset);
            osc.stop(startTime + timeOffset + 0.1);

            timeOffset += 0.15 + Math.random() * 0.1;
          }
        }
      }, 1500);

      nodes.interval = chirpScheduler;
    }

    activeNodesRef.current[key] = nodes;
  };

  // Stop a specific soundscape channel
  const stopChannel = (key) => {
    const nodes = activeNodesRef.current[key];
    if (!nodes) return;

    if (nodes.source) {
      try { nodes.source.stop(); } catch (e) {}
    }
    if (nodes.lfo) {
      try { nodes.lfo.stop(); } catch (e) {}
    }
    if (nodes.interval) {
      clearInterval(nodes.interval);
    }
    if (nodes.bowlOscs) {
      nodes.bowlOscs.forEach(bowl => {
        try { bowl.osc.stop(); } catch (e) {}
        try { bowl.lfo.stop(); } catch (e) {}
      });
    }
    if (nodes.gain) {
      try { nodes.gain.disconnect(); } catch (e) {}
    }

    delete activeNodesRef.current[key];
  };

  // Trigger sound engine toggle
  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      Object.keys(activeNodesRef.current).forEach(key => {
        stopChannel(key);
      });
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Start all active channels
      Object.keys(channels).forEach(key => {
        if (channels[key].active) {
          startChannel(key);
        }
      });
    }
  };

  // Dynamic Volume update per channel
  useEffect(() => {
    Object.keys(channels).forEach(key => {
      const channel = channels[key];
      const node = activeNodesRef.current[key];
      if (node && node.gain) {
        node.gain.gain.value = channel.volume;
      }
    });
  }, [channels]);

  // Master Volume update
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  // Active toggles watcher
  const toggleChannelActive = (key) => {
    setChannels(prev => {
      const newChannels = {
        ...prev,
        [key]: { ...prev[key], active: !prev[key].active }
      };

      if (isPlaying) {
        if (newChannels[key].active) {
          // Trigger start on next tick
          setTimeout(() => startChannel(key), 0);
        } else {
          stopChannel(key);
        }
      }
      return newChannels;
    });
  };

  const changeChannelVolume = (key, vol) => {
    setChannels(prev => ({
      ...prev,
      [key]: { ...prev[key], volume: parseFloat(vol) }
    }));
  };

  // Sleep Timer Handler
  useEffect(() => {
    if (sleepTimer > 0) {
      setTimeLeft(sleepTimer * 60);
    } else {
      setTimeLeft(null);
    }
  }, [sleepTimer]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      // Fade out and stop
      if (isPlaying) {
        // Slow 3-second fadeout
        if (masterGainRef.current) {
          const now = audioCtxRef.current.currentTime;
          masterGainRef.current.gain.setValueAtTime(masterVolume, now);
          masterGainRef.current.gain.linearRampToValueAtTime(0, now + 3);
        }
        setTimeout(() => {
          togglePlay();
          setSleepTimer(0);
          if (masterGainRef.current) {
            masterGainRef.current.gain.value = masterVolume; // reset
          }
        }, 3000);
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [timeLeft, isPlaying]);

  // Canvas Oscilloscope/Frequency Animation
  useEffect(() => {
    let active = true;

    const draw = () => {
      if (!active) return;
      animationRef.current = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyser.getByteFrequencyData(dataArray);

      // Gradient background
      ctx.fillStyle = 'rgba(16, 16, 24, 0.2)'; // persistence echo
      ctx.fillRect(0, 0, width, height);

      // Draw bars symmetrical from the center
      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * height * 0.8;

        // Custom glow colors
        const r = Math.round(139 + percent * 100);
        const g = Math.round(92 - percent * 50);
        const b = Math.round(246 + percent * 10);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${percent + 0.1})`;
        ctx.fillRect(width / 2 + x, height - barHeight, barWidth - 2, barHeight);
        ctx.fillRect(width / 2 - x - barWidth, height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      // Clear canvas when idle
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#101018';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(activeNodesRef.current).forEach(key => {
        stopChannel(key);
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Générateur d'Ambiance de Nature</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Mixez vos bruits d'ambiance relaxants préférés. Tout est synthétisé en direct dans votre navigateur.
          </p>
        </div>
        <FolderButton toolId="soundscape_generator" toolName="Générateur Ambiance" />
      </div>

      <div className="grid-2">
        {/* Left Column: Mixer controls */}
        <div className="card-premium" style={{ gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Console de Mixage</h2>
            <button 
              onClick={togglePlay} 
              className={`btn-premium ${isPlaying ? 'btn-primary' : 'btn-primary'}`}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: isPlaying ? '#ef4444' : 'var(--secondary)',
                border: 'none',
                color: '#fff',
                boxShadow: isPlaying ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              {isPlaying ? '🛑 Arrêter' : '▶️ Lancer l\'Ambiance'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {Object.keys(channels).map(key => {
              const ch = channels[key];
              return (
                <div 
                  key={key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    padding: '12px 16px', 
                    backgroundColor: ch.active ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.01)', 
                    borderRadius: 12,
                    border: ch.active ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Active Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={ch.active} 
                      onChange={() => toggleChannelActive(key)}
                      style={{ width: 18, height: 18, accentColor: 'var(--secondary)' }}
                    />
                    <span style={{ fontWeight: ch.active ? 'bold' : 'normal', color: ch.active ? '#fff' : 'var(--text-secondary)' }}>
                      {ch.name}
                    </span>
                  </label>

                  {/* Volume Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '60%' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>
                      {Math.round(ch.volume * 100)}%
                    </span>
                    <input 
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      disabled={!ch.active}
                      value={ch.volume}
                      onChange={(e) => changeChannelVolume(key, e.target.value)}
                      style={{ flex: 1, opacity: ch.active ? 1 : 0.4, cursor: ch.active ? 'pointer' : 'not-allowed' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Master controls and timer and visualizer */}
        <div className="card-premium" style={{ gap: 20 }}>
          <h2 className="card-title">Contrôles Généraux & Visualiseur</h2>

          {/* Master volume */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Volume Général (Master) :</span>
              <span style={{ fontWeight: 'bold' }}>{Math.round(masterVolume * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1.0" 
              step="0.05" 
              value={masterVolume} 
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))} 
              style={{ width: '100%' }}
            />
          </div>

          {/* Sleep timer */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 10, color: '#fff' }}>⏱️ Minuteur de Sommeil</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 5, 15, 30, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setSleepTimer(mins)}
                  className={`btn-premium ${sleepTimer === mins ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 8, flex: 1 }}
                >
                  {mins === 0 ? 'Désactivé' : `${mins} min`}
                </button>
              ))}
            </div>

            {timeLeft !== null && timeLeft > 0 && (
              <div 
                style={{ 
                  marginTop: 12, 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.2)', 
                  borderRadius: 8, 
                  fontSize: '0.85rem', 
                  textAlign: 'center', 
                  color: 'var(--secondary)',
                  fontWeight: 'bold'
                }}
              >
                ⏳ Extinction automatique dans : {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Visualizer canvas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Spectre Fréquence Audio :</span>
            <canvas 
              ref={canvasRef} 
              width="360" 
              height="110" 
              style={{ 
                width: '100%', 
                height: '110px', 
                backgroundColor: '#101018', 
                borderRadius: 8,
                border: '1px solid var(--border-light)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
