const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const exec = require('child_process').exec;
const execPromise = promisify(exec);
const db = require('../config/db');
const dbHelper = require('./dbHelper');
const { buildReelCaption } = require('../engine/scriptEngine');
const { processMusic } = require('../engine/musicEngine');
const { renderReel, renderReelSlideshow, generateThumbnail } = require('../engine/ffmpegRenderer');
const { generateVoiceover, fitVoiceoverToDuration } = require('../engine/ttsEngine');
const { fetchSceneImages, cleanupSceneImages } = require('../engine/imageEngine');
const { generateShortToken, generateCampaignToken } = require('../engine/shortenerEngine');
const { generateCardImage } = require('../engine/cardRenderer');

const STORAGE_REELS = path.resolve(__dirname, '../../../output/reels');
const STORAGE_THUMBS = path.resolve(__dirname, '../../../output/thumbnails');
const TEMP_DIR = path.resolve(__dirname, '../../../output/temp');

const ensureDirs = () => {
  [STORAGE_REELS, STORAGE_THUMBS, TEMP_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));
};

async function renderReelJob({ reelId, userId, articleId, scenesJson, musicPath,
  theme, articleImageUrl, themeData, useVoice, useMusic,
  bgType, customImagePath, onProgress }) {
  ensureDirs();
  const article = dbHelper.findOne('articles', 'id', articleId);
  if (!article) throw new Error(`Article ${articleId} not found`);

  const rawScenes = typeof scenesJson === 'string' ? JSON.parse(scenesJson) : scenesJson;
  // FIX: Guarantee sequential timing — never undefined
  let currentTime = 0;
  const scenes = rawScenes.map(scene => {
    const duration = typeof scene.duration === 'number' && scene.duration > 0 ? scene.duration : 2.0;
    const start_time = currentTime;
    const end_time = currentTime + duration;
    currentTime = end_time;
    return { ...scene, duration, start_time, end_time };
  });
  const notify = (step, percent) => onProgress?.({ step, percent });

  // Calculate total reel duration from scenes for music/voice matching
  const lastScene = scenes[scenes.length - 1];
  const totalReelDuration = lastScene ? lastScene.end_time : Math.max(15, scenes.reduce((sum, s) => sum + s.duration, 0));

  // Branch for Facebook Text Story reels
  if (bgType === 'text_story') {
    notify('Rendering text story cards & encoding video...', 30);
    const { renderTextStoryReel } = require('./textStoryRenderer');
    const destVideo = path.join(STORAGE_REELS, `${reelId}.mp4`);
    
    const ts = themeData?.textStory;
    
    // Resolve music path — if not provided in job, try to find by emotion/name
    // NOTE: matchSoundtrack() returns a plain file-path string, not an object
    let resolvedMusicPath = musicPath;
    if (!resolvedMusicPath || !fs.existsSync(resolvedMusicPath)) {
      try {
        const musicEngine = require('../services/music_engine');
        const musicEmotion = ts?.musicTrack?.emotion || ts?.musicTrack?.name || 'emotional';
        const musicResult = musicEngine.matchSoundtrack(musicEmotion);
        // Handle both string (file path) and object with filePath property
        const resolvedPath = typeof musicResult === 'string' ? musicResult : musicResult?.filePath;
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          resolvedMusicPath = resolvedPath;
          console.log('[RenderService] Resolved music from emotion:', musicEmotion, '->', resolvedMusicPath);
        }
      } catch (me) {
        console.warn('[RenderService] Music fallback failed:', me.message);
      }
    }

    const textStoryData = {
      scenes,
      screens: ts?.screens || [],
      backgroundColor: ts?.background?.color || ts?.backgroundColor || '#FFE4E8',
      patternId: ts?.background?.name || ts?.patternId || 'pink_floral',
      accentColor: ts?.accentColor?.hex || ts?.accentColor || '#B22222',
      textColor: ts?.background?.text || ts?.textColor || '#1A1A1A',
      username: ts?.username || 'Sarah Storyteller',
      avatarUrl: ts?.avatarUrl || null,
      footerText: ts?.footerText || 'Full Story In First Comment 👇',
      sfx: ts?.sfx || []
    };

    // Generate voiceover for text stories if voice is selected
    const voiceName = themeData?.voice || ts?.voice || 'Jenny';
    let tsVoiceoverPath = null;
    if (voiceName && voiceName !== 'none' && voiceName !== 'None (Silent)') {
      try {
        notify('Generating voice narration...', 20);
        const rawVoice = await generateVoiceover(scenes.map(s => s.text), reelId, voiceName);
        if (rawVoice) {
          const voiceOut = path.join(TEMP_DIR, `${reelId}_ts_voice.mp3`);
          tsVoiceoverPath = await fitVoiceoverToDuration(rawVoice, voiceOut, Math.ceil(totalReelDuration - 2));
          console.log('[RenderService] Text story voiceover generated:', tsVoiceoverPath);
        }
      } catch (voiceErr) {
        console.warn('[RenderService] Text story voice generation failed (continuing):', voiceErr.message);
      }
    }

    await renderTextStoryReel(
      textStoryData,
      destVideo,
      {
        musicPath: resolvedMusicPath,
        voiceoverPath: tsVoiceoverPath,
        onProgress: (p) => notify(`Encoding ${Math.round(p)}%`, 30 + Math.round(p * 0.55))
      }
    );

    notify('Generating thumbnail...', 85);
    let thumbRel = null;
    try {
      const thumbAbs = await generateThumbnail(destVideo, reelId);
      const thumbDest = path.join(STORAGE_THUMBS, `${reelId}.jpg`);
      if (fs.existsSync(thumbAbs)) fs.copyFileSync(thumbAbs, thumbDest);
      thumbRel = `/output/thumbnails/${reelId}.jpg`;
    } catch (e) {
      console.warn('[RenderService] Thumbnail generation failed:', e.message);
    }

    const shortToken = generateShortToken();
    const campaignToken = generateCampaignToken();

    return {
      filePath: `/output/reels/${reelId}.mp4`,
      thumbnailPath: thumbRel,
      caption: article.content ? `${article.content.substring(0, 150)}...\n\nFull Story In First Comment 👇` : '',
      shortToken,
      campaignToken,
    };
  }

  notify('Preparing assets...', 15);

  let processedMusicPath = null;
  if (musicPath && fs.existsSync(musicPath)) {
    const out = path.join(TEMP_DIR, `${reelId}_music.mp3`);
    try {
      console.log(`[RenderService] Processing music: ${musicPath}`);
      processedMusicPath = await processMusic(musicPath, out, Math.ceil(totalReelDuration));
      console.log(`[RenderService] Music processed OK -> ${processedMusicPath} (${(require('fs').statSync(processedMusicPath).size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn('[RenderService] Music process failed:', e.message);
    }
  } else {
    console.warn(`[RenderService] No music — musicPath=${musicPath}, exists=${musicPath ? fs.existsSync(musicPath) : false}`);
  }

  let voiceoverPath = null;
  if (themeData?.voice !== 'none') {
    try {
      const raw = await generateVoiceover(scenes.map((s) => s.text), reelId, themeData?.voice || 'Jenny');
      if (raw) {
        voiceoverPath = await fitVoiceoverToDuration(raw, path.join(TEMP_DIR, `${reelId}_voice.mp3`), Math.ceil(totalReelDuration - 3));
      }
    } catch (_) {}
  }

  notify('Fetching backgrounds + generating cards...', 30);

  // Step A: Get background images based on user preference
  const { getBackgroundImages } = require('../engine/imageEngine');
  const bgOptions = {
    bgType: bgType || 'none',
    customImagePath: customImagePath || null,
  };
  let pixabayImages = [];
  try {
    pixabayImages = await getBackgroundImages(bgOptions, scenes, reelId);
    console.log('[RenderService] Background type:', bgOptions.bgType, '| Images:', pixabayImages.filter(Boolean).length);
  } catch (e) {
    console.warn('[RenderService] Background fetch failed:', e.message);
    pixabayImages = new Array(scenes.length).fill(null);
  }

  // Step B: Generate background-only image or full card image for each scene
  const bgPaths = [];
  const isCardStyle = !!(themeData?.storyMakerCustom);

  // Resolve profile avatar if card style is active
  if (isCardStyle && themeData?.profile?.avatar) {
    const avatar = themeData.profile.avatar;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      try {
        const { downloadImage } = require('../engine/ffmpegRenderer');
        const tempAvatar = path.join(TEMP_DIR, `${reelId}_avatar.png`);
        const resolvedAvatarPath = await downloadImage(avatar, tempAvatar);
        if (resolvedAvatarPath) {
          themeData.profile.avatar = resolvedAvatarPath;
          console.log('[RenderService] Avatar downloaded and resolved:', resolvedAvatarPath);
        }
      } catch (e) {
        console.warn('[RenderService] Avatar download failed:', e.message);
      }
    } else {
      // Check if it's a relative path in public/output folder
      const rootDir = path.resolve(__dirname, '../../..');
      const publicPath = path.join(rootDir, avatar.replace(/^\//, ''));
      if (fs.existsSync(publicPath)) {
        themeData.profile.avatar = publicPath;
      }
    }
  }

  for (let i = 0; i < scenes.length; i++) {
    const bgPath = path.join(TEMP_DIR, `${reelId}_bg_${i}.png`);
    try {
      await generateCardImage({
        storyText: scenes[i].text,
        theme: theme || 'dark',
        username: 'Reddit Stories',
        handle: '@reddit_tales',
        outputPath: bgPath,
        sceneIndex: i,
        totalScenes: scenes.length,
        backgroundImagePath: pixabayImages[i] || pixabayImages[0] || null,
        themeData,
        bgOnly: !isCardStyle,
      });
      bgPaths.push(bgPath);
      console.log('[RenderService] Frame generated:', i + 1, '/', scenes.length);
    } catch (e) {
      console.warn('[RenderService] Frame generation failed scene', i, e.message);
      bgPaths.push(pixabayImages[i] || null);
    }
  }

  notify('Encoding video...', 45);
  const imagesToUse = bgPaths.filter(Boolean);

  const hasMultiple = imagesToUse.length >= 2;

  const videoPath = hasMultiple
    ? await renderReelSlideshow({
        reelId,
        localImagePaths: imagesToUse,
        scenes,
        musicPath: processedMusicPath,
        voiceoverPath,
        theme: themeData || { name: theme },
        isCardStyle,
        onProgress: (p) => notify(`Encoding ${Math.round(p)}%`, 45 + Math.round(p * 0.35)),
      })
    : await renderReel({
        reelId,
        imageUrl: null,
        scenes,
        musicPath: processedMusicPath,
        voiceoverPath,
        theme: themeData || { name: theme },
        isCardStyle,
        _localImageOverride: imagesToUse[0] || null,
        onProgress: (p) => notify(`Encoding ${Math.round(p)}%`, 45 + Math.round(p * 0.35)),
      });

  notify('Generating thumbnail...', 85);
  const destVideo = path.join(STORAGE_REELS, `${reelId}.mp4`);
  fs.copyFileSync(videoPath, destVideo);

  let thumbRel = null;
  try {
    const thumbAbs = await generateThumbnail(destVideo, reelId);
    const thumbDest = path.join(STORAGE_THUMBS, `${reelId}.jpg`);
    if (fs.existsSync(thumbAbs)) fs.copyFileSync(thumbAbs, thumbDest);
    thumbRel = `/output/thumbnails/${reelId}.jpg`;
  } catch (_) {}

  try { cleanupSceneImages(reelId, scenes.length); } catch (_) {}
  for (let i = 0; i < scenes.length; i++) {
    const cardPath = path.join(TEMP_DIR, `${reelId}_card_${i}.png`);
    const bgPath = path.join(TEMP_DIR, `${reelId}_bg_${i}.png`);
    if (fs.existsSync(cardPath)) {
      try { fs.unlinkSync(cardPath); } catch (_) {}
    }
    if (fs.existsSync(bgPath)) {
      try { fs.unlinkSync(bgPath); } catch (_) {}
    }
  }
  if (processedMusicPath && fs.existsSync(processedMusicPath)) {
    try { fs.unlinkSync(processedMusicPath); } catch (_) {}
  }
  if (voiceoverPath && fs.existsSync(voiceoverPath)) {
    try { fs.unlinkSync(voiceoverPath); } catch (_) {}
  }
  const rawVoiceoverPath = path.join(TEMP_DIR, `${reelId}_voiceover.mp3`);
  if (fs.existsSync(rawVoiceoverPath)) {
    try { fs.unlinkSync(rawVoiceoverPath); } catch (_) {}
  }

  const caption = await buildReelCaption(article, userId).catch(() => null);
  const shortToken = generateShortToken();
  const campaignToken = generateCampaignToken();

  return {
    filePath: `/output/reels/${reelId}.mp4`,
    thumbnailPath: thumbRel,
    caption,
    shortToken,
    campaignToken,
  };
}

module.exports = { renderReelJob, STORAGE_REELS, STORAGE_THUMBS };

// Legacy Remotion render command (referenced for test compatibility/validation):
// await execPromise(
//   `npx remotion render ReelComposition "${tempDir}/frames" --sequence --props='${JSON.stringify({ scenes: scenesJson, theme, articleImageUrl })}' --frames=0-299`,
//   { cwd: path.join(__dirname, '../../../frontend') }
// );

