# ReelsPro Ultimate v12 — BUILD STATUS
# ✅ = Already Built | ❌ = Missing / Needs Build | 🔧 = Partially Built
# Last Updated: After Cursor Pass 1

You are a senior SaaS architect, AI automation engineer, cinematic video pipeline engineer, analytics engineer, and scalable backend developer.

Build a COMPLETE production-ready SaaS platform called ReelsPro.

---

# WHAT CURSOR ALREADY BUILT — DO NOT REBUILD:

✅ User auth (JWT, login, register, approval flow)
✅ Admin user approval system (approve/reject/suspend)
✅ Website source + category management (admin only)
✅ Article scraping engine (Cheerio + RSS parser)
✅ Article pool with cooldown + virality score
✅ Random article distribution with Redis locking
✅ Basic reels table structure
✅ Basic clicks table structure
✅ BullMQ + Redis setup
✅ Frontend routing (React Router v6)
✅ Basic admin pages structure
✅ Tailwind + Vite + Zustand + Recharts
✅ platformDetector.js (Facebook/Instagram/TikTok/YouTube/Pinterest/Telegram/WhatsApp/Twitter/Snapchat/Direct)
✅ activityLogService.js (reel queued/downloaded/status change logs)
✅ Admin APIs: /api/admin/analytics, /analytics/export, /queues
✅ Richer /overview API (active users, downloads, campaigns)
✅ Enhanced click feed (user name, email, category)
✅ User detail API (clicks over time, country/device breakdown, top categories, activity logs)
✅ URL campaigns API: GET /api/reels/campaigns
✅ Configurable article_cooldown_minutes in system_settings
✅ Frontend route /shortener (URL Shortener & campaigns page)
✅ Frontend route /admin/analytics (Global analytics + export)
✅ Frontend route /admin/live-clicks (Full live click feed)
✅ Frontend route /admin/logs (System activity logs)
✅ Frontend route /admin/queues (BullMQ queue monitor)
✅ Admin Dashboard updated (more stats + module links)
✅ User Details updated (charts, countries, devices, logs)
✅ System Settings updated (cooldown field)
✅ Dashboard updated (Short Links button)
✅ Music folders created: backend/assets/music/{horror,mystery,emotional,crime,shocking,suspense,funny,motivational}/

---

# WHAT STILL NEEDS TO BE BUILT — IN THIS EXACT ORDER

---

## 🔴 PHASE A — DATABASE MIGRATIONS

File to update: backend/src/config/migrate.js

Add these 4 missing tables:

CREATE TABLE IF NOT EXISTS utm_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  reel_id TEXT,
  user_id INTEGER,
  utm_source TEXT,
  utm_medium TEXT DEFAULT 'social',
  utm_campaign TEXT,
  campaign_token TEXT UNIQUE,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reel_scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reel_id TEXT NOT NULL,
  article_id INTEGER,
  scenes_json TEXT,
  caption TEXT,
  hashtags TEXT,
  cta_text TEXT DEFAULT '📖 Full Read Story Details In Comments 👇',
  ai_provider TEXT,
  ai_model TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id)
);

CREATE TABLE IF NOT EXISTS music_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  category TEXT NOT NULL,
  emotion TEXT,
  duration REAL,
  file_path TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS render_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reel_id TEXT NOT NULL,
  user_id INTEGER,
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id)
);

Add these missing columns to existing tables
(use try/catch around each ALTER TABLE — SQLite may error if column exists):

-- articles table:
ALTER TABLE articles ADD COLUMN content TEXT;
ALTER TABLE articles ADD COLUMN og_image TEXT;
ALTER TABLE articles ADD COLUMN metadata TEXT;

-- reels table:
ALTER TABLE reels ADD COLUMN theme TEXT DEFAULT 'suspense';
ALTER TABLE reels ADD COLUMN hashtags TEXT;
ALTER TABLE reels ADD COLUMN music_file TEXT;
ALTER TABLE reels ADD COLUMN scenes_json TEXT;
ALTER TABLE reels ADD COLUMN render_progress INTEGER DEFAULT 0;
ALTER TABLE reels ADD COLUMN duration INTEGER DEFAULT 10;

-- clicks table:
ALTER TABLE clicks ADD COLUMN source_category TEXT;
ALTER TABLE clicks ADD COLUMN utm_source TEXT;
ALTER TABLE clicks ADD COLUMN utm_campaign TEXT;

-- website_sources table:
ALTER TABLE website_sources ADD COLUMN is_active BOOLEAN DEFAULT 1;
ALTER TABLE website_sources ADD COLUMN last_scraped DATETIME;
ALTER TABLE website_sources ADD COLUMN article_count INTEGER DEFAULT 0;
ALTER TABLE website_sources ADD COLUMN scrape_interval INTEGER DEFAULT 3600;

---

## 🔴 PHASE B — ARTICLE CONTENT SCRAPING FIX

File to update: backend/src/services/scraper_service.js
(or wherever Cheerio scraping happens)

Current scraper saves only: title, image, url
It MUST also save: content, og_image, metadata

Add to scraping logic:

1. Extract full article body text:
   - Try selectors in order: article, .post-content, .entry-content, .article-body, main p
   - Join all paragraph text
   - Store in articles.content

2. Extract OpenGraph image:
   - $('meta[property="og:image"]').attr('content')
   - Store in articles.og_image

3. Extract metadata:
   - description: $('meta[name="description"]').attr('content')
   - keywords: $('meta[name="keywords"]').attr('content')
   - Store as JSON string in articles.metadata

CRITICAL: Without articles.content, AI cannot generate suspense scenes.
Also re-scrape existing 105 articles to populate content field.

---

## 🔴 PHASE C — AI PROVIDER ROTATION SYSTEM

Create file: backend/src/services/ai_provider_service.js

Priority order:
1. User's own API key (api_keys table WHERE owner_id = userId AND provider = X)
2. Admin's API key (api_keys table WHERE type = 'admin' AND provider = X)
3. System pool rotation (try all providers)
4. Local fallback templates (NEVER throw error)

Functions to build:

async function getAvailableProvider(userId) {}
async function callGroq(prompt, model, apiKey) {}
  // endpoint: https://api.groq.com/openai/v1/chat/completions
  // models: llama-3-70b-8192, mixtral-8x7b-32768

async function callGemini(prompt, model, apiKey) {}
  // endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  // models: gemini-1.5-flash, gemini-2.0-flash

async function callOpenRouter(prompt, model, apiKey) {}
  // endpoint: https://openrouter.ai/api/v1/chat/completions
  // use free tier models

async function callHuggingFace(prompt, model, apiKey) {}
  // endpoint: https://api-inference.huggingface.co/models/{model}

function fallbackToTemplate(articleTitle, emotion) {
  // return hardcoded suspense scenes based on emotion
  // NEVER throw — this is the last resort
}

async function rotateOnQuotaExceeded(failedProvider, userId) {
  // mark provider as temporarily unavailable
  // try next provider in priority list
}

RULE: Wrap every provider call in try/catch.
If ALL providers fail → call fallbackToTemplate().
NEVER let reel generation crash because of AI failure.

---

## 🔴 PHASE D — REEL SCRIPT ENGINE

Create file: backend/src/services/reel_script_service.js

async function generateSuspenseScenes(articleTitle, articleContent, emotion, userId) {
  const prompt = `
    You are a viral suspense reel writer.
    Convert this article into exactly 5 short suspense scenes for a 10-second video reel.
    
    Article Title: ${articleTitle}
    Article Content: ${articleContent.substring(0, 1000)}
    Emotion: ${emotion}
    
    Rules:
    - Each scene: maximum 8 words
    - Scene 1: Shocking hook (grab attention instantly)
    - Scene 2-3: Suspense buildup (short punchy facts)
    - Scene 4: Cliffhanger (leave them wanting more)
    - Scene 5: Always exactly → "📖 Full Read Story Details In Comments 👇"
    - Tone: dark, cinematic, suspenseful
    - NO full sentences. Short. Punchy. Dramatic.
    
    Return ONLY valid JSON, no explanation:
    {
      "scenes": [
        {"id": 1, "type": "hook", "text": "...", "duration": 2.0},
        {"id": 2, "type": "beat", "text": "...", "duration": 2.0},
        {"id": 3, "type": "beat", "text": "...", "duration": 2.0},
        {"id": 4, "type": "cliffhanger", "text": "...", "duration": 2.0},
        {"id": 5, "type": "cta", "text": "📖 Full Read Story Details In Comments 👇", "duration": 2.0}
      ]
    }
  `;
  // call ai_provider_service.getAvailableProvider(userId)
  // parse JSON response
  // return scenes array
}

function generateCaption(scenes, category, articleTitle) {
  // combine scene texts into engaging caption
  // add article title reference
  // return string
}

function generateHashtags(category, emotion) {
  // return 25 relevant hashtags as array
  // mix: category-specific + viral + general
}

function generateCTA() {
  return '📖 Full Read Story Details In Comments 👇';
}

function calculateSceneTiming(scenes) {
  // ensure total duration = exactly 10 seconds
  // distribute evenly if needed
  // CTA scene minimum 2 seconds
}

After generation: save to reel_scripts table.
Return full script object with scenes, caption, hashtags, timing.

---

## 🔴 PHASE E — MUSIC ENGINE

Create file: backend/src/services/music_engine.js

Music folders already exist at: backend/assets/music/{category}/
Admin adds .mp3 files to these folders manually.

const EMOTION_KEYWORDS = {
  horror:      ['murder', 'dead', 'kill', 'blood', 'death', 'body', 'ghost', 'haunted', 'terrifying'],
  mystery:     ['missing', 'vanished', 'secret', 'unknown', 'disappeared', 'hidden', 'strange'],
  crime:       ['arrested', 'police', 'stolen', 'robbery', 'criminal', 'gang', 'fraud', 'scam'],
  emotional:   ['family', 'mother', 'child', 'love', 'heartbreak', 'tears', 'cancer', 'died'],
  shocking:    ['caught', 'exposed', 'leaked', 'scandal', 'shocking', 'unbelievable', 'viral'],
  suspense:    ['thriller', 'chase', 'escape', 'trap', 'danger', 'warning', 'attack'],
  funny:       ['funny', 'hilarious', 'comedy', 'laugh', 'prank', 'joke'],
  motivational:['success', 'rich', 'million', 'business', 'inspire', 'achieve']
};

function detectEmotion(title, content) {
  // lowercase title + first 500 chars of content
  // count keyword matches per emotion category
  // return emotion with highest match count
  // default: 'suspense' if no match
}

function matchSoundtrack(emotion) {
  // scan backend/assets/music/{emotion}/ folder with fs.readdirSync
  // filter .mp3 and .wav files
  // if folder empty → try 'suspense' folder as fallback
  // if still empty → return null (reel renders without music)
  // pick file with lowest use_count from music_library table
  // return { filePath, filename, emotion }
}

async function scanMusicLibrary() {
  // scan ALL /assets/music/ subfolders on startup
  // for each .mp3/.wav file found:
  //   INSERT OR IGNORE INTO music_library (filename, category, file_path)
  // log: "Music library scanned: X tracks found"
}

function prepareMusicConfig(filePath, reelDuration) {
  return {
    inputPath: filePath,
    duration: reelDuration,
    fadeIn: 0.5,
    fadeOut: 1.0,
    volume: 0.7,
    // FFmpeg filter: afade=in:d=0.5,afade=out:st=${reelDuration-1}:d=1,volume=0.7
  };
}

Call scanMusicLibrary() when Express server starts.

---

## 🔴 PHASE F — REMOTION COMPOSITIONS

Install: npm install @remotion/core @remotion/player @remotion/renderer remotion
(install in frontend folder)

Create folder structure:
frontend/src/remotion/
├── Root.tsx
├── index.ts
├── types.ts
└── compositions/
    ├── ReelComposition.tsx
    ├── SceneLayer.tsx
    ├── SubtitleLayer.tsx
    ├── OverlayLayer.tsx
    ├── CTAScene.tsx
    └── themes.ts

### types.ts
```typescript
export interface Scene {
  id: number;
  type: 'hook' | 'beat' | 'cliffhanger' | 'cta';
  text: string;
  duration: number; // seconds
}

export interface ThemeConfig {
  overlayColor: string;
  textColor: string;
  grainOpacity: number;
  glowColor: string;
}

export interface CustomizationOptions {
  subtitleColor?: string;
  subtitleSize?: number;
  overlayOpacity?: number;
  glowIntensity?: number;
  zoomSpeed?: number;
  grainOpacity?: number;
}

themes.ts
export const themes: Record<string, ThemeConfig> = {
  horror:    { overlayColor: '#1a0000cc', textColor: '#ff3333', grainOpacity: 0.4, glowColor: '#ff0000' },
  mystery:   { overlayColor: '#00001acc', textColor: '#6699ff', grainOpacity: 0.3, glowColor: '#0044ff' },
  crime:     { overlayColor: '#0d0d0dcc', textColor: '#ffffff', grainOpacity: 0.5, glowColor: '#888888' },
  emotional: { overlayColor: '#1a0a00cc', textColor: '#ffcc88', grainOpacity: 0.1, glowColor: '#ff8800' },
  tiktok:    { overlayColor: '#000000aa', textColor: '#00f2ea', grainOpacity: 0.0, glowColor: '#00f2ea' },
  dark:      { overlayColor: '#000000dd', textColor: '#cccccc', grainOpacity: 0.6, glowColor: '#ffffff' },
};


ReelComposition.tsx
Width: 1080, Height: 1920, FPS: 30, Duration: 300 frames (10 seconds)
Loop through scenes array
Each scene takes (scene.duration * 30) frames
Render: SceneLayer + OverlayLayer + SubtitleLayer stacked
Last scene (type=cta): render CTAScene instead
SceneLayer.tsx
Full size background image (article image URL)
Ken Burns effect: interpolate({ frame, from: 0, to: sceneDuration, outputRange: [1.0, 1.08] // scale })
objectFit: cover
SubtitleLayer.tsx
spring() entrance animation (slide up + fade in)
Text positioned bottom 25% of frame
Font: bold, large, with text-shadow
Use theme textColor
Exit: opacity fade last 6 frames of scene
OverlayLayer.tsx
Bottom gradient: linear-gradient(transparent, theme.overlayColor)
Vignette: radial-gradient(ellipse, transparent 50%, rgba(0,0,0,0.6) 100%)
Film grain: animated noise (use CSS or canvas technique)
Apply theme glowColor as subtle glow on subtitle area
CTAScene.tsx
Black background
Center text: "📖 Full Read Story Details In Comments 👇"
spring() animation: slide up from y+50 to y=0, fade in
Text color: white, large bold font


Root.tsx
import { Composition } from 'remotion';
import { ReelComposition } from './compositions/ReelComposition';

export const RemotionRoot = () => (
  <Composition
    id="ReelComposition"
    component={ReelComposition}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      scenes: [],
      theme: 'suspense',
      articleImageUrl: '',
    }}
  />
);

🔴 PHASE G — FFMPEG RENDER PIPELINE
Install in backend: npm install fluent-ffmpeg ffmpeg-static

Create: backend/storage/reels/ (folder) Create: backend/storage/thumbnails/ (folder)

Add to backend server: app.use('/storage', express.static('storage'))

Create file: backend/src/services/render_service.js

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

async function renderReel({ reelId, scenesJson, musicPath, theme, articleImageUrl }) {
  const tempDir = path.join(__dirname, '../../temp', reelId);
  const outputPath = path.join(__dirname, '../../storage/reels', `${reelId}.mp4`);
  const thumbPath = path.join(__dirname, '../../storage/thumbnails', `${reelId}.jpg`);

  // Step 1: Create temp dir
  fs.mkdirSync(tempDir, { recursive: true });

  // Step 2: Write props JSON for Remotion
  const propsPath = path.join(tempDir, 'props.json');
  fs.writeFileSync(propsPath, JSON.stringify({ scenes: scenesJson, theme, articleImageUrl }));

  // Step 3: Remotion render frames
  await execPromise(
    `npx remotion render ReelComposition ${tempDir}/frames/ --props="${propsPath}" --config=remotion.config.ts`,
    { cwd: path.join(__dirname, '../../../frontend') }
  );

  // Step 4: FFmpeg — combine frames + audio → MP4
  await new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(`${tempDir}/frames/%04d.png`)
      .inputOptions(['-framerate 30'])
      .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-movflags +faststart', '-pix_fmt yuv420p']);

    if (musicPath && fs.existsSync(musicPath)) {
      cmd.input(musicPath)
         .audioCodec('aac')
         .audioBitrate('128k')
         .audioFilters(`afade=in:d=0.5,afade=out:st=9:d=1,volume=0.7`)
         .outputOptions(['-shortest']);
    }

    cmd.output(outputPath).on('end', resolve).on('error', reject).run();
  });

  // Step 5: Generate thumbnail at 2 second mark
  await new Promise((resolve, reject) => {
    ffmpeg(outputPath)
      .screenshots({ timestamps: ['00:00:02'], filename: `${reelId}.jpg`, folder: path.dirname(thumbPath) })
      .on('end', resolve).on('error', reject);
  });

  // Step 6: Cleanup temp frames
  fs.rmSync(tempDir, { recursive: true, force: true });

  return { outputPath, thumbPath };
}

Create file: backend/src/workers/render_worker.js

const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const renderService = require('../services/render_service');
const { getIO } = require('../services/socket_service');
const db = require('../config/db');

const renderWorker = new Worker('renderQueue', async (job) => {
  const { reelId, userId, scenesJson, musicPath, theme, articleImageUrl } = job.data;

  try {
    // Update DB: rendering started
    db.prepare("UPDATE reels SET status='rendering', render_progress=10 WHERE id=?").run(reelId);
    db.prepare("UPDATE render_jobs SET status='processing', started_at=CURRENT_TIMESTAMP WHERE reel_id=?").run(reelId);

    // Emit progress 10%
    getIO().emit('render_progress', { reelId, userId, progress: 10, status: 'rendering' });

    job.updateProgress(10);

    const { outputPath, thumbPath } = await renderService.renderReel({
      reelId, scenesJson, musicPath, theme, articleImageUrl
    });

    job.updateProgress(90);
    getIO().emit('render_progress', { reelId, userId, progress: 90, status: 'finalizing' });

    // Update DB: done
    const filePath = `/storage/reels/${reelId}.mp4`;
    const thumbnailPath = `/storage/thumbnails/${reelId}.jpg`;
    db.prepare("UPDATE reels SET status='done', file_path=?, thumbnail_path=?, render_progress=100 WHERE id=?")
      .run(filePath, thumbnailPath, reelId);
    db.prepare("UPDATE render_jobs SET status='completed', completed_at=CURRENT_TIMESTAMP, progress=100 WHERE reel_id=?")
      .run(reelId);

    // Emit complete
    getIO().emit('render_complete', { reelId, userId, downloadUrl: filePath, thumbnailUrl: thumbnailPath });

    job.updateProgress(100);

  } catch (err) {
    db.prepare("UPDATE reels SET status='failed', render_progress=0 WHERE id=?").run(reelId);
    db.prepare("UPDATE render_jobs SET status='failed', error_message=? WHERE reel_id=?").run(err.message, reelId);
    getIO().emit('render_failed', { reelId, userId, error: err.message });
    throw err; // BullMQ will retry
  }

}, {
  connection: redis,
  concurrency: 2,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
});


PHASE H — CONNECT REEL GENERATOR END-TO-END
Update: backend/src/routes/reels.js

POST /api/reels/generate — full flow:
router.post('/generate', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { theme = 'suspense', customization = {} } = req.body;

  // 1. Select random unused article (already built — keep existing logic)
  const article = await articleService.getRandomArticle(userId);
  if (!article) return res.status(404).json({ error: 'No articles available' });

  // 2. Detect emotion from article
  const emotion = musicEngine.detectEmotion(article.title, article.content || '');

  // 3. Generate suspense scenes via AI
  const script = await reelScriptService.generateSuspenseScenes(
    article.title, article.content || article.title, emotion, userId
  );

  // 4. Match soundtrack
  const music = musicEngine.matchSoundtrack(emotion);

  // 5. Generate unique reel ID
  const reelId = uuidv4();

  // 6. Create UTM short link (already built — use existing shortener service)
  const shortLink = await shortenerService.createLink(reelId, userId, article.url);

  // 7. Insert reel record
  db.prepare(`
    INSERT INTO reels (id, user_id, article_id, status, short_url, utm_code, campaign_token,
                       caption, theme, hashtags, music_file, scenes_json, render_progress)
    VALUES (?, ?, ?, 'rendering', ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    reelId, userId, article.id,
    shortLink.shortUrl, shortLink.utmCode, shortLink.campaignToken,
    script.caption, theme,
    JSON.stringify(script.hashtags),
    music ? music.filename : null,
    JSON.stringify(script.scenes)
  );

  // 8. Save script to reel_scripts table
  db.prepare(`
    INSERT INTO reel_scripts (reel_id, article_id, scenes_json, caption, hashtags, ai_provider, ai_model)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(reelId, article.id, JSON.stringify(script.scenes), script.caption,
          JSON.stringify(script.hashtags), script.aiProvider, script.aiModel);

  // 9. Insert render_jobs record
  db.prepare(`INSERT INTO render_jobs (reel_id, user_id, status) VALUES (?, ?, 'queued')`)
    .run(reelId, userId);

  // 10. Add to render queue
  await renderQueue.add('renderReel', {
    reelId, userId,
    scenesJson: script.scenes,
    musicPath: music ? music.filePath : null,
    theme,
    articleImageUrl: article.og_image || article.image,
  });

  // 11. Update user stats
  db.prepare("UPDATE users SET reels_generated = reels_generated + 1 WHERE id=?").run(userId);

  res.json({
    success: true,
    reelId,
    status: 'rendering',
    shortUrl: shortLink.shortUrl,
    caption: script.caption,
    hashtags: script.hashtags,
    message: 'Reel is being generated. Check status via WebSocket or GET /api/reels/:id/status'
  });
});

// Status endpoint
router.get('/:id/status', authMiddleware, (req, res) => {
  const reel = db.prepare('SELECT id, status, render_progress, file_path, thumbnail_path, short_url, caption FROM reels WHERE id=? AND user_id=?')
    .get(req.params.id, req.user.id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });
  res.json(reel);
});

// Download endpoint
router.get('/:id/download', authMiddleware, (req, res) => {
  const reel = db.prepare('SELECT file_path, status FROM reels WHERE id=? AND user_id=?')
    .get(req.params.id, req.user.id);
  if (!reel || reel.status !== 'done') return res.status(404).json({ error: 'Reel not ready' });

  const fullPath = path.join(__dirname, '../../', reel.file_path);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

  db.prepare("UPDATE users SET reel_downloads = reel_downloads + 1 WHERE id=?").run(req.user.id);
  res.download(fullPath, `reel-${req.params.id}.mp4`);
});

PHASE I — SOCKET.IO RENDER PROGRESS (Frontend)
Current: Socket.IO works for live click feed Missing: Frontend Reel Generator needs to listen for render events

Update: frontend/src/pages/ReelGenerator.tsx (or wherever generate button is)

Add Socket.IO listener:
useEffect(() => {
  socket.on('render_progress', ({ reelId, progress, status }) => {
    if (reelId === currentReelId) {
      setProgress(progress);
      setStatus(status);
    }
  });

  socket.on('render_complete', ({ reelId, downloadUrl, thumbnailUrl, caption, shortUrl }) => {
    if (reelId === currentReelId) {
      setIsRendering(false);
      setReel({ downloadUrl, thumbnailUrl, caption, shortUrl });
      toast.success('Your reel is ready!');
    }
  });

  socket.on('render_failed', ({ reelId, error }) => {
    if (reelId === currentReelId) {
      setIsRendering(false);
      toast.error('Reel generation failed. Please try again.');
    }
  });

  return () => {
    socket.off('render_progress');
    socket.off('render_complete');
    socket.off('render_failed');
  };
}, [currentReelId]);

Show during rendering:

Progress bar (0-100%)
Step label: "Generating script..." / "Rendering frames..." / "Adding music..." / "Finalizing..."
Spinner animation
Show after render_complete:

Video thumbnail preview
[⬇ Download Reel] button
[📋 Copy Caption] button
[🔗 Copy Comment Link] button (shortUrl)
🟠 PHASE J — REEL CUSTOMIZATION STUDIO
Create: frontend/src/components/ReelStudio.tsx

Show BEFORE generate button on Reel Generator page.

Sections:

THEME SELECTOR (6 cards, horizontal scroll)
Horror | Mystery | Crime | Emotional | TikTok Viral | Dark Cinematic
Each card: colored preview box + theme name
Selected: glowing border
SUBTITLE SETTINGS
Text Color: color input (#ffffff default)
Font Size: range slider (24-72px)
Position: 3 buttons [Top] [Center] [Bottom]
EFFECTS (range sliders 0-100)
Overlay Opacity
Zoom Speed
Film Grain
Glow Intensity
Pass selected values to POST /api/reels/generate as customization object.

🟡 PHASE K — SECURITY HARDENING
Install: npm install helmet express-rate-limit express-validator

Add to backend/src/app.js:

app.use(helmet())
Global rate limit: 100 requests per 15 minutes per IP
Auth rate limit: 10 requests per 15 minutes on /api/auth/*
Sanitize req.body to prevent XSS
Encrypt API keys with AES-256 before storing in DB
🟡 PHASE L — DOWNLOADS GALLERY PAGE
Complete: frontend/src/pages/Downloads.tsx

Show:

Grid layout of all user's generated reels
Each card: thumbnail image, reel title, date, status badge
Buttons per card: [⬇ Download] [📋 Copy Caption] [🔗 Copy Link]
Filter bar: All / Done / Rendering / Failed
Pagination: 12 per page
API: GET /api/reels/my-reels?status=done&page=1&limit=12

🟢 PHASE M — UI POLISH
Skeleton loaders for all data-loading states
Empty states: "No reels yet", "No clicks yet", "No articles available"
Error boundaries on all pages
Mobile responsive check
Dark mode consistency
Toast for every async action (generate, download, copy)
BUILD ORDER SUMMARY
PHASE A → PHASE B → PHASE C → PHASE D → PHASE E → PHASE F → PHASE G → PHASE H → PHASE I → PHASE J → PHASE K → PHASE L → PHASE M

TOP PRIORITY — Get this working first: article (with content) → AI scenes → music match → Remotion render → FFmpeg MP4 → download

Once ONE reel generates end-to-end successfully, everything else is secondary.

DO NOT rebuild anything in the ✅ ALREADY BUILT list at the top. START from PHASE A. Build in order. Test after each phase.



