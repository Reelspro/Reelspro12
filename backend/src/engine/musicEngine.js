const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
let ffmpegPath;
if (process.pkg) {
  ffmpegPath = path.join(path.dirname(process.execPath), 'ffmpeg.exe');
  if (!fs.existsSync(ffmpegPath)) {
    ffmpegPath = 'ffmpeg';
  }
} else {
  ffmpegPath = require('ffmpeg-static');
}
ffmpeg.setFfmpegPath(ffmpegPath);

const MUSIC_BASE_DIR = process.pkg
  ? path.join(path.dirname(process.execPath), 'assets/music')
  : path.resolve(__dirname, '../../assets/music');
const SUPPORTED_EMOTIONS = [
  'horror', 'mystery', 'emotional', 'crime', 
  'shocking', 'suspense', 'funny', 'motivational'
];

/**
 * Scan Local Music Library for a given emotion/category
 */
const scanMusicLibrary = (emotion) => {
  const targetDir = path.join(MUSIC_BASE_DIR, emotion);
  if (!fs.existsSync(targetDir)) return [];
  
  const files = fs.readdirSync(targetDir);
  // Filter for valid audio files
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.mp3' || ext === '.wav' || ext === '.aac';
  }).map(file => path.join(targetDir, file));
};

/**
 * Detect emotion from article context.
 * Falls back to 'suspense' or 'mystery'.
 */
const detectEmotion = (articleCategory, scriptScenes) => {
  if (!articleCategory) return 'suspense';
  
  const catLower = articleCategory.toLowerCase();
  
  for (const emotion of SUPPORTED_EMOTIONS) {
    if (catLower.includes(emotion)) {
      return emotion;
    }
  }

  // Look into script scenes for dominant emotion
  if (scriptScenes && scriptScenes.length > 0) {
    const emotionFreq = {};
    scriptScenes.forEach(scene => {
      const e = scene.emotion?.toLowerCase() || 'suspense';
      emotionFreq[e] = (emotionFreq[e] || 0) + 1;
    });
    
    const dominant = Object.keys(emotionFreq).reduce((a, b) => emotionFreq[a] > emotionFreq[b] ? a : b);
    if (SUPPORTED_EMOTIONS.includes(dominant)) {
      return dominant;
    }
  }

  // Default fallbacks based on common SaaS use-cases
  if (catLower.includes('murder') || catLower.includes('police')) return 'crime';
  if (catLower.includes('sad') || catLower.includes('heart')) return 'emotional';
  if (catLower.includes('ghost') || catLower.includes('scary')) return 'horror';

  return 'suspense';
};

/**
 * Match and randomizer a soundtrack based on emotion
 */
const matchSoundtrack = (emotion) => {
  const safeEmotion = SUPPORTED_EMOTIONS.includes(emotion) ? emotion : 'suspense';
  const availableTracks = scanMusicLibrary(safeEmotion);

  if (availableTracks.length === 0) {
    // Attempt fallback to suspense
    const fallbackTracks = scanMusicLibrary('suspense');
    if (fallbackTracks.length === 0) {
      return null; // No music found at all
    }
    const randomIndex = Math.floor(Math.random() * fallbackTracks.length);
    return fallbackTracks[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * availableTracks.length);
  return availableTracks[randomIndex];
};

/**
 * Process Music: Trim and add fade in/out
 * @param {string} inputPath - Path to original audio file
 * @param {string} outputPath - Path to save processed audio
 * @param {number} duration - Target duration in seconds (e.g. 10s)
 */
const processMusic = (inputPath, outputPath, duration = 30) => {
  return new Promise((resolve, reject) => {
    if (!inputPath || !fs.existsSync(inputPath)) {
      return reject(new Error('Input music file not found'));
    }

    const fadeDuration = 3; // 3 seconds fade in and fade out for emotional feel

    ffmpeg()
      .input(inputPath)
      .inputOptions(['-stream_loop', '-1'])
      .setDuration(duration) // Trims music to reel duration
      .audioFilters([
        `afade=t=in:ss=0:d=${fadeDuration}`, // Slow emotional fade in
        `afade=t=out:st=${Math.max(0, duration - fadeDuration)}:d=${fadeDuration}`, // Slow emotional fade out
        'volume=1.0' // Normalize base volume here, it will be adjusted in amix
      ])
      .save(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = {
  detectEmotion,
  matchSoundtrack,
  processMusic,
  scanMusicLibrary
};
