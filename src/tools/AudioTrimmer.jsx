import React, { useState, useRef, useEffect } from 'react';
import FolderButton from '../components/FolderButton';

// Lightweight client-side 16-bit WAV PCM Encoder
function bufferToWav(buffer, startOffset, endOffset) {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const startSample = Math.floor(startOffset * sampleRate);
  const endSample = Math.floor(endOffset * sampleRate);
  const length = endSample - startSample;
  
  const bufferLength = length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);
  
  // Write WAV RIFF Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(view, 8, 'WAVE');
  
  // Write format chunk header
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)
  
  // Write data chunk header
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength, true); // Subchunk2Size
  
  // Write Interleaved PCM Audio Samples
  const channelData = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }
  
  let offset = 44;
  for (let i = startSample; i < endSample; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp sample to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit PCM integer
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, pcm, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default function AudioTrimmer({ goBack }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  
  // Trim range states (in seconds)
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);

  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const currentSourceRef = useRef(null);
  const playStartTimeRef = useRef(0);

  const clearAll = () => {
    stopPreview();
    setAudioFile(null);
    setAudioBuffer(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    setIsLoading(true);
    stopPreview();

    try {
      // Initialize Web Audio Context
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
          
          setAudioBuffer(decodedBuffer);
          setDuration(decodedBuffer.duration);
          setStartTime(0);
          setEndTime(decodedBuffer.duration);
          setIsLoading(false);
        } catch (err) {
          console.error(err);
          alert("Erreur de décodage audio. Assurez-vous d'avoir importé un fichier WAV ou MP3 standard.");
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  // Draw Audio Waveform on Canvas
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Downsample channels for rendering
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, width, height);

    // Draw main waveform
    ctx.beginPath();
    ctx.moveTo(0, amp);
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw active trim region overlay
    const startX = (startTime / duration) * width;
    const endX = (endTime / duration) * width;

    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.fillRect(startX, 0, endX - startX, height);

    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

  }, [audioBuffer, startTime, endTime, duration]);

  // Clean Audio Source on Unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const startPreview = () => {
    if (!audioBuffer || isPlayingPreview) return;

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Start playing at startTime and schedule to stop at endTime
    const playLength = endTime - startTime;
    source.start(0, startTime, playLength);
    
    currentSourceRef.current = source;
    setIsPlayingPreview(true);
    playStartTimeRef.current = ctx.currentTime - startTime;

    source.onended = () => {
      setIsPlayingPreview(false);
    };
  };

  const stopPreview = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const handleTrim = () => {
    if (!audioBuffer) return;
    setIsTrimming(true);

    setTimeout(() => {
      try {
        const trimmedBlob = bufferToWav(audioBuffer, startTime, endTime);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(trimmedBlob);
        const baseName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.')) || audioFile.name;
        link.download = `${baseName}_trimmed.wav`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error(err);
        alert("Une erreur s'est produite lors de la découpe.");
      }
      setIsTrimming(false);
    }, 100);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100).toString().padStart(2, '0');
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          ← Retour
        </button>
        <span className="status-badge status-badge-primary">Audio</span>
        <FolderButton toolId="trimmer" toolName="Découpeur Audio" localStorageKeys={[]} />
      </div>

      <h1 className="page-title">Découpeur Audio</h1>
      <p className="page-subtitle">Coupez précisément vos fichiers audio locaux et exportez le résultat au format WAV sans serveur.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {!audioBuffer ? (
          <div 
            className="dropzone"
            onClick={() => document.getElementById('trimmer-audio-upload').click()}
            style={{ padding: 60 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="dropzone-icon" style={{ width: 56, height: 56 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7a3 3 0 11-6 0 3 3 0 016 0zm-3 7H4M4 4h4" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                {isLoading ? 'Décodage et chargement...' : 'Glissez votre fichier audio ici'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isLoading ? 'Veuillez patienter...' : 'supporte WAV et MP3'}
              </p>
            </div>
            <input 
              id="trimmer-audio-upload"
              type="file" 
              accept="audio/*" 
              onChange={handleAudioChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="card-premium" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Audio Waveform Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fichier : {audioFile.name}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Durée : {formatSeconds(duration)}</span>
              </div>
              <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-dark-3)' }}>
                <canvas 
                  ref={canvasRef} 
                  width="800" 
                  height="160" 
                  style={{ display: 'block', width: '100%', height: 160 }} 
                />
              </div>
            </div>

            {/* Slider controls */}
            <div className="grid-2" style={{ gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>Début de l'extrait</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatSeconds(startTime)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={endTime - 0.1 || 0} 
                  step="0.01"
                  value={startTime} 
                  onChange={e => setStartTime(parseFloat(e.target.value))} 
                  className="slider"
                  style={{ height: 4 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>Fin de l'extrait</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatSeconds(endTime)}</span>
                </div>
                <input 
                  type="range" 
                  min={startTime + 0.1} 
                  max={duration} 
                  step="0.01"
                  value={endTime} 
                  onChange={e => setEndTime(parseFloat(e.target.value))} 
                  className="slider"
                  style={{ height: 4 }}
                />
              </div>
            </div>

            {/* Control Panel buttons */}
            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <button 
                className="btn-premium btn-secondary" 
                onClick={isPlayingPreview ? stopPreview : startPreview}
                style={{ width: 140, justifyContent: 'center' }}
              >
                {isPlayingPreview ? '⏹ Arrêter' : '▶ Préécoute'}
              </button>
              
              <button 
                className="btn-premium btn-primary" 
                onClick={handleTrim}
                disabled={isTrimming}
                style={{ flexGrow: 1, justifyContent: 'center' }}
              >
                {isTrimming ? 'Découpe en cours...' : 'Découper et Télécharger (WAV)'}
              </button>

              <button className="btn-premium btn-secondary" onClick={clearAll} style={{ color: '#ef4444' }}>
                Fermer
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
