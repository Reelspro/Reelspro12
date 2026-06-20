const path = require('path');
const fs = require('fs');

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const THEMES = {
  dark:      { bg: '#0d0d12', card: '#1a1a2e', border: '#2d2d44', text: '#e8e8f0', highlight: '#7c3aed', highlightText: '#ffffff', username: '#a78bfa', handle: '#6b7280', accent: '#7c3aed' },
  horror:    { bg: '#0a0000', card: '#1a0505', border: '#3d0000', text: '#f0e0e0', highlight: '#cc0000', highlightText: '#ffffff', username: '#ff4444', handle: '#884444', accent: '#cc0000' },
  mystery:   { bg: '#05050f', card: '#0a0a1f', border: '#1a1a3d', text: '#d0d8ff', highlight: '#2244cc', highlightText: '#ffffff', username: '#6688ff', handle: '#445588', accent: '#4466ff' },
  crime:     { bg: '#080808', card: '#111111', border: '#333333', text: '#e0e0e0', highlight: '#555555', highlightText: '#ffffff', username: '#aaaaaa', handle: '#666666', accent: '#888888' },
  emotional: { bg: '#0f080a', card: '#1f1012', border: '#3d2020', text: '#f5e6d0', highlight: '#c2600a', highlightText: '#ffffff', username: '#f0a060', handle: '#886040', accent: '#e07030' },
  suspense:  { bg: '#080812', card: '#0f0f20', border: '#22224a', text: '#d8d8ff', highlight: '#4433aa', highlightText: '#ffffff', username: '#8877dd', handle: '#554488', accent: '#6655cc' },
  tiktok:    { bg: '#000000', card: '#111111', border: '#222222', text: '#ffffff',  highlight: '#00f2ea', highlightText: '#000000', username: '#00f2ea', handle: '#888888', accent: '#fe2c55' },
};

async function generateCardImage({ storyText, theme = 'dark', username = 'Reddit Stories', handle = '@reddit_tales', outputPath, sceneIndex = 0, totalScenes = 1, backgroundImagePath = null, themeData = null, bgOnly = false }) {
  let T = THEMES[theme] || THEMES.dark;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Apply StoryMaker custom styling overrides if present
  let custom = null;
  if (themeData && themeData.storyMakerCustom) {
    custom = themeData;
    T = {
      bg: custom.bg?.color || T.bg,
      card: custom.bg?.cardColor || custom.bg?.color2 || T.card,
      border: custom.bg?.borderColor || custom.bg?.cardColor || custom.bg?.color2 || T.border,
      text: custom.text?.color || T.text,
      highlight: custom.text?.highlight || T.highlight,
      highlightText: T.highlightText,
      username: custom.profile?.color || T.username,
      handle: T.handle,
      accent: custom.profile?.color || T.accent,
    };
    if (custom.profile?.name) username = custom.profile.name;
    if (custom.profile?.subtitle) handle = custom.profile.subtitle;
  }

  // Try canvas library
  let canvas, ctx;
  try {
    const lib = (() => { try { return require('@napi-rs/canvas'); } catch { return require('canvas'); } })();
    const { createCanvas, loadImage } = lib;
    canvas = createCanvas(CANVAS_W, CANVAS_H);
    ctx = canvas.getContext('2d');

    // Background drawing: use Pixabay/Media image if available
    if (backgroundImagePath && fs.existsSync(backgroundImagePath)) {
      try {
        const bgImg = await loadImage(backgroundImagePath);
        const scale = Math.max(CANVAS_W / bgImg.width, CANVAS_H / bgImg.height);
        const bw = bgImg.width * scale, bh = bgImg.height * scale;
        const bx = (CANVAS_W - bw) / 2, by = (CANVAS_H - bh) / 2;
        ctx.drawImage(bgImg, bx, by, bw, bh);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } catch {
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    } else {
      // Draw solid or gradient background
      if (custom && custom.bg?.type === 'Gradient') {
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grad.addColorStop(0, custom.bg?.color || '#0d0d18');
        grad.addColorStop(1, custom.bg?.color2 || '#1a1a2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } else if (custom && custom.bg?.type === 'Solid') {
        ctx.fillStyle = custom.bg?.color || T.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } else {
        // Pure theme gradient background
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        const grd = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/3, 0, CANVAS_W/2, CANVAS_H/3, CANVAS_H*0.7);
        grd.addColorStop(0, T.accent + '55');
        grd.addColorStop(0.5, T.accent + '22');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    }
    
    if (bgOnly) {
      const buf = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buf);
      return outputPath;
    }

    const isTextStoryMode = themeData?.textStoryMode !== false; // default to true

    // Draw card background
    const cx = 55, cy = 260, cw = CANVAS_W - 110, ch = CANVAS_H - 380;
    const cr = custom?.bg?.radius !== undefined ? custom.bg.radius : 32;
    const alpha = custom?.bg?.alpha !== undefined ? (custom.bg.alpha / 100) : 0.95;

    ctx.beginPath();
    ctx.moveTo(cx+cr, cy);
    ctx.lineTo(cx+cw-cr, cy); ctx.quadraticCurveTo(cx+cw, cy, cx+cw, cy+cr);
    ctx.lineTo(cx+cw, cy+ch-cr); ctx.quadraticCurveTo(cx+cw, cy+ch, cx+cw-cr, cy+ch);
    ctx.lineTo(cx+cr, cy+ch); ctx.quadraticCurveTo(cx, cy+ch, cx, cy+ch-cr);
    ctx.lineTo(cx, cy+cr); ctx.quadraticCurveTo(cx, cy, cx+cr, cy);
    ctx.closePath();
    ctx.fillStyle = T.card + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Profile Header Section (if enabled)
    if (custom?.bg?.showProfile !== false) {
      ctx.fillStyle = T.accent + '33';
      ctx.fillRect(cx, cy, cw, 115);

      // Draw avatar
      let avatarDrawn = false;
      if (custom?.profile?.avatar && fs.existsSync(custom.profile.avatar)) {
        try {
          const avImg = await loadImage(custom.profile.avatar);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx + 65, cy + 57, 36, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avImg, cx + 29, cy + 21, 72, 72);
          ctx.restore();
          avatarDrawn = true;
        } catch (_) {}
      }

      if (!avatarDrawn) {
        ctx.beginPath();
        ctx.arc(cx + 65, cy + 57, 36, 0, Math.PI * 2);
        ctx.fillStyle = T.accent;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(username[0].toUpperCase(), cx + 65, cy + 59);
      }

      // Username + handle
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = T.username;
      
      const profFontName = custom?.profile?.font || 'sans-serif';
      const profFontSize = custom?.profile?.size || 34;
      ctx.font = `bold ${profFontSize}px "${profFontName}", sans-serif`;
      ctx.fillText(username, cx + 122, cy + 48);
      
      ctx.fillStyle = T.handle;
      ctx.font = '26px sans-serif';
      ctx.fillText(handle, cx + 122, cy + 84);
    }

    // Story text wraps
    const cardPadding = custom?.bg?.padding !== undefined ? custom.bg.padding : 44;
    const txtX = cx + cardPadding;
    const txtMaxW = cw - (cardPadding * 2);
    const fontSize = isTextStoryMode ? 62 : (custom?.text?.size || 46);
    const lineH = isTextStoryMode ? 86 : (custom?.text?.lineH ? Math.round(custom.text.lineH * fontSize) : 74);
    const fontName = isTextStoryMode ? 'Georgia' : (custom?.text?.font || 'sans-serif');
    const weight = custom?.text?.weight || 'Normal';
    const align = isTextStoryMode ? 'center' : (custom?.text?.align?.toLowerCase() || 'left');

    ctx.font = `${weight === 'Bold' ? 'bold ' : weight === 'Italic' ? 'italic ' : ''}${fontSize}px "${fontName}", sans-serif`;
    ctx.textBaseline = 'top';

    const segs = parseHighlights(storyText);
    const lines = wrapSegments(ctx, segs, txtMaxW);
    
    // Vertically center the text if full page mode
    const totalLines = lines.length;
    const totalTextHeight = totalLines * lineH;
    
    // Available height inside card below profile header: ch - 140
    let txtY = cy + 140;
    if (isTextStoryMode) {
      txtY = cy + 140 + Math.max(0, (ch - 140 - totalTextHeight) / 2);
    }
    
    const maxLines = Math.floor((ch - 150) / lineH);

    let y = txtY;
    for (const line of lines.slice(0, maxLines)) {
      let x = txtX;
      // Handle simple centering or alignment offsets
      if (align === 'center') {
        const lineWidth = line.reduce((acc, seg) => acc + ctx.measureText(seg.text).width, 0);
        x = isTextStoryMode ? (CANVAS_W - lineWidth) / 2 : cx + (cw - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = line.reduce((acc, seg) => acc + ctx.measureText(seg.text).width, 0);
        x = isTextStoryMode ? (CANVAS_W - 80 - lineWidth) : (cx + cw - cardPadding - lineWidth);
      }

      for (const seg of line) {
        const w = ctx.measureText(seg.text).width;
        if (seg.highlight) {
          ctx.fillStyle = T.highlight;
          ctx.fillRect(x - 4, y - 2, w + 8, fontSize + 6);
          ctx.fillStyle = T.highlightText || T.text || '#ffffff';
        } else {
          ctx.fillStyle = T.text;
        }
        ctx.fillText(seg.text, x, y);
        x += w;
      }
      y += lineH;
    }

    // CTA bar footer (if enabled)
    if (!isTextStoryMode && custom?.footer?.show !== false) {
      const ctaY = cy + ch - 82;
      ctx.fillStyle = (custom?.footer?.bgColor || T.accent) + 'cc';
      ctx.beginPath();
      ctx.roundRect(cx + 20, ctaY, cw - 40, 64, 14);
      ctx.fill();
      ctx.fillStyle = custom?.footer?.color || '#ffffff';
      ctx.font = 'bold 27px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(custom?.footer?.text || '📖 Full Story In Comments 👇', CANVAS_W / 2, ctaY + 32);
    }

    // Scene progress dots
    if (!isTextStoryMode) {
      const dotY = CANVAS_H - 95;
      for (let i = 0; i < totalScenes; i++) {
        ctx.beginPath();
        ctx.arc(CANVAS_W/2 - (totalScenes - 1) * 14 + i * 28, dotY, i === sceneIndex ? 9 : 5, 0, Math.PI * 2);
        ctx.fillStyle = i === sceneIndex ? T.accent : T.border;
        ctx.fill();
      }
    }

    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buf);
    return outputPath;

  } catch (e) {
    console.warn('[CardRenderer] Canvas failed, using SVG fallback:', e.message);
    return generateSVGCard({ storyText, theme: T, username, handle, outputPath, sceneIndex, totalScenes });
  }
}

function parseHighlights(text) {
  const parts = [];
  const re = /<highlight>(.*?)<\/highlight>/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), highlight: false });
    parts.push({ text: m[1], highlight: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), highlight: false });
  return parts.length ? parts : [{ text, highlight: false }];
}

function wrapSegments(ctx, segments, maxW) {
  const spW = ctx.measureText(' ').width;
  const lines = [];
  let line = [], lineW = 0;
  for (const seg of segments) {
    const words = seg.text.split(' ').filter(Boolean);
    for (const w of words) {
      const wW = ctx.measureText(w).width;
      const addSp = line.length > 0 ? spW : 0;
      if (lineW + addSp + wW > maxW && line.length > 0) {
        lines.push(line); line = []; lineW = 0;
      }
      if (line.length > 0) { line.push({ text: ' ', highlight: false }); lineW += spW; }
      line.push({ text: w, highlight: seg.highlight });
      lineW += wW;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

async function generateSVGCard({ storyText, theme: T, username, handle, outputPath, sceneIndex, totalScenes }) {
  const clean = storyText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const words = clean.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).length > 36) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());

  const textSVG = lines.slice(0, 18).map((l, i) =>
    `<text x="103" y="${470 + i * 78}" font-family="Arial,sans-serif" font-size="46" fill="${T.text}">${l}</text>`
  ).join('\n');

  const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="${T.bg}"/>
  <rect x="55" y="260" width="970" height="1390" rx="32" fill="${T.card}" stroke="${T.border}" stroke-width="2" fill-opacity="0.95"/>
  <rect x="55" y="260" width="970" height="115" fill="${T.accent}" fill-opacity="0.2"/>
  <circle cx="120" cy="317" r="36" fill="${T.accent}"/>
  <text x="120" y="326" font-family="Arial" font-size="34" font-weight="bold" fill="white" text-anchor="middle">${username[0]}</text>
  <text x="178" y="308" font-family="Arial" font-size="34" font-weight="bold" fill="${T.username}">${username}</text>
  <text x="178" y="346" font-family="Arial" font-size="26" fill="${T.handle}">${handle}</text>
  ${textSVG}
  <rect x="75" y="1558" width="930" height="64" rx="14" fill="${T.accent}" fill-opacity="0.85"/>
  <text x="540" y="1597" font-family="Arial" font-size="27" font-weight="bold" fill="white" text-anchor="middle">Full Story In Comments 👇</text>
  </svg>`;

  const sharp = require('sharp');
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

module.exports = { generateCardImage, THEMES };
