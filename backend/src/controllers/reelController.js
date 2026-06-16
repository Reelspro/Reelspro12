const db = require('../config/db');
const dbHelper = require('../services/dbHelper');
const { getRandomArticle } = require('../services/articleService');
const { scrapeSourceUrl } = require('../services/scraper_service');
const { logActivity } = require('../services/activityLogService');
const { generateSuspenseScenes, saveReelScript, buildTextSegments, pickTextStoryStyle } = require('../services/reel_script_service');

const musicEngine = require('../services/music_engine');
const shortenerService = require('../services/shortener_service');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

function splitStoryIntoScenes(storyText, minDuration = 15) {
  const sentences = storyText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3); // Take only the first 3 sentences
  
  const CTA_DURATION = 3.0;
  const totalScenes = sentences.length + 1; // +1 for CTA
  const contentDuration = Math.max(minDuration, totalScenes * 3.5) - CTA_DURATION;
  const perScene = sentences.length > 0 ? Math.max(2.5, contentDuration / sentences.length) : 3.0;

  const scenes = sentences.map((text, idx) => ({
    id: idx + 1,
    type: idx === 0 ? 'hook' : 'beat',
    text,
    duration: parseFloat(perScene.toFixed(2)),
  }));
  
  scenes.push({
    id: scenes.length + 1,
    type: 'cta',
    text: '📖 Read Full Story at Link in Comments! 👇',
    duration: CTA_DURATION,
  });
  
  return scenes;
}

const generateReel = async (req, res) => {
  try {
    const { theme = 'suspense', customization = {}, duration = 15, category, bgType, customImagePath, storyContent, articleId } = req.body;
    const finalDuration = Math.max(15, Math.min(30, parseInt(duration, 10) || 15));
    
    let article;
    let script;
    let emotion = 'suspense';
    
    if (articleId) {
      try {
        article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
      } catch (e) {
        console.warn('Error fetching articleId:', e.message);
      }
    }

    const isCustomStory = !!(customization.storyMakerCustom);

    if (isCustomStory) {
      // Direct splitting of the user's custom story text
      const contentToUse = storyContent || (article && (article.content || article.title)) || 'No content provided';
      const textStoryService = require('../services/text_story_service');
      // Limit word count per screen to ~75 words so it fits beautifully in the card layout
      const screens = textStoryService.splitIntoScreens(contentToUse, 75);
      
      const rawScenes = screens.map((text, idx) => {
        const words = text.split(/\s+/).filter(Boolean).length;
        // Allocate reading duration dynamically: ~2.5 words per second + 1.5s padding
        const duration = Math.max(5.0, Math.min(12.0, Math.round((words / 2.5) + 1.5)));
        return {
          id: idx + 1,
          type: 'content',
          text,
          duration
        };
      });

      // Append CTA
      const footerText = customization.footer?.text || 'Continue Reading in Comments..';
      rawScenes.push({
        id: rawScenes.length + 1,
        type: 'cta',
        text: footerText,
        duration: 3.0
      });

      const totalDuration = rawScenes.reduce((sum, s) => sum + s.duration, 0);

      // Create custom article if not already existing
      if (!article) {
        const cleanTitle = contentToUse.substring(0, 60) + '...';
        const cleanUrl = 'custom-' + req.user.id + '-' + Date.now();
        let insertResult;
        try {
          insertResult = db.prepare(`
            INSERT INTO articles (title, url, content, source_category, usage_count)
            VALUES (?, ?, ?, 'custom', 1)
          `).run(cleanTitle, cleanUrl, contentToUse);
        } catch (e) {
          console.warn('Custom article insert warning:', e.message);
        }
        article = db.prepare('SELECT * FROM articles WHERE url = ?').get(cleanUrl);
        if (!article) {
          const lastId = insertResult ? insertResult.lastInsertRowid : 1;
          article = { id: lastId, title: cleanTitle, url: cleanUrl, content: contentToUse };
        }
      }

      script = {
        scenes: rawScenes,
        caption: `${contentToUse.substring(0, 150)}...\n\n#story #redditstories #fyp`,
        hashtags: ['#story', '#redditstories', '#fyp'],
        duration: totalDuration
      };
      
      emotion = musicEngine.detectEmotion(article?.title || 'Story', contentToUse);
    } else if (article) {
      const contentToUse = storyContent || article.content || article.title;
      emotion = musicEngine.detectEmotion(article.title, contentToUse);
      script = await generateSuspenseScenes(
        article.title,
        contentToUse,
        emotion,
        req.user.id,
        finalDuration
      );
    } else if (storyContent) {
      const cleanTitle = storyContent.substring(0, 60) + '...';
      const cleanUrl = 'custom-' + req.user.id + '-' + Date.now();
      let insertResult;
      try {
        insertResult = db.prepare(`
          INSERT INTO articles (title, url, content, source_category, usage_count)
          VALUES (?, ?, ?, 'custom', 1)
        `).run(cleanTitle, cleanUrl, storyContent);
      } catch (e) {
        console.warn('Custom article insert warning:', e.message);
      }
      article = db.prepare('SELECT * FROM articles WHERE url = ?').get(cleanUrl);
      if (!article) {
        const lastId = insertResult ? insertResult.lastInsertRowid : 1;
        article = { id: lastId, title: cleanTitle, url: cleanUrl, content: storyContent };
      }
      
      emotion = musicEngine.detectEmotion(article.title, article.content);
      script = await generateSuspenseScenes(
        article.title,
        article.content,
        emotion,
        req.user.id,
        finalDuration
      );
    } else {
      article = await getRandomArticle(req.user.id, category);
      if (!article) {
        return res.status(404).json({ error: 'No articles found in the database. Please try scraping some websites first.' });
      }
      emotion = musicEngine.detectEmotion(article.title, article.content || '');
      script = await generateSuspenseScenes(
        article.title,
        article.content || article.title,
        emotion,
        req.user.id,
        finalDuration
      );
    }

    let music = null;
    if (customization.musicEnabled !== false && customization.musicId !== 'none') {
      if (customization.musicId) {
        // musicId comes as integer from DB; cast to int for safe lookup
        const row = db.prepare('SELECT * FROM music_library WHERE id = ?').get(parseInt(customization.musicId, 10));
        if (row && fs.existsSync(row.file_path)) {
          music = { filePath: row.file_path, filename: row.filename, emotion: row.category };
          console.log(`[ReelController] Music selected by ID ${customization.musicId}: ${row.filename}`);
        } else {
          console.warn(`[ReelController] musicId ${customization.musicId} not found or file missing, using auto-match`);
        }
      }
      if (!music) {
        // matchSoundtrack returns a plain file path string — wrap it properly
        const fallbackPath = musicEngine.matchSoundtrack(emotion);
        if (fallbackPath && typeof fallbackPath === 'string' && fs.existsSync(fallbackPath)) {
          const filename = require('path').basename(fallbackPath);
          music = { filePath: fallbackPath, filename, emotion };
          console.log(`[ReelController] Auto-matched music for emotion '${emotion}': ${filename}`);
        } else if (fallbackPath && typeof fallbackPath === 'object' && fallbackPath.filePath) {
          music = fallbackPath; // already an object
        }
      }
    }
    console.log(`[ReelController] Final music:`, music ? music.filename : 'NONE — no background music');
    const reelId = uuidv4();
    const shortLink = await shortenerService.createLink(reelId, req.user.id, article.url);

    db.prepare(`
      INSERT INTO reels (
        id, user_id, article_id, status, short_url, utm_code, campaign_token,
        caption, theme, hashtags, music_file, scenes_json, render_progress, bg_type, bg_image_path
      ) VALUES (?, ?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      reelId,
      req.user.id,
      article.id,
      shortLink.shortCode,
      shortLink.utmCode,
      shortLink.campaignToken,
      script.caption,
      theme,
      JSON.stringify(script.hashtags),
      music ? music.filename : null,
      JSON.stringify(script.scenes),
      bgType || 'none',
      customImagePath || null
    );

    saveReelScript(reelId, article.id, script);

    db.prepare(`INSERT INTO render_jobs (reel_id, user_id, status, progress) VALUES (?, ?, 'queued', 0)`)
      .run(reelId, req.user.id);

    // ─── Direct background execution (no Redis/BullMQ needed) ──────────
    // We respond immediately and then run the render job in the background
    // using setImmediate so the event loop is not blocked.
    const jobPayload = {
      reelId,
      userId: req.user.id,
      articleId: article.id,
      scenesJson: script.scenes,
      musicPath: music?.filePath || null,
      theme,
      themeData: customization,
      caption: script.caption,
      shortUrl: shortLink.shortUrl,
      bgType: bgType || 'none',
      customImagePath: customImagePath || null,
    };

    // Respond first so the client isn't waiting
    logActivity(req.user.id, 'reel_queued', { reelId, articleTitle: article.title });
    db.prepare(`UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`).run(req.user.id);

    res.status(202).json({
      success: true,
      message: 'Reel generation started!',
      reelId,
      status: 'processing',
      shortUrl: shortLink.shortUrl,
      caption: script.caption,
      hashtags: script.hashtags,
      article: {
        title: article.title,
        image: article.image,
        source_category: article.source_category,
      },
    });

    // Run render job in background (non-blocking)
    setImmediate(async () => {
      try {
        const { processRenderJob } = require('../workers/renderingWorker');
        // Create a minimal job-like object processRenderJob expects
        const fakeJob = {
          id: `direct-${reelId}`,
          data: jobPayload,
          updateProgress: async () => {},
        };
        await processRenderJob(fakeJob);
      } catch (renderErr) {
        console.error('[ReelController] Background render failed:', renderErr.message);
      }
    });

  } catch (error) {
    console.error('[ReelController] generateReel error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to start reel generation' });
  }
};

const getReelStatus = (req, res) => {
  try {
    const reel = req.user.role === 'admin'
      ? db.prepare(`SELECT id, status, render_progress, file_path, thumbnail_path, short_url, caption, hashtags, theme FROM reels WHERE id = ?`).get(req.params.id)
      : db.prepare(`SELECT id, status, render_progress, file_path, thumbnail_path, short_url, caption, hashtags, theme FROM reels WHERE id = ? AND user_id = ?`).get(req.params.id, req.user.id);

    if (!reel) return res.status(404).json({ error: 'Reel not found' });

    const base = shortenerService.BASE_URL;
    res.json({
      ...reel,
      full_short_url: reel.short_url ? `${base}/r/${reel.short_url}` : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reel status' });
  }
};

const getUserReels = (req, res) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT r.*, a.title as article_title, a.image as article_image, a.source_category
      FROM reels r
      LEFT JOIN articles a ON r.article_id = a.id
      WHERE r.user_id = ?
    `;
    const params = [req.user.id];

    if (status && status !== 'all') {
      sql += ` AND r.status = ?`;
      params.push(status === 'done' ? 'completed' : status);
    }
    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const reels = db.prepare(sql).all(...params);
    const base = shortenerService.BASE_URL;

    res.json(reels.map((r) => ({
      ...r,
      full_short_url: r.short_url ? `${base}/r/${r.short_url}` : null,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
};

const downloadReel = (req, res) => {
  try {
    const reel = dbHelper.findOne('reels', 'id', req.params.id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });

    if (reel.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!reel.file_path || reel.status !== 'completed') {
      return res.status(400).json({ error: 'Reel is not ready yet' });
    }

    // Resolve absolute path — support both /output/ and legacy /storage/ prefixes
    const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../..');
    let absolutePath;
    if (reel.file_path.startsWith('/output')) {
      absolutePath = path.join(rootDir, reel.file_path.replace(/^\//, ''));
    } else if (reel.file_path.startsWith('/storage')) {
      absolutePath = path.join(rootDir, reel.file_path.replace(/^\//, ''));
    } else {
      absolutePath = path.resolve(rootDir, reel.file_path);
    }

    // Fallback: search output/reels by filename only
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.join(rootDir, 'output', 'reels', path.basename(reel.file_path));
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Reel file not found on disk' });
    }

    logActivity(reel.user_id, 'reel_downloaded', { reelId: reel.id });
    db.prepare(`UPDATE users SET reel_downloads = reel_downloads + 1, last_activity = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(reel.user_id);

    res.download(absolutePath, `reel-${reel.id}.mp4`);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download reel' });
  }
};

const getUserCampaigns = (req, res) => {
  try {
    const base = shortenerService.BASE_URL;
    const campaigns = db.prepare(`
      SELECT r.id, r.short_url, r.utm_code, r.campaign_token, r.caption, r.status, r.created_at,
             a.title as article_title, a.source_category,
             (SELECT COUNT(*) FROM clicks c WHERE c.reel_id = r.id) as click_count
      FROM reels r
      LEFT JOIN articles a ON r.article_id = a.id
      WHERE r.user_id = ? AND r.short_url IS NOT NULL
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    res.json(campaigns.map((c) => ({
      ...c,
      full_short_url: `${base}/r/${c.short_url}`,
      comment_link: `${base}/r/${c.short_url}`,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

const deleteReel = (req, res) => {
  try {
    const reel = dbHelper.findOne('reels', 'id', req.params.id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });

    if (reel.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this reel' });
    }

    // Delete clicks and render jobs first
    db.prepare('DELETE FROM clicks WHERE reel_id = ?').run(reel.id);
    db.prepare('DELETE FROM render_jobs WHERE reel_id = ?').run(reel.id);
    db.prepare('DELETE FROM reel_scripts WHERE reel_id = ?').run(reel.id);
    if (reel.short_url) {
      db.prepare('DELETE FROM utm_links WHERE short_code = ?').run(reel.short_url);
    }
    
    // Remove files from disk
    if (reel.file_path) {
      try {
        const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../..');
        const fullPath = path.resolve(rootDir, reel.file_path.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {
        console.error('Disk clean file delete failed:', e.message);
      }
    }
    if (reel.thumbnail_path) {
      try {
        const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../..');
        const fullThumbPath = path.resolve(rootDir, reel.thumbnail_path.replace(/^\//, ''));
        if (fs.existsSync(fullThumbPath)) fs.unlinkSync(fullThumbPath);
      } catch (e) {
        console.error('Disk clean thumbnail delete failed:', e.message);
      }
    }

    const deleted = dbHelper.remove('reels', reel.id);
    if (deleted) {
      db.prepare('UPDATE users SET reels_generated = CASE WHEN reels_generated > 0 THEN reels_generated - 1 ELSE 0 END WHERE id = ?').run(reel.user_id);
      res.json({ success: true, message: 'Reel deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to remove reel record' });
    }
  } catch (error) {
    console.error('[ReelController] deleteReel error:', error);
    res.status(500).json({ error: 'Internal server error deleting reel' });
  }
};

const getRandomWebsiteArticle = async (req, res) => {
  try {
    const { scrapeSourceUrl } = require('../services/scraper_service');
    
    // Find active website source
    const source = db.prepare('SELECT * FROM website_sources WHERE is_active = 1 LIMIT 1').get();
    if (!source) {
      return res.status(404).json({ error: 'No website source configured. Please add one in the Admin Panel.' });
    }

    // Unescape html source URL
    const unescapeHtml = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&');
    };
    
    // Count articles for this source
    const articlesCount = db.prepare('SELECT COUNT(*) as count FROM articles WHERE website_source_id = ?').get(source.id).count;
    
    if (articlesCount === 0) {
      console.log(`[ReelController] No articles found for source ${source.id}. Scraping dynamically...`);
      await scrapeSourceUrl(unescapeHtml(source.url), source.id, source.category_name);
    }

    // Retrieve random article for this source
    let article = db.prepare(`
      SELECT * FROM articles 
      WHERE website_source_id = ? 
      AND content IS NOT NULL AND content != '' AND length(content) > 50
      ORDER BY RANDOM() LIMIT 1
    `).get(source.id);

    // Fallback if still no article for this source
    if (!article) {
      console.log('[ReelController] No articles found for source, trying database fallback...');
      article = db.prepare(`
        SELECT * FROM articles 
        WHERE content IS NOT NULL AND content != '' AND length(content) > 50
        ORDER BY RANDOM() LIMIT 1
      `).get();
    }

    if (!article) {
      return res.status(404).json({ error: 'No articles found in the database. Please try scraping some websites first.' });
    }

    res.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        url: article.url,
        source_category: article.source_category,
      }
    });
  } catch (error) {
    console.error('[ReelController] getRandomWebsiteArticle error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch random website article' });
  }
};

const getAvailableArticles = (req, res) => {
  try {
    const articles = db.prepare(`
      SELECT id, title, substr(content, 1, 100) as content_preview, created_at 
      FROM articles 
      ORDER BY created_at DESC LIMIT 50
    `).all();
    res.json({ articles });
  } catch (error) {
    console.error('[ReelController] getAvailableArticles error:', error.message);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

module.exports = {
  generateReel,
  getReelStatus,
  getUserReels,
  downloadReel,
  getUserCampaigns,
  deleteReel,
  getRandomWebsiteArticle,
  getAvailableArticles,
};
