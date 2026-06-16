const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

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

const OUTPUT_DIR = path.resolve(__dirname, '../../output/reels');
const THUMB_DIR = path.resolve(__dirname, '../../output/thumbnails');
const TEMP_DIR = path.resolve(__dirname, '../../output/temp');

[OUTPUT_DIR, THUMB_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Download article image to temp dir for FFmpeg processing
 */
const downloadImage = async (imageUrl, destPath) => {
  try {
    const response = await axios({ url: imageUrl, responseType: 'stream', timeout: 10000 });
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destPath));
      writer.on('error', reject);
    });
  } catch (err) {
    console.error(`Image download failed: ${err.message}`);
    return null;
  }
};

/**
 * Build a safe subtitle text for FFmpeg drawtext filter
 * No word-wrapping here — keep it simple to avoid filter parse errors
 */
const sanitizeForDrawtext = (text) => {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E]/g, '')  // strip non-ASCII (including emojis)
    .replace(/'/g, '')              // remove single quotes entirely (safe)
    .replace(/:/g, '\\:')           // escape colons
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/\\/g, '\\\\')         // escape backslashes last
    .trim()
    .substring(0, 120);             // increased limit for full story text
};

/**
 * Cinematic drawtext filter — Impact font, large bold text, bottom-aligned with gradient
 */
const buildDrawtext = (scene, color) => {
  if (!scene.text) return null;
  const start = scene.start_time || 0;
  const end = scene.end_time || (start + 2);

  const text = scene.text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\u2019")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');

  const maxLineLength = 28;
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(w => {
    if ((currentLine + w).length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = w + ' ';
    } else {
      currentLine += w + ' ';
    }
  });
  if (currentLine.trim()) lines.push(currentLine.trim());

  const lineHeight = 95;
  const totalTextHeight = lines.length * lineHeight;
  const baseY = `h-${totalTextHeight + 180}`;

  // Detect font path cross-platform
  const os = require('os');
  let fontfile = '';
  if (os.platform() === 'win32') {
    // Try Impact first (most cinematic), fallback to Arial Bold
    const impact = 'C\\:/Windows/Fonts/impact.ttf';
    const arialbold = 'C\\:/Windows/Fonts/arialbd.ttf';
    const arial = 'C\\:/Windows/Fonts/arial.ttf';
    const fs = require('fs');
    if (fs.existsSync('C:/Windows/Fonts/impact.ttf')) fontfile = `:fontfile='${impact}'`;
    else if (fs.existsSync('C:/Windows/Fonts/arialbd.ttf')) fontfile = `:fontfile='${arialbold}'`;
    else if (fs.existsSync('C:/Windows/Fonts/arial.ttf')) fontfile = `:fontfile='${arial}'`;
  }

  return lines.map((line, lineIndex) => {
    const yPos = `${baseY}+${lineIndex * lineHeight}`;
    return (
      `drawtext=text='${line}'` +
      `:fontcolor=0x${color}` +
      `:fontsize=82` +
      fontfile +
      `:x=(w-text_w)/2` +
      `:y=${yPos}` +
      `:borderw=6` +
      `:bordercolor=black@0.95` +
      `:box=1:boxcolor=black@0.75:boxborderw=28` +
      `:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'`
    );
  }).join(',');
};

/**
 * FIX 1b: Ensure all scenes have valid sequential start_time / end_time
 */
const ensureSceneTiming = (scenes) => {
  let currentTime = 0;
  return scenes.map(scene => {
    const duration = typeof scene.duration === 'number' && scene.duration > 0 ? scene.duration : 2.0;
    const start_time = typeof scene.start_time === 'number' ? scene.start_time : currentTime;
    const end_time = typeof scene.end_time === 'number' ? scene.end_time : currentTime + duration;
    currentTime = end_time;
    return { ...scene, duration, start_time, end_time };
  });
};

/**
 * Build a cinematic MP4 reel using FFmpeg (single image)
 */
const renderReel = async ({ reelId, imageUrl, scenes, musicPath, voiceoverPath, theme, onProgress, _localImageOverride, isCardStyle = false }) => {
  const outputPath = path.join(OUTPUT_DIR, `${reelId}.mp4`);
  const tempImagePath = _localImageOverride || path.join(TEMP_DIR, `${reelId}_img.jpg`);

  let localImagePath = _localImageOverride || null;
  if (imageUrl && !_localImageOverride) {
    localImagePath = await downloadImage(imageUrl, tempImagePath);
  }

  // FIX: Always ensure timing is valid before building filters
  const timedScenes = ensureSceneTiming(scenes);
  const totalDuration = timedScenes[timedScenes.length - 1]?.end_time || 10;
  const textColorRaw = theme?.text?.color || theme?.subtitleColor || '#ffffff';
  const color = textColorRaw.replace('#', '');

  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    if (localImagePath && fs.existsSync(localImagePath)) {
      command = command.input(localImagePath).loop(totalDuration).inputOptions(['-t', String(totalDuration)]);
    } else {
      command = command.input(`color=c=black:size=1080x1920:r=30`).inputOptions(['-f', 'lavfi', '-t', String(totalDuration)]);
    }

    // FIX: Use buildDrawtext with box background, no shadows
    const isCardImage = isCardStyle;
    const subtitleFilters = isCardImage ? [] : timedScenes.map(s => buildDrawtext(s, color)).filter(Boolean);
    const zoomExpr = isCardImage ? 'min(zoom+0.0003,1.05)' : 'min(zoom+0.001,1.15)';
    const totalFrames = Math.round(totalDuration * 30);
    const kenBurns = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='${zoomExpr}':d=${totalFrames}:s=1080x1920`;
    const vignette = `vignette=PI/4`;
    
    let videoFilterStr;
    if (isCardImage) {
      videoFilterStr = [kenBurns, vignette].join(',');
    } else {
      const gradient = `drawbox=x=0:y=ih*0.40:w=iw:h=ih*0.60:color=black@0.75:t=fill`;
      const topGradient = `drawbox=x=0:y=0:w=iw:h=ih*0.20:color=black@0.45:t=fill`;
      videoFilterStr = [kenBurns, gradient, topGradient, ...subtitleFilters, vignette].join(',');
    }

    const hasMusic = musicPath && fs.existsSync(musicPath);
    const hasVoice = voiceoverPath && fs.existsSync(voiceoverPath);

    const filterComplex = [];
    filterComplex.push(`[0:v]${videoFilterStr}[v_out]`);

    const outOptions = [
      '-map', '[v_out]',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-preset', 'fast',
      '-crf', '23',
      '-t', String(totalDuration),
      '-r', '30',
      '-s', '1080x1920',
    ];

    // FIX: Safe audio handling — null music never crashes render
    if (hasMusic && hasVoice) {
      command = command.input(musicPath).input(voiceoverPath);
      filterComplex.push('[1:a]volume=0.8[bgm];[2:a]volume=2.0[voice];[bgm][voice]amix=inputs=2:duration=first[a_out]');
      outOptions.push('-map', '[a_out]', '-shortest');
    } else if (hasMusic) {
      command = command.input(musicPath);
      filterComplex.push('[1:a]volume=1.0[a_out]');
      outOptions.push('-map', '[a_out]', '-shortest');
    } else if (hasVoice) {
      command = command.input(voiceoverPath);
      filterComplex.push('[1:a]volume=2.0[a_out]');
      outOptions.push('-map', '[a_out]', '-shortest');
    }

    command
      .on('start', cmd => console.log('[FFmpeg] Command:', cmd))
      .complexFilter(filterComplex.join(';'))
      .outputOptions(outOptions)
      .videoCodec('libx264')
      .on('progress', p => onProgress && onProgress(p.percent || 0))
      .on('end', () => {
        if (localImagePath && !_localImageOverride && fs.existsSync(localImagePath)) fs.unlinkSync(localImagePath);
        resolve(outputPath);
      })
      .on('error', err => {
        console.error('[FFmpeg] Render error:', err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

/**
 * Multi-Image Slideshow Renderer
 */
const renderReelSlideshow = async ({ reelId, localImagePaths, scenes, musicPath, voiceoverPath, theme, onProgress, isCardStyle = false }) => {
  const outputPath = path.join(OUTPUT_DIR, `${reelId}.mp4`);
  const TRANS_DUR = 0.5;
  const FPS = 30;

  // FIX: Always ensure timing before building filters
  const timedScenes = ensureSceneTiming(scenes);
  const totalDuration = timedScenes[timedScenes.length - 1]?.end_time || 10;
  const textColorRaw = theme?.text?.color || theme?.subtitleColor || '#ffffff';
  const color = textColorRaw.replace('#', '');

  const validPairs = timedScenes.map((scene, i) => ({
    scene,
    imgPath: localImagePaths[i] && fs.existsSync(localImagePaths[i])
      ? localImagePaths[i]
      : (localImagePaths.find(p => p && fs.existsSync(p)) || null)
  })).filter(p => p.imgPath);

  if (validPairs.length < 2) {
    return renderReel({ reelId, imageUrl: null, scenes: timedScenes, musicPath, voiceoverPath, theme, onProgress, _localImageOverride: validPairs[0]?.imgPath, isCardStyle });
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    validPairs.forEach(({ scene }) => {
      const inputDur = scene.duration + TRANS_DUR + 0.5;
      command = command.input(validPairs.find(v => v.scene.id === scene.id).imgPath).loop(1).inputOptions(['-t', String(inputDur)]);
    });

    const N = validPairs.length;
    const filterComplex = [];

    // 1. Ken Burns per image
    validPairs.forEach((_, i) => {
      const frames = Math.ceil((validPairs[i].scene.duration + TRANS_DUR + 0.5) * FPS);
      const zoomExpr = isCardStyle
        ? `min(zoom+0.0003,1.05)`
        : (i % 2 === 0 ? `min(zoom+0.0008,1.12)` : `max(zoom-0.0008,1.0)`);
      filterComplex.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,` +
        `zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920,` +
        `setpts=PTS-STARTPTS,fps=${FPS}[kbs${i}]`
      );
    });

    // 2. xfade transitions
    const TRANSITIONS = ['fade', 'fadeblack', 'slideleft', 'slideright', 'smoothleft'];
    let prevStream = 'kbs0';
    let cumulativeOffset = validPairs[0].scene.duration;
    for (let i = 1; i < N; i++) {
      const outStream = `xf${i}`;
      const transition = TRANSITIONS[(i - 1) % TRANSITIONS.length];
      filterComplex.push(`[${prevStream}][kbs${i}]xfade=transition=${transition}:duration=${TRANS_DUR}:offset=${cumulativeOffset.toFixed(3)}[${outStream}]`);
      prevStream = outStream;
      cumulativeOffset += validPairs[i].scene.duration;
    }

    // 3. Subtitles with box background (FIX: no shadows)
    if (isCardStyle) {
      filterComplex.push(`[${prevStream}]vignette=PI/4[v_out]`);
    } else {
      const subtitleFilters = isCardStyle ? [] : timedScenes.map(s => buildDrawtext(s, color)).filter(Boolean);
      const gradient = `drawbox=x=0:y=ih*0.40:w=iw:h=ih*0.60:color=black@0.75:t=fill`;
      const topGradient = `drawbox=x=0:y=0:w=iw:h=ih*0.20:color=black@0.45:t=fill`;
      const subtitleStr = subtitleFilters.length > 0 ? subtitleFilters.join(',') + ',' : '';
      filterComplex.push(`[${prevStream}]${gradient},${topGradient},${subtitleStr}vignette=PI/4[v_out]`);
    }

    // 4. Audio — safe null handling
    const hasMusic = musicPath && fs.existsSync(musicPath);
    const hasVoice = voiceoverPath && fs.existsSync(voiceoverPath);
    const outOptions = [
      '-map', '[v_out]',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-preset', 'fast',
      '-crf', '23',
      '-t', String(totalDuration),
      '-r', String(FPS),
      '-s', '1080x1920',
    ];

    if (hasMusic && hasVoice) {
      command = command.input(musicPath).input(voiceoverPath);
      filterComplex.push(`[${N}:a]volume=0.8[bgm];[${N + 1}:a]volume=2.0[voice];[bgm][voice]amix=inputs=2:duration=first[a_out]`);
      outOptions.push('-map', '[a_out]', '-shortest');
    } else if (hasMusic) {
      command = command.input(musicPath);
      filterComplex.push(`[${N}:a]volume=1.0[a_out]`);
      outOptions.push('-map', '[a_out]', '-shortest');
    } else if (hasVoice) {
      command = command.input(voiceoverPath);
      filterComplex.push(`[${N}:a]volume=2.0[a_out]`);
      outOptions.push('-map', '[a_out]', '-shortest');
    }

    command
      .on('start', cmd => console.log('[Slideshow] Command:', cmd))
      .complexFilter(filterComplex.join(';'))
      .outputOptions(outOptions)
      .videoCodec('libx264')
      .on('progress', p => onProgress && onProgress(p.percent || 0))
      .on('end', () => resolve(outputPath))
      .on('error', err => {
        console.error('[Slideshow] FFmpeg error:', err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

const generateThumbnail = (videoPath, reelId) => {
  const thumbPath = path.join(THUMB_DIR, `${reelId}.jpg`);
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({ timestamps: ['2'], filename: `${reelId}.jpg`, folder: THUMB_DIR, size: '540x960' })
      .on('end', () => resolve(thumbPath))
      .on('error', err => reject(err));
  });
};

module.exports = { renderReel, renderReelSlideshow, generateThumbnail, downloadImage };
