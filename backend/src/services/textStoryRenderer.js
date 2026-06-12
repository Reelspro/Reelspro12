/**
 * textStoryRenderer.js
 *
 * Renders Facebook-style "A Text Story" viral reels.
 * Uses @napi-rs/canvas to draw each frame as PNG, then
 * encodes to MP4 via FFmpeg.
 *
 * Output: 1080 × 1920 (9:16), 30fps, H.264 + AAC
 */

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execCb = require('child_process').exec;
const execPromise = promisify(execCb);

/* ─── FFmpeg path ──────────────────────────────────── */
let ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
if (process.pkg) {
  const localFFmpeg = path.join(path.dirname(process.execPath), 'ffmpeg.exe');
  if (fs.existsSync(localFFmpeg)) {
    ffmpegPath = localFFmpeg;
  }
} else {
  try {
    const st = require('ffmpeg-static');
    if (st) ffmpegPath = st;
  } catch (_) {}
}

/* ─── Constants ────────────────────────────────────── */
const W = 1080;
const H = 1920;
const HEADER_H = 120;
const FOOTER_H = 70;
const PAD = 36;
const BODY_TOP = HEADER_H + 20;
const BODY_BOTTOM = H - FOOTER_H - 20;

/* ─── Pastel backgrounds ───────────────────────────── */
const BACKGROUNDS = [
  { id: 'pink_floral',   color: '#FFE4E8' },
  { id: 'lavender_dots', color: '#F0EAF8' },
  { id: 'cream_leaves',  color: '#FFF8E7' },
  { id: 'sky_stars',     color: '#E8F4FD' },
  { id: 'peach_hearts',  color: '#FFE8D6' },
  { id: 'mint_waves',    color: '#E8F8F2' },
  { id: 'yellow_glow',   color: '#FFFDE7' },
  { id: 'gray_marble',   color: '#F5F5F5' },
];

const ACCENT_COLORS = ['#B22222', '#CC3300', '#E65100', '#C2185B', '#00796B'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Pattern drawing helpers ──────────────────────── */
function drawSubtlePattern(ctx, patternId, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.055;

  switch (patternId) {
    case 'pink_floral':
    case 'peach_hearts': {
      // Tiny hearts grid
      ctx.fillStyle = '#C2185B';
      for (let x = 60; x < w; x += 120) {
        for (let y = 60; y < h; y += 120) {
          drawHeart(ctx, x, y, 10);
        }
      }
      break;
    }
    case 'lavender_dots':
    case 'gray_marble': {
      // Dots
      ctx.fillStyle = '#7B1FA2';
      for (let x = 50; x < w; x += 80) {
        for (let y = 50; y < h; y += 80) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'sky_stars': {
      // Stars
      ctx.fillStyle = '#1565C0';
      for (let x = 60; x < w; x += 100) {
        for (let y = 60; y < h; y += 100) {
          drawStar(ctx, x, y, 5, 3);
        }
      }
      break;
    }
    case 'mint_waves': {
      // Wavy horizontal lines
      ctx.strokeStyle = '#00897B';
      ctx.lineWidth = 2;
      for (let y = 40; y < h; y += 60) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const yy = y + Math.sin(x / 30) * 6;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      break;
    }
    case 'cream_leaves': {
      // Leaf ellipses
      ctx.fillStyle = '#388E3C';
      for (let x = 80; x < w; x += 140) {
        for (let y = 80; y < h; y += 140) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      break;
    }
    case 'yellow_glow': {
      // Sun rays from top-right corner
      ctx.strokeStyle = '#F57F17';
      ctx.lineWidth = 1.5;
      for (let angle = -30; angle < 60; angle += 8) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(w, 0);
        ctx.lineTo(w + Math.cos(rad) * 800, Math.sin(rad) * 800);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function drawHeart(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r / 2);
  ctx.bezierCurveTo(cx, cy, cx - r, cy, cx - r, cy - r / 2);
  ctx.bezierCurveTo(cx - r, cy - r * 1.5, cx, cy - r * 1.5, cx, cy - r);
  ctx.bezierCurveTo(cx, cy - r * 1.5, cx + r, cy - r * 1.5, cx + r, cy - r / 2);
  ctx.bezierCurveTo(cx + r, cy, cx, cy, cx, cy + r / 2);
  ctx.fill();
}

function drawStar(ctx, cx, cy, outerR, innerR) {
  const spikes = 5;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

/* ─── Text helpers ─────────────────────────────────── */

/**
 * Wraps text and returns array of lines.
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws a single text segment with wrapping. Returns next Y position.
 */
function drawWrappedSegment(ctx, text, x, y, maxWidth, lineH) {
  const lines = wrapText(ctx, text, maxWidth);
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}

/* ─── Avatar placeholder ───────────────────────────── */
function drawAvatarPlaceholder(ctx, x, y, r, initials) {
  // Circle fill
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  grad.addColorStop(0, '#7C4DFF');
  grad.addColorStop(1, '#2C0A0A');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Initials text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(r * 0.8)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((initials || 'S').toUpperCase().substring(0, 2), x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

/* ─── Header ───────────────────────────────────────── */
function drawHeader(ctx, config) {
  const avatarR = 30;
  const avatarX = PAD + avatarR;
  const avatarY = 30 + avatarR;

  // Avatar circle
  const initials = (config.username || 'S').substring(0, 2);
  drawAvatarPlaceholder(ctx, avatarX, avatarY, avatarR, initials);

  const textX = PAD + avatarR * 2 + 18;

  // Username
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 30px Arial';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(config.username || 'Story User', textX, 52);

  // Timestamp
  ctx.fillStyle = '#666666';
  ctx.font = '24px Arial';
  ctx.fillText('2hrs ago \u2022 \uD83D\uDC65', textX, 80);

  // "A Text Story"
  ctx.fillStyle = '#888888';
  ctx.font = '22px Arial';
  ctx.fillText('A Text Story', textX, 106);

  // Separator line
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER_H);
  ctx.lineTo(W - PAD, HEADER_H);
  ctx.stroke();
}

/* ─── Footer ───────────────────────────────────────── */
function drawFooter(ctx, footerText) {
  // Dark maroon bar
  ctx.fillStyle = '#2C0A0A';
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);

  // White text centered
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(footerText || 'Full Story In First Comment \uD83D\uDC47', W / 2, H - FOOTER_H / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/* ─── Main frame renderer ──────────────────────────── */
/**
 * Renders a single 1080×1920 PNG frame.
 * @param {object} config
 *   - backgroundColor: hex string e.g. '#FFE4E8'
 *   - patternId: string id for pattern
 *   - accentColor: hex string e.g. '#B22222'
 *   - username: string
 *   - textSegments: array of {text, style: 'normal'|'accent'|'quote'|'cta'}
 *   - footerText: string
 * @returns Buffer (PNG)
 */
function renderStoryFrame(config) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1. Pastel background
  ctx.fillStyle = config.backgroundColor || '#FFE4E8';
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle decorative pattern
  drawSubtlePattern(ctx, config.patternId || 'pink_floral', W, H);

  // 3. Header
  drawHeader(ctx, config);

  // 4. Body text segments
  const FONT_SIZE = 44;
  const LINE_H = Math.round(FONT_SIZE * 1.45);
  const maxTextW = W - PAD * 2;
  let y = BODY_TOP + FONT_SIZE; // first baseline

  const accentColor = config.accentColor || '#B22222';
  const segments = config.textSegments || [];

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    const style = seg.style || 'normal';
    const isCTA = style === 'cta';

    // Stop if we've hit the footer zone
    if (y > BODY_BOTTOM - FONT_SIZE) break;

    if (isCTA) {
      // Right-aligned accent "Read More....."
      ctx.font = `900 40px Arial`;
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'right';
      // Place CTA 2 lines from bottom of body
      const ctaY = Math.max(y + LINE_H, BODY_BOTTOM - LINE_H);
      ctx.fillText(seg.text || 'Read More.....', W - PAD, ctaY);
      ctx.textAlign = 'left';
      y = ctaY + LINE_H;
      continue;
    }

    if (style === 'accent' || style === 'quote') {
      ctx.font = `900 ${FONT_SIZE}px Arial`;
      ctx.fillStyle = accentColor;
    } else {
      ctx.font = `900 ${FONT_SIZE}px Arial`;
      ctx.fillStyle = '#1A1A1A';
    }

    y = drawWrappedSegment(ctx, seg.text || '', PAD, y, maxTextW, LINE_H);

    // Extra gap between segments (paragraph spacing)
    if (si < segments.length - 1 && segments[si + 1]?.style !== 'cta') {
      y += Math.round(LINE_H * 0.35);
    }
  }

  // 5. Footer
  drawFooter(ctx, config.footerText);

  return canvas.toBuffer('image/png');
}

/* ─── Build per-scene configs ──────────────────────── */
/**
 * Converts a script's scenes array into per-frame configs.
 * Each scene gets a "page" of text segments derived from its text.
 */
function buildSceneConfigs(scenes, globalStyle) {
  return scenes.map((scene, idx) => {
    // For CTA scene, show the footer message prominently
    if (scene.type === 'cta') {
      return {
        ...globalStyle,
        textSegments: [
          { text: 'Read More.....', style: 'cta' }
        ],
      };
    }

    // Detect if scene text has quotes → accent
    const rawText = scene.text || '';
    const segments = [];

    // Simple quote detection: split on "..."
    const quoteRe = /"([^"]+)"/g;
    let lastIdx = 0;
    let match;
    while ((match = quoteRe.exec(rawText)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ text: rawText.slice(lastIdx, match.index), style: 'normal' });
      }
      segments.push({ text: `"${match[1]}"`, style: 'quote' });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < rawText.length) {
      segments.push({ text: rawText.slice(lastIdx), style: 'normal' });
    }

    if (segments.length === 0) {
      segments.push({ text: rawText, style: 'normal' });
    }

    // Apply accent to hook type scenes
    if (scene.type === 'hook' || scene.type === 'cliffhanger') {
      segments.forEach(s => { if (s.style === 'normal') s.style = 'accent'; });
    }

    return {
      ...globalStyle,
      textSegments: segments,
    };
  });
}

/* ─── Full render pipeline ─────────────────────────── */
/**
 * Renders a complete Facebook Text Story reel.
 *
 * @param {object} reelData  - { scenes, textSegments, background, accentColor, username, footerText }
 * @param {string} outputPath - Absolute path for final .mp4
 * @param {object} options    - { musicPath, voiceoverPath, onProgress }
 */
async function renderTextStoryReel(reelData, outputPath, options = {}) {
  const onProgress = options.onProgress || (() => {});

  // Pull scenes
  let scenes = [];
  if (Array.isArray(reelData)) scenes = reelData;
  else if (reelData && reelData.scenes) scenes = reelData.scenes;
  if (!scenes.length) throw new Error('No scenes provided');

  const musicPath = options.musicPath || null;
  const voiceoverPath = options.voiceoverPath || null;

  // Pick global style (random if not specified)
  const bgChoice = pickRandom(BACKGROUNDS);
  const accentColor = reelData.accentColor || pickRandom(ACCENT_COLORS);
  const globalStyle = {
    backgroundColor: reelData.backgroundColor || bgChoice.color,
    patternId: reelData.patternId || bgChoice.id,
    accentColor,
    username: reelData.username || 'Story User',
    footerText: reelData.footerText || 'Full Story In First Comment \uD83D\uDC47',
  };

  // Build per-scene configs
  let sceneConfigs;
  if (reelData.textSegments) {
    // Single page story — render same segments on all scenes
    sceneConfigs = scenes.map(() => ({ ...globalStyle, textSegments: reelData.textSegments }));
  } else {
    sceneConfigs = buildSceneConfigs(scenes, globalStyle);
  }

  // Create temp dir
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });
  const tempDir = path.join(outputDir, `ts_render_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const N = scenes.length;
    const clipPaths = [];

    for (let i = 0; i < N; i++) {
      const scene = scenes[i];
      const config = sceneConfigs[i];
      const duration = typeof scene.duration === 'number' && scene.duration > 0 ? scene.duration : 3.0;

      // Render frame PNG
      const framePath = path.join(tempDir, `frame_${i}.png`);
      const frameBuffer = renderStoryFrame(config);
      fs.writeFileSync(framePath, frameBuffer);

      // Encode frame to clip
      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      const encCmd = `"${ffmpegPath}" -y -loop 1 -i "${framePath}" -t ${duration} -r 30 -vf "scale=1080:1920" -c:v libx264 -pix_fmt yuv420p -preset fast "${clipPath}"`;
      await execPromise(encCmd);

      clipPaths.push(clipPath);
      onProgress(Math.round(((i + 1) / N) * 65));
    }

    // Concatenate clips
    const listPath = path.join(tempDir, 'concat.txt');
    fs.writeFileSync(listPath, clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

    const concatPath = path.join(tempDir, 'concat_video.mp4');
    await execPromise(`"${ffmpegPath}" -y -f concat -safe 0 -i "${listPath}" -c copy "${concatPath}"`);
    onProgress(80);

    // Audio mixing with SFX support
    const SFX_BASE = process.pkg
      ? path.join(path.dirname(process.execPath), 'assets/sfx')
      : path.resolve(__dirname, '../../assets/sfx');

    const hasMusic = musicPath && fs.existsSync(musicPath);
    const hasVoice = voiceoverPath && fs.existsSync(voiceoverPath);

    // Collect valid SFX files
    const selectedSfx = Array.isArray(reelData.sfx) ? reelData.sfx : [];
    const validSfx = [];
    selectedSfx.forEach(sfxName => {
      const filename = sfxName.endsWith('.mp3') ? sfxName : `${sfxName}.mp3`;
      const sfxFilePath = path.join(SFX_BASE, filename);
      if (fs.existsSync(sfxFilePath)) {
        validSfx.push({ name: sfxName, filePath: sfxFilePath });
      }
    });

    let audioCmd = `"${ffmpegPath}" -y -i "${concatPath}"`;
    const inputArgs = [];
    const filterComplexParts = [];
    const mixInputs = [];
    let currentInputIdx = 1; // 0 is video (concatPath)

    if (hasMusic) {
      inputArgs.push(`-i "${musicPath}"`);
      const musicIdx = currentInputIdx++;
      filterComplexParts.push(`[${musicIdx}:a]volume=0.55,afade=t=in:d=2,afade=t=out:st=${getTotalDuration(scenes) - 2}:d=2[bgm]`);
      mixInputs.push('[bgm]');
    }

    if (hasVoice) {
      inputArgs.push(`-i "${voiceoverPath}"`);
      const voiceIdx = currentInputIdx++;
      filterComplexParts.push(`[${voiceIdx}:a]volume=1.5[voice]`);
      mixInputs.push('[voice]');
    }

    // Add and delay SFX files
    validSfx.forEach((sfxItem, idx) => {
      inputArgs.push(`-i "${sfxItem.filePath}"`);
      const sfxIdx = currentInputIdx++;
      
      // Delay timings:
      // typing_sfx -> 0ms (starts immediately)
      // page_whoosh -> 5000ms (at screen transition)
      // violin_sting -> 5000ms (climax transition)
      // crowd_gasp -> 2500ms (tension point)
      // heartbeat_sfx -> 0ms (starts immediately)
      let delayMs = 0;
      if (sfxItem.name.includes('whoosh') || sfxItem.name.includes('sting')) {
        delayMs = 5000;
      } else if (sfxItem.name.includes('gasp')) {
        delayMs = 2500;
      }

      filterComplexParts.push(`[${sfxIdx}:a]volume=0.9,adelay=${delayMs}|${delayMs}[sfx_${idx}]`);
      mixInputs.push(`[sfx_${idx}]`);
    });

    if (mixInputs.length > 0) {
      const filterStr = filterComplexParts.join(';');
      const amixStr = `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first[a_out]`;
      
      audioCmd += ` ${inputArgs.join(' ')} -filter_complex "${filterStr}${filterStr ? ';' : ''}${amixStr}" -map 0:v -map "[a_out]" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`;
    } else {
      // No music, voice, or SFX -> output silent audio track
      audioCmd += ` -f lavfi -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`;
    }

    await execPromise(audioCmd);
    onProgress(100);

    return outputPath;

  } finally {
    // Cleanup temp
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
}

function getTotalDuration(scenes) {
  return scenes.reduce((sum, s) => sum + (s.duration || 3), 0);
}

module.exports = {
  renderTextStoryReel,
  renderStoryFrame,
  buildSceneConfigs,
  BACKGROUNDS,
  ACCENT_COLORS,
  pickRandom,
};
