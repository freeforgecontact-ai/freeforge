import React, { useState, useEffect, useRef } from 'react';
import './VibeLocal.css';
import FolderButton from '../components/FolderButton';

export default function VibeLocal({ goBack }) {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'search' | 'playlist'
  const [activePlaylistName, setActivePlaylistName] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [library, setLibrary] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  
  const [queue, setQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Player options
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState('none'); // 'none' | 'one' | 'all'
  const [shuffle, setShuffle] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  // Download statuses & server active checks
  const [downloads, setDownloads] = useState({});
  const [isServerActive, setIsServerActive] = useState(true); // default true, probe will update

  // Recommendations and Autoplay
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem('vibelocal_autoplay') !== 'false');
  const [recommendations, setRecommendations] = useState([]);
  const [isRecLoading, setIsRecLoading] = useState(false);

  // Playlist management UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activeDropdownTrackId, setActiveDropdownTrackId] = useState(null);

  const audioRef = useRef(null);

  // Probe server status
  const probeServer = async () => {
    try {
      const res = await fetch('/api/library');
      if (res.ok) {
        setIsServerActive(true);
        return true;
      }
    } catch (err) {
      setIsServerActive(false);
    }
    return false;
  };

  // Fetch local library
  const fetchLibrary = async () => {
    const active = await probeServer();
    if (active) {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const data = await res.json();
          setLibrary(data);
          localStorage.setItem('vibelocal_library_offline', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching library:', err);
      }
    } else {
      // Offline fallback: load library from localStorage
      const saved = localStorage.getItem('vibelocal_library_offline');
      setLibrary(saved ? JSON.parse(saved) : []);
    }
  };

  // Fetch all playlists
  const fetchPlaylists = async () => {
    const active = isServerActive;
    if (active) {
      try {
        const res = await fetch('/api/playlists');
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data);
          localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching playlists:', err);
      }
    } else {
      // Offline fallback: load from localStorage
      const saved = localStorage.getItem('vibelocal_playlists_offline');
      setPlaylists(saved ? JSON.parse(saved) : []);
    }
  };

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Load and refresh loop
  useEffect(() => {
    const init = async () => {
      await fetchLibrary();
      await fetchPlaylists();
    };
    init();

    const interval = setInterval(async () => {
      try {
        // Only poll backend downloads if server is active
        if (isServerActive) {
          const res = await fetch('/api/downloads/status');
          if (res.ok) {
            const activeDL = await res.json();
            const dlMap = {};
            let hasActive = false;
            
            activeDL.forEach(dl => {
              dlMap[dl.id] = dl;
              if (dl.status === 'downloading') {
                hasActive = true;
              }
            });
            setDownloads(dlMap);
            
            if (activeDL.length === 0 || !hasActive) {
              fetchLibrary();
            }
          }
        }
      } catch (err) {
        console.error('Download status polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isServerActive]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownTrackId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch recommendations
  const fetchRecommendations = async (track) => {
    if (!track) return;
    setIsRecLoading(true);
    if (isServerActive) {
      try {
        const res = await fetch(`/api/recommend?id=${track.id}&title=${encodeURIComponent(track.title)}&author=${encodeURIComponent(track.author)}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsRecLoading(false);
      }
    } else {
      // Local/offline suggestions fallback
      setIsRecLoading(false);
      const matches = library.filter(s => s.id !== track.id && s.author === track.author);
      setRecommendations(matches.slice(0, 10).map(s => ({ ...s, source: 'local' })));
    }
  };

  const currentTrack = queue[currentQueueIndex] || null;

  useEffect(() => {
    if (currentTrack) {
      fetchRecommendations(currentTrack);
    } else {
      setRecommendations([]);
    }
  }, [currentTrack]);

  // Handle Search submit
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isServerActive) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      alert("La recherche de titres nécessite que le serveur PC local soit connecté.");
    }
  };

  // Trigger Backend Download
  const startDownload = async (track) => {
    if (isServerActive) {
      try {
        setDownloads(prev => ({
          ...prev,
          [track.id]: { id: track.id, title: track.title, progress: 0, status: 'downloading' }
        }));
        
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: track.id,
            title: track.title,
            thumbnail: track.thumbnail,
            duration: track.duration,
            seconds: track.seconds,
            author: track.author
          })
        });
        await res.json();
      } catch (err) {
        console.error('Failed to trigger download:', err);
      }
    } else {
      // Simulate local download in localStorage for mobile/offline
      const savedLib = [...library];
      if (!savedLib.some(t => t.id === track.id)) {
        const localSong = {
          ...track,
          addedAt: new Date().toISOString()
        };
        savedLib.push(localSong);
        setLibrary(savedLib);
        localStorage.setItem('vibelocal_library_offline', JSON.stringify(savedLib));
      }
    }
  };

  // Delete local track
  const deleteTrack = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (confirm('Voulez-vous vraiment supprimer cette musique de votre bibliothèque ?')) {
      if (isServerActive) {
        try {
          const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchLibrary();
            setQueue(prev => prev.filter(t => t.id !== id));
          }
        } catch (err) {
          console.error('Error deleting track:', err);
        }
      } else {
        const updated = library.filter(t => t.id !== id);
        setLibrary(updated);
        localStorage.setItem('vibelocal_library_offline', JSON.stringify(updated));
        setQueue(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  // Playlist Management
  const createPlaylist = async (e) => {
    if (e) e.preventDefault();
    if (!newPlaylistName.trim()) return;

    if (isServerActive) {
      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newPlaylistName.trim() })
        });
        
        if (res.ok) {
          const newPL = await res.json();
          fetchPlaylists();
          setActivePlaylistName(newPL.name);
          setActiveTab('playlist');
          setShowCreateModal(false);
          setNewPlaylistName('');
        } else {
          const err = await res.json();
          alert(err.error || 'Erreur lors de la création de la playlist');
        }
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    } else {
      // Local Storage playlist creation
      const cleanName = newPlaylistName.trim();
      if (playlists.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
        alert('Une playlist avec ce nom existe déjà.');
        return;
      }
      const newPL = { name: cleanName, songs: [] };
      const updated = [...playlists, newPL];
      setPlaylists(updated);
      localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(updated));
      
      setActivePlaylistName(cleanName);
      setActiveTab('playlist');
      setShowCreateModal(false);
      setNewPlaylistName('');
    }
  };

  const addSongToPlaylist = async (playlistName, track, e) => {
    if (e) e.stopPropagation();
    
    if (isServerActive) {
      try {
        const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ song: track })
        });

        if (res.ok) {
          fetchPlaylists();
          setActiveDropdownTrackId(null);
          
          const isDownloaded = library.some(t => t.id === track.id);
          if (!isDownloaded) {
            startDownload(track);
          }
        }
      } catch (err) {
        console.error('Error adding song to playlist:', err);
      }
    } else {
      // Offline local playlist addition
      const updated = playlists.map(pl => {
        if (pl.name === playlistName) {
          if (!pl.songs.some(s => s.id === track.id)) {
            return {
              ...pl,
              songs: [...pl.songs, track]
            };
          }
        }
        return pl;
      });
      setPlaylists(updated);
      localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(updated));
      setActiveDropdownTrackId(null);

      // Auto download (local storage mock)
      startDownload(track);
    }
  };

  const removeSongFromPlaylist = async (playlistName, songId, e) => {
    if (e) e.stopPropagation();
    if (confirm('Retirer cette chanson de la playlist ?')) {
      if (isServerActive) {
        try {
          const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs/${songId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchPlaylists();
          }
        } catch (err) {
          console.error('Error removing song:', err);
        }
      } else {
        const updated = playlists.map(pl => {
          if (pl.name === playlistName) {
            return {
              ...pl,
              songs: pl.songs.filter(s => s.id !== songId)
            };
          }
          return pl;
        });
        setPlaylists(updated);
        localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(updated));
      }
    }
  };

  const deletePlaylist = async (playlistName) => {
    if (confirm(`Voulez-vous supprimer définitivement la playlist "${playlistName}" ?`)) {
      if (isServerActive) {
        try {
          const res = await fetch(`/api/playlists/${encodeURIComponent(playlistName)}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            fetchPlaylists();
            setActiveTab('library');
            setActivePlaylistName(null);
          }
        } catch (err) {
          console.error('Error deleting playlist:', err);
        }
      } else {
        const updated = playlists.filter(p => p.name !== playlistName);
        setPlaylists(updated);
        localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(updated));
        setActiveTab('library');
        setActivePlaylistName(null);
      }
    }
  };

  // handleOpenFolder removed in favor of FolderButton

  // Play controls
  const playTrack = (track) => {
    const isDownloaded = library.some(t => t.id === track.id);
    const indexInQueue = queue.findIndex(t => t.id === track.id);
    
    if (indexInQueue === -1) {
      const newQueue = [...queue];
      newQueue.push(track);
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.length - 1);
    } else {
      setCurrentQueueIndex(indexInQueue);
    }
    
    setIsPlaying(true);

    if (!isDownloaded && isServerActive) {
      startDownload(track);
    }
  };

  const playPlaylist = (playlistSongs, startIndex = 0) => {
    if (!playlistSongs || playlistSongs.length === 0) return;
    setQueue([...playlistSongs]);
    setCurrentQueueIndex(startIndex);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    
    if (loop === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentQueueIndex(randomIndex);
      return;
    }

    if (currentQueueIndex < queue.length - 1) {
      setCurrentQueueIndex(currentQueueIndex + 1);
    } else if (loop === 'all') {
      setCurrentQueueIndex(0);
    } else if (autoplay && recommendations.length > 0) {
      const nextSong = recommendations[0];
      const newQueue = [...queue, nextSong];
      setQueue(newQueue);
      setCurrentQueueIndex(newQueue.length - 1);
      setIsPlaying(true);
      
      const isDownloaded = library.some(t => t.id === nextSong.id);
      if (!isDownloaded && isServerActive) {
        startDownload(nextSong);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (currentQueueIndex > 0) {
      setCurrentQueueIndex(currentQueueIndex - 1);
    } else if (loop === 'all') {
      setCurrentQueueIndex(queue.length - 1);
    }
  };

  // Add recommendations to queue
  const addToQueue = (track, e) => {
    if (e) e.stopPropagation();
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
      if (isServerActive) {
        startDownload(track);
      }
    }
  };

  // Audio source resolution
  const getAudioSrc = (track) => {
    if (!track) return '';
    if (isServerActive) {
      const isDownloaded = library.some(t => t.id === track.id);
      return isDownloaded ? `/music/${track.id}.m4a` : `/api/stream/live?id=${track.id}`;
    } else {
      // If offline/mobile and direct source is missing, use direct stream simulator (standard files)
      return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(parseInt(track.id.substring(0, 2), 36) % 15) + 1}.mp3`;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Sync play state to audio element
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentQueueIndex]);

  const selectedPlaylist = playlists.find(p => p.name === activePlaylistName) || null;

  // JSON Import/Export
  const handleExportPlaylist = (playlist, e) => {
    if (e) e.stopPropagation();
    const cleanPlaylist = {
      name: playlist.name,
      songs: playlist.songs.map(s => ({
        id: s.id,
        title: s.title,
        author: s.author,
        thumbnail: s.thumbnail,
        duration: s.duration,
        seconds: s.seconds
      }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanPlaylist, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vibelocal.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportPlaylist = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const playlist = JSON.parse(event.target.result);
        if (!playlist.name || !Array.isArray(playlist.songs)) {
          alert("Format de fichier invalide.");
          return;
        }
        
        if (isServerActive) {
          const res = await fetch('/api/playlists/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlist })
          });
          if (res.ok) {
            fetchPlaylists();
            setActivePlaylistName(playlist.name);
            setActiveTab('playlist');
          }
        } else {
          // Offline import
          let importedName = playlist.name.trim();
          let counter = 1;
          const savedLists = [...playlists];
          while (savedLists.some(p => p.name.toLowerCase() === importedName.toLowerCase())) {
            importedName = `${playlist.name.trim()} (Importé ${counter})`;
            counter++;
          }
          const newPL = { name: importedName, songs: playlist.songs };
          savedLists.push(newPL);
          setPlaylists(savedLists);
          localStorage.setItem('vibelocal_playlists_offline', JSON.stringify(savedLists));
          setActivePlaylistName(importedName);
          setActiveTab('playlist');
        }
      } catch (err) {
        alert("Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="vibelocal-container">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {currentTrack && (
        <audio
          ref={audioRef}
          src={getAudioSrc(currentTrack)}
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={playNext}
        />
      )}

      {/* Left Sidebar inside tool */}
      <aside className="vibelocal-sidebar">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-premium btn-secondary" onClick={goBack} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6 }}>
            ← Fermer
          </button>
          <FolderButton toolId="vibelocal" toolName="Radio Premium Local" localStorageKeys={['vibelocal_library_offline', 'vibelocal_playlists_offline', 'vibelocal_autoplay']} />
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`sidebar-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('library');
              setActivePlaylistName(null);
            }}
          >
            Ma Musique (D:)
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('search');
              setActivePlaylistName(null);
            }}
            disabled={!isServerActive}
            style={{ opacity: isServerActive ? 1 : 0.5 }}
          >
            Recherche en ligne
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Playlists</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Importer">
                📥
                <input type="file" accept=".json" onChange={handleImportPlaylist} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setShowCreateModal(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ➕
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
            {playlists.map(pl => (
              <button
                key={pl.name}
                className={`sidebar-btn ${activeTab === 'playlist' && activePlaylistName === pl.name ? 'active' : ''}`}
                onClick={() => {
                  setActivePlaylistName(pl.name);
                  setActiveTab('playlist');
                }}
                style={{ padding: '8px 10px', fontSize: '0.8rem' }}
              >
                🎵 {pl.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Server status info */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={`offline-badge ${isServerActive ? '' : 'offline'}`} style={{ fontSize: '0.7rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {isServerActive ? 'Serveur PC connecté' : 'Mode Mobile (Autonome)'}
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="vibelocal-main-content">
        {activeTab === 'search' && (
          <section>
            <h1 className="section-title">Recherche en ligne</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 12, marginBottom: 20 }} className="no-print">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#f87171', fontWeight: 'bold', fontSize: '0.85rem' }}>
                ⚠️ Aide de Connexion : Blocage de requêtes YouTube
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Si un téléchargement ou une écoute en ligne échoue (erreur de robot ou 429), YouTube bloque temporairement votre adresse IP. Vous pouvez y remédier en 1 clic :
              </p>
              <ol style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Installez l'extension de navigateur <strong>"Get cookies.txt LOCALLY"</strong>.</li>
                <li>Visitez youtube.com et exportez vos cookies dans un fichier texte nommé <code>cookies.txt</code>.</li>
                <li>Déposez ce fichier directement dans votre dossier de musique : <code>D:\LocalYTMusic\cookies.txt</code>.</li>
              </ol>
            </div>

            <form onSubmit={handleSearch} className="search-wrapper">
              <span className="search-icon-pos">🔍</span>
              <input
                type="text"
                placeholder="Entrez un titre, artiste..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            <div className="track-grid">
              {searchResults.map((track, i) => {
                const isDownloaded = library.some(t => t.id === track.id);
                const dlState = downloads[track.id];
                
                return (
                  <div key={track.id} className="track-item" onClick={() => playTrack(track)}>
                    <span className="track-number">{i + 1}</span>
                    <img src={track.thumbnail} alt="" className="track-img" />
                    <div className="track-info">
                      <span className="track-title">{track.title}</span>
                      <span className="track-artist">{track.author}</span>
                    </div>
                    <span className="track-album">En ligne</span>
                    <span className="track-duration">{track.duration}</span>
                    <div className="track-actions" onClick={e => e.stopPropagation()}>
                      <button className="action-btn" onClick={() => setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id)}>
                        ➕
                      </button>
                      
                      {activeDropdownTrackId === track.id && (
                        <div style={{ position: 'absolute', right: 20, width: 180, backgroundColor: '#161622', border: '1px solid var(--border-color)', borderRadius: 8, padding: 6, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {playlists.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px', textAlign: 'center' }}>Aucune playlist</span>
                          ) : (
                            playlists.map(pl => (
                              <button key={pl.name} className="sidebar-btn" style={{ padding: '6px 8px', fontSize: '0.75rem', border: 'none' }} onClick={(event) => addSongToPlaylist(pl.name, track, event)}>
                                {pl.name}
                              </button>
                            ))
                          )}
                          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                          <button className="sidebar-btn" style={{ padding: '6px 8px', fontSize: '0.75rem', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold' }} onClick={(event) => { event.stopPropagation(); setShowCreateModal(true); setActiveDropdownTrackId(null); }}>
                            ➕ Nouvelle playlist
                          </button>
                        </div>
                      )}

                      {isDownloaded ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}>✔️</span>
                      ) : dlState ? (
                        <span style={{ fontSize: '0.7rem' }}>💾 {Math.round(dlState.progress)}%</span>
                      ) : (
                        <button className="action-btn download-btn" onClick={() => startDownload(track)}>📥</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'library' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 className="section-title">Ma Bibliothèque</h1>
              {library.length > 0 && (
                <button className="button-primary" onClick={() => playPlaylist(library, 0)}>
                  Lecture aléatoire
                </button>
              )}
            </div>

            <div className="track-grid">
              {library.map((track, i) => (
                <div key={track.id} className="track-item" onClick={() => playPlaylist(library, i)}>
                  <span className="track-number">{i + 1}</span>
                  <img src={track.thumbnail} alt="" className="track-img" />
                  <div className="track-info">
                    <span className="track-title">{track.title}</span>
                    <span className="track-artist">{track.author}</span>
                  </div>
                  <span className="track-album" style={{ color: '#10b981' }}>📂 Sur disque</span>
                  <span className="track-duration">{track.duration}</span>
                  <div className="track-actions" onClick={e => e.stopPropagation()}>
                    <button className="action-btn" onClick={() => setActiveDropdownTrackId(activeDropdownTrackId === track.id ? null : track.id)}>
                      ➕
                    </button>
                    {activeDropdownTrackId === track.id && (
                      <div style={{ position: 'absolute', right: 20, width: 180, backgroundColor: '#161622', border: '1px solid var(--border-color)', borderRadius: 8, padding: 6, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {playlists.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px', textAlign: 'center' }}>Aucune playlist</span>
                        ) : (
                          playlists.map(pl => (
                            <button key={pl.name} className="sidebar-btn" style={{ padding: '6px 8px', fontSize: '0.75rem', border: 'none' }} onClick={(event) => addSongToPlaylist(pl.name, track, event)}>
                              {pl.name}
                            </button>
                          ))
                        )}
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                        <button className="sidebar-btn" style={{ padding: '6px 8px', fontSize: '0.75rem', border: 'none', color: 'var(--accent-color)', fontWeight: 'bold' }} onClick={(event) => { event.stopPropagation(); setShowCreateModal(true); setActiveDropdownTrackId(null); }}>
                          ➕ Nouvelle playlist
                        </button>
                      </div>
                    )}
                    <button className="action-btn" style={{ color: '#ef4444' }} onClick={event => deleteTrack(track.id, event)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'playlist' && selectedPlaylist && (
          <section>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'flex-end' }}>
              <div style={{ width: 120, height: 120, borderRadius: 12, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2rem' }}>
                📻
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>Playlist</span>
                <h1 className="section-title" style={{ marginBottom: 0 }}>{selectedPlaylist.name}</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                  <button className="button-primary" onClick={() => playPlaylist(selectedPlaylist.songs, 0)}>
                    Lecture
                  </button>
                  <button className="action-btn" title="Exporter" onClick={(e) => handleExportPlaylist(selectedPlaylist, e)}>📤</button>
                  <button className="action-btn" style={{ color: '#ef4444' }} onClick={() => deletePlaylist(selectedPlaylist.name)}>🗑️</button>
                </div>
              </div>
            </div>

            <div className="track-grid">
              {selectedPlaylist.songs.map((track, i) => {
                const isDownloaded = library.some(t => t.id === track.id);
                return (
                  <div key={track.id} className="track-item" onClick={() => playPlaylist(selectedPlaylist.songs, i)}>
                    <span className="track-number">{i + 1}</span>
                    <img src={track.thumbnail} alt="" className="track-img" />
                    <div className="track-info">
                      <span className="track-title">{track.title}</span>
                      <span className="track-artist">{track.author}</span>
                    </div>
                    <span className="track-album">{isDownloaded ? '📂 Stocké' : '☁️ Streaming'}</span>
                    <span className="track-duration">{track.duration}</span>
                    <div className="track-actions" onClick={e => e.stopPropagation()}>
                      <button className="action-btn" style={{ color: '#ef4444' }} onClick={event => removeSongFromPlaylist(selectedPlaylist.name, track.id, event)}>✖️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Slide-out Queue Panel */}
      <div className={`queue-panel ${isQueueOpen ? 'open' : ''}`}>
        <div className="queue-header">
          <span className="queue-title">File d'attente ({queue.length})</span>
          <button className="nav-btn" onClick={() => setIsQueueOpen(false)}>Fermer</button>
        </div>
        
        <div className="queue-list" style={{ flex: '1 1 50%', minHeight: 0 }}>
          {queue.map((track, i) => (
            <div key={`${track.id}-${i}`} className={`queue-item ${currentQueueIndex === i ? 'active' : ''}`} onClick={() => { setCurrentQueueIndex(i); setIsPlaying(true); }}>
              <img src={track.thumbnail} alt="" className="track-img" style={{ width: 28, height: 28 }} />
              <div className="track-info" style={{ paddingLeft: 6 }}>
                <span className="track-title" style={{ fontSize: '0.8rem' }}>{track.title}</span>
                <span className="track-artist" style={{ fontSize: '0.7rem' }}>{track.author}</span>
              </div>
              <span className="track-duration" style={{ fontSize: '0.7rem' }}>{track.duration}</span>
            </div>
          ))}
        </div>

        {/* Suggestions Section */}
        <div className="recommendations-section" style={{ flex: '1 1 50%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="recommendations-title-row">
            <span>Suggestions</span>
            {isRecLoading && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mise à jour...</span>}
          </div>
          <div className="recommendations-list">
            {recommendations.map(track => (
              <div key={track.id} className="recommendation-item" onClick={() => playTrack(track)}>
                <img src={track.thumbnail} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                <div className="recommendation-info">
                  <span className="recommendation-title">{track.title}</span>
                  <span className="recommendation-artist">{track.author}</span>
                </div>
                <div className="recommendation-actions" onClick={e => e.stopPropagation()}>
                  <button className="recommendation-btn" onClick={(e) => addToQueue(track, e)}>➕</button>
                  <button className="recommendation-btn" onClick={() => playTrack(track)}>▶️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Playlist modal creation */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <form onSubmit={createPlaylist} style={{ width: '100%', maxWidth: 360, backgroundColor: '#101018', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Créer une playlist</h2>
            <input type="text" placeholder="Nom de la playlist" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="input-premium" autoFocus />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-premium btn-secondary" onClick={() => { setShowCreateModal(false); setNewPlaylistName(''); }}>Annuler</button>
              <button type="submit" className="btn-premium btn-primary">Créer</button>
            </div>
          </form>
        </div>
      )}

      {/* Local Folder Location Modal removed - handled by FolderButton */}

      {/* Bottom Player Controller Bar */}
      <footer className="player-bar">
        <div className="player-track-info">
          {currentTrack ? (
            <>
              <img src={currentTrack.thumbnail} alt="" className="player-img" />
              <div className="player-text">
                <span className="player-title">{currentTrack.title}</span>
                <span className="player-artist">{currentTrack.author}</span>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune lecture active</span>
          )}
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button className={`nav-btn ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(!shuffle)}>🔀</button>
            <button className="nav-btn" onClick={playPrev}>⏮️</button>
            <button className="play-btn" onClick={togglePlay}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button className="nav-btn" onClick={playNext}>⏭️</button>
            <button className={`nav-btn ${loop !== 'none' ? 'active' : ''}`} onClick={() => setLoop(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none')}>
              🔁 {loop === 'one' && <span style={{ fontSize: '0.55rem', position: 'absolute', right: -2, top: -4, background: 'var(--accent-color)', color: 'white', padding: '1px 3px', borderRadius: 4 }}>1</span>}
            </button>
            <button className={`nav-btn autoplay-btn ${autoplay ? 'active' : ''}`} onClick={() => { const val = !autoplay; setAutoplay(val); localStorage.setItem('vibelocal_autoplay', String(val)); }} title="Lecture auto">
              ♾️
            </button>
          </div>

          <div className="timeline-container">
            <span className="time-label">{formatTime(progress)}</span>
            <input type="range" min="0" max={duration || 100} value={progress} onChange={e => { const v = parseFloat(e.target.value); setProgress(v); if(audioRef.current) audioRef.current.currentTime = v; }} className="slider" />
            <span className="time-label">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-options">
          <button className={`nav-btn ${isQueueOpen ? 'active' : ''}`} onClick={() => setIsQueueOpen(!isQueueOpen)}>☰</button>
          <div className="volume-container">
            <button className="nav-btn" onClick={() => setIsMuted(!isMuted)}>{isMuted ? '🔇' : '🔊'}</button>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="slider" />
          </div>
        </div>
      </footer>
    </div>
  );
}
