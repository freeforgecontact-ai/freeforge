import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import ytSearch from 'yt-search';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure music directory
const DEFAULT_MUSIC_DIR = 'D:\\LocalYTMusic';
const FALLBACK_MUSIC_DIR = path.join(__dirname, 'downloads');
let MUSIC_DIR = DEFAULT_MUSIC_DIR;

// Ensure music directory exists
try {
  if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
  }
  console.log(`Using primary music directory: ${MUSIC_DIR}`);
} catch (error) {
  console.error(`Could not access or create ${MUSIC_DIR}, falling back to local folder.`, error);
  MUSIC_DIR = FALLBACK_MUSIC_DIR;
  if (!fs.existsSync(MUSIC_DIR)) {
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
  }
  console.log(`Using fallback music directory: ${MUSIC_DIR}`);
}

const LIBRARY_FILE = path.join(__dirname, 'library.json');

// Initialize library file if it doesn't exist
if (!fs.existsSync(LIBRARY_FILE)) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify([], null, 2));
}

// In-memory active downloads tracking
const activeDownloads = {};

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static music files
app.use('/music', express.static(MUSIC_DIR));

// Helper: Read library JSON
function readLibrary() {
  try {
    const data = fs.readFileSync(LIBRARY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading library file:", err);
    return [];
  }
}

// Helper: Write library JSON
function writeLibrary(library) {
  try {
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2));
  } catch (err) {
    console.error("Error writing library file:", err);
  }
}

// API: Search Online
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    console.log(`Searching online for: "${query}"`);
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, 25).map(video => ({
      id: video.videoId,
      title: video.title,
      duration: video.duration.timestamp,
      seconds: video.duration.seconds,
      thumbnail: video.thumbnail,
      author: video.author.name,
      views: video.views,
      ago: video.ago,
      url: video.url
    }));
    
    // Check which ones are already downloaded
    const library = readLibrary();
    const downloadedIds = new Set(library.map(s => s.id));
    
    const augmentedVideos = videos.map(video => ({
      ...video,
      downloaded: downloadedIds.has(video.id),
      downloading: !!activeDownloads[video.id],
      progress: activeDownloads[video.id] ? activeDownloads[video.id].progress : 0
    }));

    res.json(augmentedVideos);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search online sources' });
  }
});

// API: Get intelligent recommendations based on a track
app.get('/api/recommend', async (req, res) => {
  const { id, title, author } = req.query;
  if (!title && !author) {
    return res.status(400).json({ error: 'Title or author is required' });
  }

  try {
    const library = readLibrary();
    const recommended = [];
    const seenIds = new Set();
    if (id) seenIds.add(id);

    // 1. Local recommendations: find songs in local library with same author
    if (author) {
      const cleanAuthor = author.toLowerCase().trim();
      const localMatches = library.filter(song => {
        if (song.id === id) return false;
        const songAuthor = (song.author || '').toLowerCase().trim();
        return songAuthor.includes(cleanAuthor) || cleanAuthor.includes(songAuthor);
      });
      
      localMatches.forEach(song => {
        if (!seenIds.has(song.id)) {
          seenIds.add(song.id);
          recommended.push({
            id: song.id,
            title: song.title,
            duration: song.duration,
            seconds: song.seconds,
            thumbnail: song.thumbnail,
            author: song.author,
            source: 'local',
            downloaded: true
          });
        }
      });
    }

    // 2. Online recommendations: search online for artist/song mix
    let searchQuery = '';
    if (author && title) {
      searchQuery = `${author} ${title} similar music`;
    } else if (author) {
      searchQuery = `${author} music`;
    } else {
      searchQuery = `${title} music`;
    }

    console.log(`Searching online recommendations for: "${searchQuery}"`);
    const results = await ytSearch(searchQuery);
    const onlineVideos = results.videos.slice(0, 15).map(video => ({
      id: video.videoId,
      title: video.title,
      duration: video.duration.timestamp,
      seconds: video.duration.seconds,
      thumbnail: video.thumbnail,
      author: video.author.name,
      source: 'online'
    }));

    // Check download statuses for online videos and merge
    const downloadedIds = new Set(library.map(s => s.id));
    onlineVideos.forEach(video => {
      if (!seenIds.has(video.id)) {
        seenIds.add(video.id);
        recommended.push({
          ...video,
          downloaded: downloadedIds.has(video.id),
          downloading: !!activeDownloads[video.id],
          progress: activeDownloads[video.id] ? activeDownloads[video.id].progress : 0
        });
      }
    });

    // Return top 15 recommendations
    res.json(recommended.slice(0, 15));
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// API: Get library (downloaded songs)
app.get('/api/library', (req, res) => {
  const library = readLibrary();
  
  // Double check if file actually exists on disk
  let updated = false;
  const filteredLibrary = library.filter(song => {
    const filePath = path.join(MUSIC_DIR, `${song.id}.m4a`);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      updated = true;
    }
    return exists;
  });

  if (updated) {
    writeLibrary(filteredLibrary);
  }

  res.json(filteredLibrary);
});

// API: Check download status
app.get('/api/downloads/status', (req, res) => {
  res.json(Object.values(activeDownloads).map(d => ({
    id: d.id,
    title: d.title,
    progress: d.progress,
    status: d.status
  })));
});

// API: Download song (async)
app.post('/api/download', async (req, res) => {
  const { id, title, thumbnail, duration, seconds, author } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  // Already downloaded?
  const library = readLibrary();
  const exists = library.find(s => s.id === id);
  if (exists && fs.existsSync(path.join(MUSIC_DIR, `${id}.m4a`))) {
    return res.json({ status: 'completed', song: exists });
  }

  // Already downloading?
  if (activeDownloads[id]) {
    return res.json({ status: 'downloading', progress: activeDownloads[id].progress });
  }

  // Start download process
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const finalFilename = `${id}.m4a`;
  const tempPath = path.join(MUSIC_DIR, `${id}.temp`);
  
  console.log(`Starting download for: ${title} (${id})`);

  activeDownloads[id] = {
    id,
    title,
    thumbnail,
    duration,
    seconds,
    author,
    progress: 0,
    status: 'downloading'
  };

  // Run yt-dlp command
  // -x = extract audio
  // --audio-format m4a
  // -f ba[ext=m4a]/ba = best audio that is m4a, or just best audio
  const args = [
    '-f', 'ba[ext=m4a]/ba',
    '-x',
    '--audio-format', 'm4a',
    '-o', path.join(MUSIC_DIR, '%(id)s.%(ext)s'),
    '--no-playlist'
  ];

  // Apply cookies if cookies.txt is present
  const localCookies = path.join(__dirname, 'cookies.txt');
  const musicCookies = path.join(MUSIC_DIR, 'cookies.txt');
  if (fs.existsSync(localCookies)) {
    args.push('--cookies', localCookies);
    console.log(`Using cookies from local file: ${localCookies}`);
  } else if (fs.existsSync(musicCookies)) {
    args.push('--cookies', musicCookies);
    console.log(`Using cookies from music folder: ${musicCookies}`);
  }

  args.push(videoUrl);

  const child = spawn('yt-dlp', args);

  child.stdout.on('data', (data) => {
    const output = data.toString();
    // Parse progress percentage (e.g., "[download]  12.3% of...")
    const match = output.match(/\[download\]\s+(\d+\.?\d*)%/);
    if (match) {
      const progress = parseFloat(match[1]);
      if (activeDownloads[id]) {
        activeDownloads[id].progress = progress;
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`yt-dlp stderr [${id}]:`, data.toString());
  });

  child.on('close', (code) => {
    console.log(`yt-dlp process for ${id} exited with code ${code}`);
    
    if (code === 0 && fs.existsSync(path.join(MUSIC_DIR, finalFilename))) {
      // Success! Update library database
      const currentLibrary = readLibrary();
      
      // Prevent duplicates in JSON DB
      const cleanLibrary = currentLibrary.filter(s => s.id !== id);
      
      const newSong = {
        id,
        title,
        author,
        duration,
        seconds,
        thumbnail,
        fileName: finalFilename,
        filePath: path.join(MUSIC_DIR, finalFilename),
        addedAt: new Date().toISOString()
      };

      cleanLibrary.push(newSong);
      writeLibrary(cleanLibrary);
      
      delete activeDownloads[id];
      console.log(`Successfully downloaded and added to library: ${title}`);
    } else {
      console.error(`Download failed or file not found for: ${title}`);
      if (activeDownloads[id]) {
        activeDownloads[id].status = 'failed';
        // Remove from active downloads after a short timeout so user can try again
        setTimeout(() => {
          delete activeDownloads[id];
        }, 10000);
      }
    }
  });

  // Return immediately so frontend knows download has started
  res.json({ status: 'started', id });
});

// API: Stream audio live (proxy)
app.get('/api/stream/live', (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Live streaming audio for video ID: ${id}`);
  
  // Set headers for audio stream
  res.setHeader('Content-Type', 'audio/mp4');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Spawn yt-dlp to stream audio stdout directly to response
  const args = [
    '-f', 'ba[ext=m4a]/ba',
    '-o', '-' // output to stdout
  ];

  // Apply cookies if cookies.txt is present
  const localCookies = path.join(__dirname, 'cookies.txt');
  const musicCookies = path.join(MUSIC_DIR, 'cookies.txt');
  if (fs.existsSync(localCookies)) {
    args.push('--cookies', localCookies);
    console.log(`Streaming: Using cookies from local file: ${localCookies}`);
  } else if (fs.existsSync(musicCookies)) {
    args.push('--cookies', musicCookies);
    console.log(`Streaming: Using cookies from music folder: ${musicCookies}`);
  }

  args.push(`https://www.youtube.com/watch?v=${id}`);

  const child = spawn('yt-dlp', args);

  child.stdout.pipe(res);

  child.on('error', (err) => {
    console.error(`Streaming child process error [${id}]:`, err);
  });

  // Kill the process if client closes connection early
  req.on('close', () => {
    console.log(`Live stream client disconnected for ID: ${id}. Terminating stream.`);
    child.kill();
  });
});

// API: Delete song
app.delete('/api/songs/:id', (req, res) => {
  const { id } = req.params;
  const library = readLibrary();
  const updatedLibrary = library.filter(s => s.id !== id);
  
  const filePath = path.join(MUSIC_DIR, `${id}.m4a`);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    writeLibrary(updatedLibrary);
    res.json({ success: true, message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

// Helper: Get localized folder name for each tool ID
function getToolFolderName(folderId) {
  const SPECIAL_NAMES = {
    vibelocal: 'RadioPremium',
    facture: 'Factures',
    soumission: 'Soumissions',
    registre_kilo: 'RegistreKilometrique',
    receipt_logger: 'Reçus',
    affaires_plan: 'PlansAffaires',
    scheduler: 'HorairesEmployes',
    taxes: 'CalculTaxes',
    autonome: 'ImpotCalculateur',
    compressor: 'ImagesCompressees',
    glassmorphism: 'GlassmorphismStyles',
    json: 'FichiersJson',
    svg: 'ImagesSvg',
    markdown: 'DocumentsMarkdown',
    id3: 'TagsAudio',
    trimmer: 'AudioDecoupe',
    waveform: 'SpectresVideo',
    
    // Dev2
    cron: 'CronVisualizer',
    jwt: 'JwtDebugger',
    regex: 'RegExTester',
    encoder: 'Base64Encoder',
    mock_api: 'MockApiServer',
    git_visualizer: 'GitVisualizer',
    flexbox_playground: 'FlexboxPlayground',
    color_contrast: 'ColorContrastChecker',
    web_executable: 'WebToExecutable',

    // Gamers
    crosshair: 'CrosshairGenerator',
    sensitivity: 'AimSensitivity',
    fps_logbook: 'FpsHardwareLogbook',
    gamertag: 'GamertagGenerator',
    steam_sorter: 'SteamLibrarySorter',
    bracket: 'TournamentBracket',
    rgb_designer: 'RgbLightSync',
    sound_generator: 'RetroSoundGenerator',

    // Life
    workout: 'WorkoutBuilder',
    calorie: 'CalorieMacroTracker',
    budget_personal: 'BudgetPersonnel',
    resume_builder: 'ResumeCvBuilder',
    journal_intime: 'JournalMoodTracker',
    habit_tracker: 'HabitTrackerGrid',
    travel_checklist: 'TravelChecklist',
    kanban_board: 'KanbanTaskBoard',

    // Everyday
    fridge_scanner: 'FridgeScanner',
    cooking_converter: 'CookingConverter',
    story_weaver: 'KidsStoryWeaver',
    hydro_quebec: 'SimulateurHydroQuebec',
    tip_calculator: 'CalculateurPourboires',
    cooking_timer: 'MultiTimerCuisson',
    greeting_card: 'CartesVoeux',
    white_noise: 'WhiteNoiseMixer',

    // Finance
    crypto_tracker: 'CryptoPortfolio',
    mortgage_quebec: 'SimulateurHypothecaire',
    compound_calculator: 'InteretsComposes',
    dividend_tracker: 'DividendesTracker',
    salary_quebec: 'SalaireNetQuebec',
    retirement_planner: 'EpargneRetraite',
    emergency_fund: 'FondsUrgence',
    debt_planner: 'RemboursementDettes',

    // Student
    gpa_coter: 'CoteRGPA',
    flashcard_quizzer: 'FlashcardsQuizzer',
    pomodoro_study: 'PomodoroStudy',
    citations_generator: 'CitationsGenerateur',
    pdf_splitter: 'PDFOrganisateur',
    mind_map: 'MindMapsVectoriel',
    readability_analyzer: 'AnalyseurLisibilite',
    class_schedule: 'HorairesEtudes',

    // Creators
    palette_extractor: 'PaletteCouleurs',
    gradient_maker: 'GradientsCSS',
    typography_pairer: 'TypographyPairer',
    background_remover: 'DetoureurImages',
    thumbnail_visualizer: 'VignettesVisualiseur',
    text_shadow: 'OmbragesCSS',
    vector_svg: 'EditeurSVGVectoriel',
    bpm_metronome: 'MetronomeBPM',

    // Travel
    currency_converter: 'DevisesHorsLigne',
    itinerary_planner: 'FeuilleRouteVoyage',
    packing_list: 'ValisesOptimiseur',
    world_time: 'FuseauxHoraires',
    expense_splitter: 'PartageFraisVoyage',
    emergency_card: 'FichesUrgence',
    fuel_calculator: 'CalculateurEssence',
    photo_compress: 'PhotosVoyage',

    // Healthy
    recipe_scaler: 'RecettesPortions',
    pantry_tracker: 'PantryStock',
    water_intake: 'HydratationLog',
    imc_health: 'IMCMetabolisme',
    sleep_cycle: 'CyclesSommeil',
    meal_prep: 'MealPrepMenu',
    nutrient_calculator: 'NutrimentsMacros',
    meditation_soundscape: 'MeditationSons'
  };
  
  return SPECIAL_NAMES[folderId] || folderId.replace(/[^a-zA-Z0-9]/g, '');
}

// API: Open folder in system file manager (local PC only)
app.post('/api/open-folder', (req, res) => {
  const { folder } = req.body;
  
  if (folder === 'vibelocal') {
    return openFolderInExplorer(MUSIC_DIR, res);
  }

  const folderName = getToolFolderName(folder);
  const BASE_FREEFORGE_DIR = 'D:\\FreeForge';
  let targetDir = path.join(BASE_FREEFORGE_DIR, folderName);

  // If D: drive doesn't exist or is not writeable, fallback to local user profile
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    openFolderInExplorer(targetDir, res);
  } catch (err) {
    console.error(`Could not create folder on D:, falling back to user home directory.`);
    const userHome = process.env.USERPROFILE || process.env.HOME || __dirname;
    const fallbackBase = path.join(userHome, 'FreeForge');
    targetDir = path.join(fallbackBase, folderName);
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      openFolderInExplorer(targetDir, res);
    } catch (fallbackErr) {
      console.error('Failed to open fallback folder:', fallbackErr);
      res.status(500).json({ error: 'Failed to create local directory' });
    }
  }
});

function openFolderInExplorer(targetDir, res) {
  console.log(`Opening folder in explorer: ${targetDir}`);
  try {
    if (process.platform === 'win32') {
      spawn('explorer', [targetDir]);
    } else if (process.platform === 'darwin') {
      spawn('open', [targetDir]);
    } else {
      spawn('xdg-open', [targetDir]);
    }
    res.json({ success: true, path: targetDir });
  } catch (err) {
    console.error('Failed to open folder:', err);
    res.status(500).json({ error: 'Failed to open directory' });
  }
}

// --- PLAYLISTS DATABASE SETUP ---
const PLAYLISTS_FILE = path.join(__dirname, 'playlists.json');
if (!fs.existsSync(PLAYLISTS_FILE)) {
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify([], null, 2));
}

function readPlaylists() {
  try {
    const data = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writePlaylists(playlists) {
  try {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
  } catch (err) {
    console.error("Error writing playlists:", err);
  }
}

// API: Get all playlists
app.get('/api/playlists', (req, res) => {
  res.json(readPlaylists());
});

// API: Create new playlist
app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nom de playlist requis' });
  }

  const playlists = readPlaylists();
  if (playlists.find(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Une playlist avec ce nom existe déjà' });
  }

  const newPlaylist = {
    name: name.trim(),
    songs: []
  };

  playlists.push(newPlaylist);
  writePlaylists(playlists);
  res.json(newPlaylist);
});

// API: Import playlist
app.post('/api/playlists/import', (req, res) => {
  const { playlist } = req.body;
  if (!playlist || !playlist.name || !Array.isArray(playlist.songs)) {
    return res.status(400).json({ error: 'Format de playlist invalide' });
  }

  const playlists = readPlaylists();
  let importedName = playlist.name.trim();
  
  // Auto-resolve naming conflicts
  let counter = 1;
  while (playlists.find(p => p.name.toLowerCase() === importedName.toLowerCase())) {
    importedName = `${playlist.name.trim()} (Importé ${counter})`;
    counter++;
  }

  const newPlaylist = {
    name: importedName,
    songs: playlist.songs
  };

  playlists.push(newPlaylist);
  writePlaylists(playlists);
  res.json(newPlaylist);
});

// API: Add song to playlist
app.post('/api/playlists/:name/songs', (req, res) => {
  const { name } = req.params;
  const { song } = req.body;

  if (!song || !song.id) {
    return res.status(400).json({ error: 'Détails du morceau requis' });
  }

  const playlists = readPlaylists();
  const playlist = playlists.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist introuvable' });
  }

  // Check if already in playlist
  if (!playlist.songs.find(s => s.id === song.id)) {
    playlist.songs.push(song);
    writePlaylists(playlists);
  }

  res.json(playlist);
});

// API: Remove song from playlist
app.delete('/api/playlists/:name/songs/:songId', (req, res) => {
  const { name, songId } = req.params;
  const playlists = readPlaylists();
  const playlist = playlists.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist introuvable' });
  }

  playlist.songs = playlist.songs.filter(s => s.id !== songId);
  writePlaylists(playlists);
  res.json(playlist);
});

// API: Delete playlist
app.delete('/api/playlists/:name', (req, res) => {
  const { name } = req.params;
  const playlists = readPlaylists();
  const updatedPlaylists = playlists.filter(p => p.name.toLowerCase() !== name.toLowerCase());
  
  writePlaylists(updatedPlaylists);
  res.json({ success: true });
});

// API: Compile Web App to Windows Executable (.exe)
app.post('/api/package-exe', async (req, res) => {
  const { appName, zipBase64 } = req.body;
  if (!appName || !zipBase64) {
    return res.status(400).json({ error: 'appName and zipBase64 are required' });
  }

  const cleanAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '');
  const tempDir = path.join(__dirname, 'temp_packaging_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));

  try {
    // 1. Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // 2. Write the zip file
    const zipPath = path.join(tempDir, 'assets.zip');
    fs.writeFileSync(zipPath, Buffer.from(zipBase64, 'base64'));

    // 3. Write the C# Source code
    const csCode = `using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Reflection;
using System.IO.Compression;

namespace LocalAppRunner
{
    class Program
    {
        static HttpListener listener;
        static byte[] zipData;

        [STAThread]
        static void Main(string[] args)
        {
            var assembly = Assembly.GetExecutingAssembly();
            string resourceName = null;
            foreach (var name in assembly.GetManifestResourceNames())
            {
                if (name.EndsWith("assets.zip", StringComparison.OrdinalIgnoreCase))
                {
                    resourceName = name;
                    break;
                }
            }

            if (resourceName == null) return;

            using (var stream = assembly.GetManifestResourceStream(resourceName))
            using (var ms = new MemoryStream())
            {
                stream.CopyTo(ms);
                zipData = ms.ToArray();
            }

            int port = GetFreePort();

            listener = new HttpListener();
            listener.Prefixes.Add($"http://localhost:{port}/");
            listener.Start();

            var thread = new Thread(ListenLoop);
            thread.IsBackground = true;
            thread.Start();

            try
            {
                var pInfo = new ProcessStartInfo();
                pInfo.FileName = "msedge.exe";
                pInfo.Arguments = $"--app=http://localhost:{port}/index.html --user-data-dir={Path.Combine(Path.GetTempPath(), \\"FreeForge_\\" + port)}";
                var process = Process.Start(pInfo);
                process.WaitForExit();
            }
            catch
            {
                try {
                    Process.Start($"http://localhost:{port}/index.html");
                    Thread.Sleep(5000);
                } catch {}
            }
        }

        static int GetFreePort()
        {
            var l = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        static void ListenLoop()
        {
            while (true)
            {
                try
                {
                    var ctx = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) =>
                    {
                        var context = (HttpListenerContext)state;
                        try
                        {
                            string rawPath = context.Request.Url.AbsolutePath.TrimStart('/');
                            if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";

                            byte[] buffer = null;
                            using (var ms = new MemoryStream(zipData))
                            using (var archive = new ZipArchive(ms, ZipArchiveMode.Read))
                            {
                                var entry = archive.GetEntry(rawPath);
                                if (entry != null)
                                {
                                    using (var entryStream = entry.Open())
                                    using (var reader = new MemoryStream())
                                    {
                                        entryStream.CopyTo(reader);
                                        buffer = reader.ToArray();
                                    }
                                }
                            }

                            if (buffer != null)
                            {
                                context.Response.ContentType = GetMimeType(rawPath);
                                context.Response.ContentLength64 = buffer.Length;
                                context.Response.OutputStream.Write(buffer, 0, buffer.Length);
                            }
                            else
                            {
                                context.Response.StatusCode = 404;
                            }
                        }
                        catch (Exception ex)
                        {
                            context.Response.StatusCode = 500;
                            byte[] err = Encoding.UTF8.GetBytes(ex.Message);
                            context.Response.OutputStream.Write(err, 0, err.Length);
                        }
                        finally
                        {
                            context.Response.OutputStream.Close();
                        }
                    }, context);
                }
                catch { break; }
            }
        }

        static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLower();
            if (ext == ".html" || ext == ".htm") return "text/html";
            if (ext == ".css") return "text/css";
            if (ext == ".js") return "application/javascript";
            if (ext == ".png") return "image/png";
            if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
            if (ext == ".gif") return "image/gif";
            if (ext == ".svg") return "image/svg+xml";
            if (ext == ".ico") return "image/x-icon";
            if (ext == ".json") return "application/json";
            return "application/octet-stream";
        }
    }
}`;

    const csPath = path.join(tempDir, 'App.cs');
    fs.writeFileSync(csPath, csCode);

    // 4. Run Windows csc.exe compiler
    const cscPath64 = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    const cscPath32 = 'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe';
    const cscPath = fs.existsSync(cscPath64) ? cscPath64 : cscPath32;

    if (!fs.existsSync(cscPath)) {
      throw new Error("Compilateur C# csc.exe introuvable. Cet outil requiert un environnement Windows avec le .NET Framework.");
    }

    const outPath = path.join(tempDir, `${cleanAppName}.exe`);
    const cscArgs = [
      '/target:winexe',
      `/out:${outPath}`,
      `/resource:${zipPath},assets.zip`,
      '/r:System.dll',
      '/r:System.Windows.Forms.dll',
      '/r:System.Drawing.dll',
      '/r:System.IO.Compression.dll',
      '/r:System.IO.Compression.FileSystem.dll',
      csPath
    ];

    console.log(`Compiling executable using ${cscPath}...`);
    const child = spawn(cscPath, cscArgs);
    let cscError = '';

    child.stderr.on('data', (data) => {
      cscError += data.toString();
    });

    child.stdout.on('data', (data) => {
      cscError += data.toString(); // csc sometimes writes errors to stdout
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        console.log(`Compilation succeeded: ${outPath}`);
        res.download(outPath, `${cleanAppName}.exe`, (err) => {
          // Cleanup temp folder
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (cleanupErr) {
            console.error('Failed to cleanup temp dir:', cleanupErr);
          }
        });
      } else {
        console.error(`csc.exe compilation failed with code ${code}. Error:\\n${cscError}`);
        res.status(500).json({ error: 'La compilation C# a échoué.', details: cscError });
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
      }
    });

  } catch (error) {
    console.error('Packaging exe error:', error);
    res.status(500).json({ error: error.message || 'Failed to package exe' });
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
});

// API: Package Web App into Android Gradle Project (.zip)
app.post('/api/package-apk', async (req, res) => {
  const { appName, packageId, zipBase64 } = req.body;
  if (!appName || !packageId || !zipBase64) {
    return res.status(400).json({ error: 'appName, packageId and zipBase64 are required' });
  }

  const cleanAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanPackageId = packageId.replace(/[^a-zA-Z0-9_.]/g, '');
  const packagePathStr = cleanPackageId.replace(/\\./g, '/');

  try {
    const zip = new JSZip();
    const webZip = await JSZip.loadAsync(Buffer.from(zipBase64, 'base64'));

    // 1. Add web assets to app/src/main/assets/
    const promises = [];
    webZip.forEach((relativePath, file) => {
      if (!file.dir) {
        promises.push(
          file.async('nodebuffer').then(buffer => {
            zip.file(`app/src/main/assets/${relativePath}`, buffer);
          })
        );
      }
    });
    await Promise.all(promises);

    // 2. Add build.gradle (Project)
    zip.file('build.gradle', `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
task clean(type: Delete) {
    delete rootProject.buildDir
}
`.trim());

    // 3. Add settings.gradle
    zip.file('settings.gradle', `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${cleanAppName}"
include ':app'
`.trim());

    // 4. Add app/build.gradle
    zip.file('app/build.gradle', `
plugins {
    id 'com.android.application'
}
android {
    namespace '${cleanPackageId}'
    compileSdk 34
    defaultConfig {
        applicationId "${cleanPackageId}"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
`.trim());

    // 5. Add AndroidManifest.xml
    zip.file('app/src/main/AndroidManifest.xml', `
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="true"
        android:label="${appName}"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`.trim());

    // 6. Add MainActivity.java
    zip.file(`app/src/main/java/${packagePathStr}/MainActivity.java`, `
package ${cleanPackageId};

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`.trim());

    // 7. Add local build instructions build.bat
    zip.file('build.bat', `
@echo off
echo ========================================================
echo   Compilation locale de l'application ${appName}
echo ========================================================
if not exist "%ANDROID_HOME%" (
    echo AVERTISSEMENT: Variable d'environnement ANDROID_HOME introuvable.
    echo Veuillez installer Android Studio pour compiler ce projet.
    pause
    exit /b 1
)
echo Lancement du compilateur Gradle...
call gradlew.bat assembleDebug
if %ERRORLEVEL% equ 0 (
    echo.
    echo Compilation réussie ! Votre fichier APK se trouve dans :
    echo app\\build\\outputs\\apk\\debug\\app-debug.apk
) else (
    echo Échec de la compilation.
)
pause
`.trim());

    // Generate output zip buffer and send
    const outBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanAppName}_android_project.zip"`);
    res.send(outBuffer);

  } catch (error) {
    console.error('Packaging apk error:', error);
    res.status(500).json({ error: error.message || 'Failed to package apk' });
  }
});

// Serve Vite frontend build (production build path)
app.use(express.static(path.join(__dirname, 'client/dist')));

// SPA route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
