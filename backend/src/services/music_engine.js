const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const MUSIC_BASE = process.pkg
  ? path.join(path.dirname(process.execPath), 'assets/music')
  : path.resolve(__dirname, '../../assets/music');

const EMOTION_KEYWORDS = {
  horror: ['murder', 'dead', 'kill', 'blood', 'death', 'body', 'ghost', 'haunted', 'terrifying'],
  mystery: ['missing', 'vanished', 'secret', 'unknown', 'disappeared', 'hidden', 'strange'],
  crime: ['arrested', 'police', 'stolen', 'robbery', 'criminal', 'gang', 'fraud', 'scam'],
  emotional: ['family', 'mother', 'child', 'love', 'heartbreak', 'tears', 'cancer', 'died'],
  secondaryColor: ['exposed', 'leaked', 'scandal', 'shocking', 'unbelievable', 'viral'],
  suspense: ['thriller', 'chase', 'escape', 'trap', 'danger', 'warning', 'attack'],
  funny: ['funny', 'hilarious', 'comedy', 'laugh', 'prank', 'joke'],
  motivational: ['success', 'rich', 'million', 'business', 'inspire', 'achieve'],
};

function detectEmotion(title, content = '') {
  const text = `${title} ${content}`.toLowerCase().substring(0, 500);
  let best = 'suspense';
  let bestScore = 0;

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    const score = keywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = emotion;
    }
  }
  return best;
}

function listMusicFiles(emotion) {
  const dir = path.join(MUSIC_BASE, emotion);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(mp3|wav|aac)$/i.test(f));
}

const ytdl = require('@distube/ytdl-core');

const FREE_MUSIC_LINKS = {
  suspense: [
    'https://www.youtube.com/watch?v=JmY3hEAQ-K8', 'https://www.youtube.com/watch?v=aHqR70W7yqM',
    'https://www.youtube.com/watch?v=M5dEHht_o5c', 'https://www.youtube.com/watch?v=YwN8R-14Wb4',
    'https://www.youtube.com/watch?v=68D0zXGvJQQ'
  ],
  emotional: [
    'https://www.youtube.com/watch?v=gT8Tz3W-d0g', 'https://www.youtube.com/watch?v=RBAxO5y3YdE',
    'https://www.youtube.com/watch?v=x7E24eK3ZxE', 'https://www.youtube.com/watch?v=P_Xf2JmFvIE',
    'https://www.youtube.com/watch?v=N_vAov0QeE4'
  ],
  funny: [
    'https://www.youtube.com/watch?v=mDscI9JqYtM', 'https://www.youtube.com/watch?v=hN2yQOq-0l8',
    'https://www.youtube.com/watch?v=WzF2G88b3xI', 'https://www.youtube.com/watch?v=8V-m3W7FwzU'
  ],
  lofi: [
    'https://www.youtube.com/watch?v=bMcgJgDBfG0', 'https://www.youtube.com/watch?v=1fueZCTYkpA',
    'https://www.youtube.com/watch?v=0yG-7fN6X0w', 'https://www.youtube.com/watch?v=9FvvbVI5rYA',
    'https://www.youtube.com/watch?v=lTRiuFIWV54'
  ],
  horror: [
    'https://www.youtube.com/watch?v=nFjJ17zJjGg', 'https://www.youtube.com/watch?v=T_s_b8_iT8Y',
    'https://www.youtube.com/watch?v=rC1ZqE8f45I', 'https://www.youtube.com/watch?v=8wO46_1N4m4'
  ],
  default: [
    'https://www.youtube.com/watch?v=bMcgJgDBfG0', 'https://www.youtube.com/watch?v=1fueZCTYkpA'
  ]
};

async function downloadYouTubeMusic(emotion, categoryPath) {
  try {
    const urls = FREE_MUSIC_LINKS[emotion] || FREE_MUSIC_LINKS.default;
    const url = urls[Math.floor(Math.random() * urls.length)];
    const filename = `yt_${Date.now()}.mp3`;
    const filePath = path.join(categoryPath, filename);

    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    console.log(`[MusicEngine] Downloading free music from YouTube: ${url}`);
    
    return new Promise((resolve, reject) => {
      const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
      const writer = fs.createWriteStream(filePath);
      
      stream.pipe(writer);
      
      writer.on('finish', () => {
        console.log(`[MusicEngine] Downloaded free music to ${filePath}`);
        resolve({ filePath, filename, emotion });
      });
      
      writer.on('error', (err) => {
        console.error('[MusicEngine] YouTube download error:', err.message);
        reject(err);
      });
      
      stream.on('error', (err) => {
        console.error('[MusicEngine] YouTube stream error:', err.message);
        reject(err);
      });
    });
  } catch (err) {
    console.error('[MusicEngine] Failed to init YouTube download:', err.message);
    return null;
  }
}

async function matchSoundtrack(emotion) {
  let category = emotion;
  let files = listMusicFiles(category);
  if (!files.length) {
    category = 'suspense';
    files = listMusicFiles(category);
  }
  
  if (!files.length) {
    // No local files, download from YouTube
    const ytMusic = await downloadYouTubeMusic(category, path.join(MUSIC_BASE, category));
    if (ytMusic) return ytMusic;
    return null;
  }

  const row = db.prepare(
    `SELECT * FROM music_library WHERE category = ? ORDER BY use_count ASC, RANDOM() LIMIT 1`
  ).get(category);

  if (row && fs.existsSync(row.file_path)) {
    db.prepare(`UPDATE music_library SET use_count = use_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?`).run(row.id);
    return { filePath: row.file_path, filename: row.filename, emotion: category };
  }

  const filename = files[Math.floor(Math.random() * files.length)];
  const filePath = path.join(MUSIC_BASE, category, filename);
  return { filePath, filename, emotion: category };
}

function scanMusicLibrary() {
  if (!fs.existsSync(MUSIC_BASE)) {
    fs.mkdirSync(MUSIC_BASE, { recursive: true });
  }

  let count = 0;
  const categories = fs.readdirSync(MUSIC_BASE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const category of categories) {
    const files = listMusicFiles(category);
    for (const filename of files) {
      const filePath = path.join(MUSIC_BASE, category, filename);
      const existing = db.prepare(`SELECT id FROM music_library WHERE file_path = ?`).get(filePath);
      if (!existing) {
        db.prepare(`
          INSERT INTO music_library (filename, category, emotion, file_path)
          VALUES (?, ?, ?, ?)
        `).run(filename, category, category, filePath);
        count++;
      }
    }
  }
  console.log(`[MusicEngine] Music library scanned: ${count} new tracks indexed`);
  return count;
}

// Helper function to query tracks mapping columns dynamically
function getTracksFromDb(whereClause = '', params = []) {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(music_library)").all();
    const cols = tableInfo.map(c => c.name);
    
    // Construct SELECT clause dynamically to support different schemas safely
    const titleCol = cols.includes('title') ? 'title' : 'filename AS title';
    const genreCol = cols.includes('genre') ? 'genre' : 'category AS genre';
    const moodCol = cols.includes('mood') ? 'mood' : 'emotion AS mood';
    const bpmCol = cols.includes('bpm') ? 'bpm' : '0 AS bpm';
    const durationCol = cols.includes('duration') ? 'duration' : '0 AS duration';
    
    const query = `
      SELECT id, ${titleCol}, file_path, ${genreCol}, ${moodCol}, ${durationCol}, ${bpmCol}
      FROM music_library
      ${whereClause ? 'WHERE ' + whereClause : ''}
    `;
    
    const rows = db.prepare(query).all(...params);
    return rows.filter(row => fs.existsSync(row.file_path));
  } catch (e) {
    console.error('[MusicEngine] DB fetch error:', e.message);
    return [];
  }
}

function selectMusicForReel(reelOptions = {}) {
  const mood = reelOptions.mood || reelOptions.theme || 'suspense';
  return getMusicByMood(mood);
}

function getMusicByMood(mood) {
  const tracks = getTracksFromDb('category = ? OR emotion = ?', [mood, mood]);
  if (tracks.length > 0) {
    const selected = tracks[Math.floor(Math.random() * tracks.length)];
    return {
      id: selected.id,
      title: selected.title,
      file_path: selected.file_path,
      duration: selected.duration,
      bpm: selected.bpm
    };
  }
  
  // Fallback to any active track in database
  const allTracks = getTracksFromDb();
  if (allTracks.length > 0) {
    const selected = allTracks[Math.floor(Math.random() * allTracks.length)];
    return {
      id: selected.id,
      title: selected.title,
      file_path: selected.file_path,
      duration: selected.duration,
      bpm: selected.bpm
    };
  }
  
  return null;
}

function scanMusicFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  
  const tableInfo = db.prepare("PRAGMA table_info(music_library)").all();
  const cols = tableInfo.map(c => c.name);
  
  const files = fs.readdirSync(folderPath).filter(f => /\.(mp3|wav|aac)$/i.test(f));
  const addedTracks = [];
  
  for (const filename of files) {
    const filePath = path.resolve(folderPath, filename);
    const existing = db.prepare(`SELECT id FROM music_library WHERE file_path = ?`).get(filePath);
    
    if (!existing) {
      // Construct INSERT statement dynamically
      const insertCols = ['file_path'];
      const placeholders = ['?'];
      const values = [filePath];
      
      if (cols.includes('filename')) {
        insertCols.push('filename');
        placeholders.push('?');
        values.push(filename);
      }
      if (cols.includes('title')) {
        insertCols.push('title');
        placeholders.push('?');
        values.push(path.basename(filename, path.extname(filename)));
      }
      if (cols.includes('category')) {
        insertCols.push('category');
        placeholders.push('?');
        values.push('default');
      }
      if (cols.includes('emotion')) {
        insertCols.push('emotion');
        placeholders.push('?');
        values.push('default');
      }
      if (cols.includes('genre')) {
        insertCols.push('genre');
        placeholders.push('?');
        values.push('default');
      }
      if (cols.includes('mood')) {
        insertCols.push('mood');
        placeholders.push('?');
        values.push('default');
      }
      if (cols.includes('duration')) {
        insertCols.push('duration');
        placeholders.push('?');
        values.push(0);
      }
      if (cols.includes('bpm')) {
        insertCols.push('bpm');
        placeholders.push('?');
        values.push(0);
      }
      
      const query = `
        INSERT INTO music_library (${insertCols.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      try {
        const info = db.prepare(query).run(...values);
        const title = cols.includes('title') ? path.basename(filename, path.extname(filename)) : filename;
        addedTracks.push({
          id: info.lastInsertRowid,
          title,
          file_path: filePath,
          duration: 0,
          bpm: 0
        });
      } catch (err) {
        console.error(`[MusicEngine] Scan insert failed for ${filename}:`, err.message);
      }
    }
  }
  
  return addedTracks;
}

function prepareMusicConfig(filePath, reelDuration = 10) {
  return {
    inputPath: filePath,
    duration: reelDuration,
    fadeIn: 0.5,
    fadeOut: 1.0,
    volume: 0.7,
  };
}

module.exports = {
  detectEmotion,
  matchSoundtrack,
  scanMusicLibrary,
  prepareMusicConfig,
  MUSIC_BASE,
  selectMusicForReel,
  getMusicByMood,
  scanMusicFolder,
};
