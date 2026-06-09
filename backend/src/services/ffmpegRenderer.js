const child_process = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Promisify child_process.exec and attach to child_process.execPromise as requested
child_process.execPromise = promisify(child_process.exec);
const execPromise = child_process.execPromise;

let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
if (ffmpegPath === 'ffmpeg') {
  try {
    const staticFfmpeg = require('ffmpeg-static');
    if (staticFfmpeg) {
      ffmpegPath = staticFfmpeg;
    }
  } catch (e) {
    // Keep 'ffmpeg' as fallback
  }
}

/**
 * Downloads a remote image url to a local path.
 */
async function downloadImage(url, destPath) {
  try {
    const response = await axios({
      url,
      responseType: 'stream',
      timeout: 15000
    });
    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destPath));
      writer.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  } catch (err) {
    console.error(`[FFmpegRenderer] Image download failed for ${url}:`, err.message);
    return null;
  }
}

/**
 * Sanitizes story text for the FFmpeg drawtext filter to prevent syntax/parser errors.
 */
function sanitizeForDrawtext(text) {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E]/g, '')  // strip non-ASCII
    .replace(/'/g, "\u2019")        // replace single quotes with curly apostrophe
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\\/g, '\\\\');
}

/**
 * Renders a reel video using individual scene card clips.
 * 
 * @param {Object|Array} reelData - Contains scenes array and optional music/voiceover paths.
 * @param {string} outputPath - Path to write the final MP4 video.
 * @param {Object} options - Custom styling options, paths, or progress callbacks.
 */
async function renderReel(reelData, outputPath, options = {}) {
  // Extract inputs robustly to support various call signatures
  let scenes = [];
  if (Array.isArray(reelData)) {
    scenes = reelData;
  } else if (reelData && typeof reelData === 'object') {
    scenes = reelData.scenes || reelData.steps || [];
  }

  const musicPath = options.musicPath || options.music || (reelData && (reelData.musicPath || reelData.music)) || null;
  const voiceoverPath = options.voiceoverPath || options.voiceover || (reelData && (reelData.voiceoverPath || reelData.voiceover)) || null;
  const onProgress = options.onProgress || (reelData && reelData.onProgress) || (() => {});

  if (!scenes || scenes.length === 0) {
    throw new Error('No scenes provided for rendering.');
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tempDir = path.join(outputDir, `temp_render_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const N = scenes.length;
    
    // Step 1: Generate individual scene clips (images or solid colors with text overlay)
    for (let idx = 0; idx < N; idx++) {
      const scene = scenes[idx];
      const duration = typeof scene.duration === 'number' && scene.duration > 0 ? scene.duration : 3.0;
      const clipPath = path.join(tempDir, `clip_${idx}.mp4`);
      
      // Determine background image or color
      let imagePath = scene.image || scene.imagePath || scene.imageUrl || options.backgroundImagePath || options.imagePath || null;
      let bgColor = scene.backgroundColor || scene.color || options.backgroundColor || options.color || 'black';

      // Download remote image URLs
      if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        const downloadPath = path.join(tempDir, `download_${idx}.jpg`);
        const downloaded = await downloadImage(imagePath, downloadPath);
        if (downloaded) {
          imagePath = downloaded;
        } else {
          imagePath = null;
        }
      }

      // Verify local file exists
      if (imagePath && !fs.existsSync(imagePath)) {
        imagePath = null;
      }

      // Wrap text line-by-line
      const cleanText = sanitizeForDrawtext(scene.text || '');
      let drawtextFilters = '';
      if (cleanText) {
        const words = cleanText.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(w => {
          if ((currentLine + w).length > 25) {
            lines.push(currentLine.trim());
            currentLine = w + ' ';
          } else {
            currentLine += w + ' ';
          }
        });
        if (currentLine.trim()) lines.push(currentLine.trim());

        const fontSize = options.fontSize || scene.fontSize || 48;
        const lineHeight = options.lineHeight || scene.lineHeight || Math.round(fontSize * 1.6);
        const fontColor = options.fontColor || scene.fontColor || 'white';
        const boxColor = options.boxColor || scene.boxColor || 'black@0.6';
        
        const totalHeight = lines.length * lineHeight;
        const baseY = `(h-${totalHeight})/2`;

        drawtextFilters = lines.map((line, lineIdx) => {
          const yPos = `${baseY}+${lineIdx * lineHeight}`;
          return `drawtext=text='${line}':fontcolor=${fontColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=${boxColor}:boxborderw=20`;
        }).join(',');
      }

      let cmd;
      if (imagePath) {
        // Render from image: scale & crop to 9:16 vertical 1080x1920
        const scaleFilter = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
        const videoFilterStr = drawtextFilters ? `${scaleFilter},${drawtextFilters}` : scaleFilter;
        cmd = `"${ffmpegPath}" -y -loop 1 -i "${imagePath}" -t ${duration} -r 30 -vf "${videoFilterStr}" -c:v libx264 -pix_fmt yuv420p "${clipPath}"`;
      } else {
        // Render from solid color
        const colorVal = bgColor.startsWith('#') ? bgColor.replace('#', '0x') : bgColor;
        const videoFilterStr = drawtextFilters ? `-vf "${drawtextFilters}"` : '';
        cmd = `"${ffmpegPath}" -y -f lavfi -i color=c=${colorVal}:size=1080x1920:d=${duration}:r=30 ${videoFilterStr} -c:v libx264 -pix_fmt yuv420p "${clipPath}"`;
      }

      await execPromise(cmd);
      if (typeof onProgress === 'function') {
        onProgress(Math.round(((idx + 1) / N) * 60));
      }
    }

    // Step 2: Concatenate scene clips
    const listPath = path.join(tempDir, 'concat_list.txt');
    const listContent = scenes.map((_, idx) => `file 'clip_${idx}.mp4'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    const concatVideoPath = path.join(tempDir, 'concat_video.mp4');
    const concatCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${listPath}" -c copy "${concatVideoPath}"`;
    await execPromise(concatCmd);
    
    if (typeof onProgress === 'function') {
      onProgress(80);
    }

    // Step 3: Background music and voiceover mixing
    const hasMusic = musicPath && typeof musicPath === 'string' && fs.existsSync(musicPath);
    const hasVoice = voiceoverPath && typeof voiceoverPath === 'string' && fs.existsSync(voiceoverPath);

    let mixCmd;
    if (hasMusic && hasVoice) {
      mixCmd = `"${ffmpegPath}" -y -i "${concatVideoPath}" -i "${musicPath}" -i "${voiceoverPath}" -filter_complex "[1:a]volume=0.18[bgm];[2:a]volume=1.8[voice];[bgm][voice]amix=inputs=2:duration=first[a_out]" -map 0:v -map "[a_out]" -c:v copy -c:a aac -shortest "${outputPath}"`;
    } else if (hasMusic) {
      mixCmd = `"${ffmpegPath}" -y -i "${concatVideoPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.5[a_out]" -map 0:v -map "[a_out]" -c:v copy -c:a aac -shortest "${outputPath}"`;
    } else if (hasVoice) {
      mixCmd = `"${ffmpegPath}" -y -i "${concatVideoPath}" -i "${voiceoverPath}" -filter_complex "[1:a]volume=1.5[a_out]" -map 0:v -map "[a_out]" -c:v copy -c:a aac -shortest "${outputPath}"`;
    } else {
      // Create silent audio track
      mixCmd = `"${ffmpegPath}" -y -i "${concatVideoPath}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -shortest "${outputPath}"`;
    }

    await execPromise(mixCmd);
    
    if (typeof onProgress === 'function') {
      onProgress(100);
    }

    return outputPath;
  } catch (err) {
    throw new Error(`FFmpeg Render Pipeline failed: ${err.message}`);
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error('[FFmpegRenderer] Temp cleanup error:', cleanupErr.message);
    }
  }
}

module.exports = {
  renderReel
};
