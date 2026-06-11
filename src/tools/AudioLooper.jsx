import React, { useState, useEffect, useRef } from 'react';
import FolderButton from '../components/FolderButton';

export default function AudioLooper({ goBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0); // 0 to 100
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Piste 1', blobUrl: null, isMuted: false, isRecording: false },
    { id: 2, name: 'Piste 2', blobUrl: null, isMuted: false, isRecording: false },
    { id: 3, name: 'Piste 3', blobUrl: null, isMuted: false, isRecording: false },
    { id: 4, name: 'Piste 4', blobUrl: null, isMuted: false, isRecording: false }
  ]);

  const loopDurationMs = 4000; // 4-second loop
  const clockIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const activeAudioElementsRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordingTrackIdRef = useRef(null);

  const initAudioCtx = () => {
    // Media Recorder initialization requires mic access
  };

  const handleStartStopLoop = () => {
    if (isPlaying) {
      stopLoop();
    } else {
      startLoop();
    }
  };

  const startLoop = () => {
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    // Central loop clock updating every 30ms
    clockIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) % loopDurationMs;
      const progress = (elapsed / loopDurationMs) * 100;
      setCurrentProgress(progress);

      // At the start of each loop, play all unmuted tracks
      if (elapsed < 40) {
        playAllTracks();
      }
    }, 30);
  };

  const stopLoop = () => {
    clearInterval(clockIntervalRef.current);
    setIsPlaying(false);
    setCurrentProgress(0);
    stopAllTracks();
  };

  const playAllTracks = () => {
    tracks.forEach(track => {
      if (track.blobUrl && !track.isMuted) {
        const audio = activeAudioElementsRef.current[track.id] || new Audio(track.blobUrl);
        audio.currentTime = 0;
        audio.volume = 1.0;
        audio.play().catch(e => console.log('Audio playback failed', e));
        activeAudioElementsRef.current[track.id] = audio;
      }
    });
  };

  const stopAllTracks = () => {
    Object.values(activeAudioElementsRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  // Record Layer
  const triggerRecord = async (trackId) => {
    // If not playing, start the loop first so we align to the rhythm
    if (!isPlaying) {
      startLoop();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(blob);
        
        setTracks(prev => prev.map(t => {
          if (t.id === trackId) {
            return { ...t, blobUrl, isRecording: false };
          }
          return t;
        }));
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recordingTrackIdRef.current = trackId;

      // Set recording state to visual feedback
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isRecording: true } : t));

      // Start recording immediately
      recorder.start();

      // Automatically stop recording after loop duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, loopDurationMs);

    } catch (err) {
      console.error(err);
      alert("Accès microphone requis pour looper.");
    }
  };

  const toggleMute = (trackId) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const nextMute = !t.isMuted;
        const audio = activeAudioElementsRef.current[trackId];
        if (audio) {
          audio.muted = nextMute;
        }
        return { ...t, isMuted: nextMute };
      }
      return t;
    }));
  };

  const clearTrack = (trackId) => {
    const audio = activeAudioElementsRef.current[trackId];
    if (audio) {
      audio.pause();
      delete activeAudioElementsRef.current[trackId];
    }
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        if (t.blobUrl) URL.revokeObjectURL(t.blobUrl);
        return { ...t, blobUrl: null };
      }
      return t;
    }));
  };

  useEffect(() => {
    return () => {
      clearInterval(clockIntervalRef.current);
      stopAllTracks();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <button onClick={goBack} className="btn-premium btn-secondary" style={{ padding: '8px 14px', borderRadius: 8, marginBottom: 8 }}>
            ← Retour
          </button>
          <h1 className="page-title">Looper Multi-Pistes Local</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enregistrez des couches vocales ou rythmiques successives et superposez-les en rythme.</p>
        </div>
        <FolderButton toolId="audio_looper" toolName="Looper Audio" />
      </div>

      <div className="card-premium" style={{ gap: 20 }}>
        {/* Playback Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={handleStartStopLoop} className="btn-premium btn-primary" style={{ minWidth: 160, justifyContent: 'center' }}>
            {isPlaying ? '⏸️ Mettre en pause' : '▶️ Démarrer la boucle'}
          </button>
          
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12, marginLeft: 16 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Horloge de boucle :</span>
            <div style={{ flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${currentProgress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.03s linear' }} />
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {tracks.map((track) => (
            <div 
              key={track.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '12px 18px', 
                backgroundColor: track.isRecording ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)', 
                border: track.isRecording ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-light)', 
                borderRadius: 12 
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{track.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {track.isRecording ? '🔴 Enregistrement (4 sec)...' : track.blobUrl ? '🎵 Enregistré' : 'Vide'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {!track.blobUrl ? (
                  <button 
                    onClick={() => triggerRecord(track.id)} 
                    className="btn-premium btn-primary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--secondary) 0%, #db2777 100%)' }}
                    disabled={track.isRecording}
                  >
                    🎤 Enregistrer
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => toggleMute(track.id)} 
                      className={`btn-premium ${track.isMuted ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '8px 12px', fontSize: '0.8rem', background: track.isMuted ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      {track.isMuted ? '🔇 Muet' : '🔊 Actif'}
                    </button>
                    <button 
                      onClick={() => clearTrack(track.id)} 
                      className="btn-premium btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#f87171' }}
                    >
                      🗑️ Effacer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
