const db = require('../config/db');
const { logActivity } = require('../services/activityLogService');
const { saveReelScript } = require('../services/reel_script_service');
const textStoryService = require('../services/text_story_service');
const musicEngine = require('../services/music_engine');
const shortenerService = require('../services/shortener_service');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const generateTextStory = async (req, res) => {
  try {
    const { storyText, username = 'Sarah Storyteller', avatarUrl = null, customization, voice = 'Jenny' } = req.body;

    if (!storyText || storyText.trim().length === 0) {
      return res.status(400).json({ error: 'Story text is required.' });
    }

    // Insert as custom category article to keep references clean
    const cleanTitle = storyText.substring(0, 60) + '...';
    const cleanUrl = 'custom-textstory-' + req.user.id + '-' + Date.now();
    let insertResult;
    try {
      insertResult = db.prepare(`
        INSERT INTO articles (title, url, content, source_category, usage_count)
        VALUES (?, ?, ?, 'custom_textstory', 1)
      `).run(cleanTitle, cleanUrl, storyText);
    } catch (e) {
      console.warn('Custom textstory article insert warning:', e.message);
    }

    let article = db.prepare('SELECT * FROM articles WHERE url = ?').get(cleanUrl);
    if (!article) {
      const lastId = insertResult ? insertResult.lastInsertRowid : Date.now();
      article = { id: lastId, title: cleanTitle, url: cleanUrl, content: storyText };
    }

    // Use user-selected customization if provided, otherwise pick random
    let textStoryReel;
    if (customization && customization.textStory) {
      const ts = customization.textStory;
      textStoryReel = {
        storyText,
        username: ts.username || username,
        avatarUrl: ts.avatarUrl || avatarUrl,
        background: ts.background || null,
        accentColor: ts.accentColor || null,
        animationStyle: ts.animationStyle || null,
        musicTrack: ts.musicTrack || null,
        sfx: ts.sfx || [],
        screens: [],
        footerText: 'Full Story In First Comment 👇'
      };

      const screenTexts = textStoryService.splitIntoScreens(storyText);
      textStoryReel.screens = screenTexts.map((text, idx) => {
        const segments = textStoryService.parseSegments(text, textStoryReel.accentColor?.hex || '#B22222');
        return {
          id: idx + 1,
          rawText: text,
          segments,
          isLast: idx === screenTexts.length - 1
        };
      });
    } else {
      textStoryReel = textStoryService.generateTextStoryReel(storyText, username, avatarUrl);
    }

    // Build the scenes timing
    const SCREEN_DURATION = 5.0; // 5 seconds per story screen
    const CTA_DURATION = 3.0;    // 3 seconds for the footer comment call-to-action
    
    const scenes = textStoryReel.screens.map((screen, idx) => ({
      id: idx + 1,
      type: 'content',
      text: screen.rawText,
      duration: SCREEN_DURATION
    }));

    scenes.push({
      id: scenes.length + 1,
      type: 'cta',
      text: textStoryReel.footerText,
      duration: CTA_DURATION
    });

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    // Assemble the script payload to match DB schema
    const script = {
      scenes,
      caption: `${storyText.substring(0, 150)}...\n\n${textStoryReel.footerText}\n\n#textstory #storytime #fyp`,
      hashtags: ['#textstory', '#storytime', '#fyp', '#viral'],
      aiProvider: 'custom',
      aiModel: 'textstory',
      cta: textStoryReel.footerText,
      duration: totalDuration
    };

    // Find music — use user selected musicTrack.emotion or musicTrack.name as category
    let music = null;
    if (textStoryReel.musicTrack) {
      // Use emotion field first, then name as fallback
      const musicEmotion = textStoryReel.musicTrack.emotion || textStoryReel.musicTrack.name;
      music = await musicEngine.matchSoundtrack(musicEmotion);
    } else {
      // Auto-detect from story text
      const autoEmotion = musicEngine.detectEmotion('story', storyText);
      music = await musicEngine.matchSoundtrack(autoEmotion);
    }
    
    // Determine voice to use
    const selectedVoice = (customization?.textStory?.voice) || voice || 'Jenny';

    const reelId = uuidv4();
    const shortLink = await shortenerService.createLink(reelId, req.user.id, article.url);

    // Insert into reels table. Notice `bg_type = 'text_story'`
    db.prepare(`
      INSERT INTO reels (
        id, user_id, article_id, status, short_url, utm_code, campaign_token,
        caption, theme, hashtags, music_file, scenes_json, render_progress, bg_type, bg_image_path
      ) VALUES (?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, 0, 'text_story', ?)
    `).run(
      reelId,
      req.user.id,
      article.id,
      shortLink.shortCode,
      shortLink.utmCode,
      shortLink.campaignToken,
      script.caption,
      'text_story', // Use 'text_story' as theme
      JSON.stringify(script.hashtags),
      music ? music.filename : null,
      JSON.stringify(script.scenes),
      null // No custom image background initially
    );

    // Save script metadata
    saveReelScript(reelId, article.id, script);

    // Queue render job
    db.prepare(`INSERT INTO render_jobs (reel_id, user_id, status, progress) VALUES (?, ?, 'queued', 0)`)
      .run(reelId, req.user.id);

    // Prepare payload for background processing
    const jobPayload = {
      reelId,
      userId: req.user.id,
      articleId: article.id,
      scenesJson: script.scenes,
      musicPath: music?.filePath || null,
      theme: 'text_story',
      themeData: {
        textStory: textStoryReel,
        voice: selectedVoice
      },
      caption: script.caption,
      shortUrl: shortLink.shortUrl,
      bgType: 'text_story',
      customImagePath: null
    };

    logActivity(req.user.id, 'reel_queued', { reelId, articleTitle: article.title });
    db.prepare(`UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`).run(req.user.id);

    res.status(202).json({
      success: true,
      message: 'Text Story Reel generation started!',
      reelId,
      status: 'processing',
      shortUrl: shortLink.shortUrl,
      caption: script.caption,
      hashtags: script.hashtags,
      textStory: textStoryReel
    });

    // Run render job in background (non-blocking)
    setImmediate(async () => {
      try {
        const { processRenderJob } = require('../workers/renderingWorker');
        const fakeJob = {
          id: `direct-${reelId}`,
          data: jobPayload,
          updateProgress: async () => {},
        };
        await processRenderJob(fakeJob);
      } catch (renderErr) {
        console.error('[TextStoryController] Background render failed:', renderErr.message);
      }
    });

  } catch (error) {
    console.error('[TextStoryController] generateTextStory error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to start text story generation' });
  }
};

const previewTextStory = (req, res) => {
  try {
    const { storyText, username = 'Sarah Storyteller', avatarUrl = null } = req.body;

    if (!storyText || storyText.trim().length === 0) {
      return res.status(400).json({ error: 'Story text is required.' });
    }

    const textStoryReel = textStoryService.generateTextStoryReel(storyText, username, avatarUrl);

    res.json({
      success: true,
      textStory: textStoryReel
    });
  } catch (error) {
    console.error('[TextStoryController] previewTextStory error:', error.message);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
};

const getTextStoryStyles = (req, res) => {
  try {
    res.json({
      success: true,
      backgrounds: textStoryService.BACKGROUNDS,
      accentColors: textStoryService.ACCENT_COLORS,
      animations: textStoryService.ANIMATIONS,
      musicTracks: textStoryService.MUSIC_TRACKS,
      sfxOptions: textStoryService.SFX_OPTIONS
    });
  } catch (error) {
    console.error('[TextStoryController] getTextStoryStyles error:', error.message);
    res.status(500).json({ error: 'Failed to get text story styles' });
  }
};

const { generateWithRotation } = require('../services/ai_provider_service');

const rewriteStory = async (req, res) => {
  try {
    const { storyText } = req.body;
    if (!storyText) return res.status(400).json({ error: 'Story text required' });

    const prompt = `You are a viral Reddit Story writer for short-form video reels.
Rewrite the following article into a highly engaging, FIRST PERSON ("I") suspenseful story.
Article: ${storyText.substring(0, 1500)}

Rules:
- Make it extremely engaging, like a Reddit Story (e.g. "I recently got married. My husband has an adult son. I DO NOT HAVE CHILDREN...").
- Start with a SHOCKING hook sentence.
- End abruptly on a CLIFFHANGER mid-thought or at the most suspenseful line so the reader is forced to check the comments for the full story.
- Use ALL CAPS for the 1-2 most suspenseful/shocking sentences.
- Keep total text under 150 words. Make it punchy.
- Do NOT use markdown, do NOT write "Introduction", do NOT include intro text. Just the story itself.

Return ONLY the raw story text string. Do not use JSON. Do not wrap in quotes.`;

    const aiResult = await generateWithRotation(prompt, req.user.id);
    let outputText = aiResult.text.trim();
    
    // If the AI failed and returned the JSON fallback template, format it as a readable story
    if (aiResult.provider === 'template' || outputText.startsWith('{"scenes"')) {
      try {
        const parsed = JSON.parse(outputText);
        if (parsed.scenes && Array.isArray(parsed.scenes)) {
          outputText = parsed.scenes.map(s => s.text).join(' ');
        }
      } catch (e) {
        outputText = "I recently experienced something crazy. The truth is shocking. I CANNOT BELIEVE IT...";
      }
    }

    // Clean up any potential markdown wrapping
    if (outputText.startsWith('```')) {
      outputText = outputText.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    }
    
    res.json({ success: true, text: outputText });
  } catch (error) {
    console.error('[TextStoryController] rewriteStory error:', error.message);
    res.status(500).json({ error: 'Failed to rewrite story' });
  }
};

module.exports = {
  generateTextStory,
  previewTextStory,
  getTextStoryStyles,
  rewriteStory
};
