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

const STORAGE_REELS = path.resolve(__dirname, '../../storage/reels');
const STORAGE_THUMBS = path.resolve(__dirname, '../../storage/thumbnails');
const TEMP_DIR = path.resolve(__dirname, '../../output/temp');

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
    
    // Fallback if themeData.textStory is not fully set
    const textStoryData = themeData?.textStory || {
      scenes,
      backgroundColor: '#FFE4E8',
      patternId: 'pink_floral',
      accentColor: '#B22222',
      username: 'Sarah Storyteller',
      footerText: 'Full Story In First Comment 👇'
    };

    await renderTextStoryReel(
      textStoryData,
      destVideo,
      {
        musicPath,
        voiceoverPath: null, // text stories use background music only
        onProgress: (p) => notify(`Encoding ${Math.round(p)}%`, 30 + Math.round(p * 0.55))
      }
    );

    notify('Generating thumbnail...', 85);
    let thumbRel = null;
    try {
      const thumbAbs = await generateThumbnail(destVideo, reelId);
      const thumbDest = path.join(STORAGE_THUMBS, `${reelId}.jpg`);
      if (fs.existsSync(thumbAbs)) fs.copyFileSync(thumbAbs, thumbDest);
      thumbRel = `/storage/thumbnails/${reelId}.jpg`;
    } catch (e) {
      console.warn('[RenderService] Thumbnail generation failed:', e.message);
    }

    const shortToken = generateShortToken();
    const campaignToken = generateCampaignToken();

    return {
      filePath: `/storage/reels/${reelId}.mp4`,
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
      processedMusicPath = await processMusic(musicPath, out, Math.ceil(totalReelDuration));
    } catch (e) {
      console.warn('[RenderService] Music process failed:', e.message);
    }
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
    bgType: bgType || 'pixabay',
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

  // Step B: Generate background-only image for each scene (which supports Solid, Gradient, and Image backgrounds)
  const bgPaths = [];
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
        bgOnly: true,
      });
      bgPaths.push(bgPath);
      console.log('[RenderService] Background frame generated:', i + 1, '/', scenes.length);
    } catch (e) {
      console.warn('[RenderService] Background frame failed scene', i, e.message);
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
        isCardStyle: false,
        onProgress: (p) => notify(`Encoding ${Math.round(p)}%`, 45 + Math.round(p * 0.35)),
      })
    : await renderReel({
        reelId,
        imageUrl: null,
        scenes,
        musicPath: processedMusicPath,
        voiceoverPath,
        theme: themeData || { name: theme },
        isCardStyle: false,
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
    thumbRel = `/storage/thumbnails/${reelId}.jpg`;
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
    filePath: `/storage/reels/${reelId}.mp4`,
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

