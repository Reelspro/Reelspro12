// BullMQ Worker removed — using direct execution mode (Redis 5+ not available)
// const { Worker } = require('bullmq');
const db = require('../config/db');
const emitter = require('../socket/emitter');
const reelScriptService = require('../services/reel_script_service');
const musicEngine = require('../services/music_engine');
const { renderTextStoryReel } = require('../services/textStoryRenderer');
const fs = require('fs');
const path = require('path');


// Ensure render_jobs table has output_path column (in case it is missing)
try {
  db.exec("ALTER TABLE render_jobs ADD COLUMN output_path TEXT");
} catch (e) {
  // Column already exists or table issue
}

/**
 * Main Job Processor for rendering a reel video.
 */
async function processRenderJob(job) {
  const {
    reelId,
    userId,
    articleId,
    scenesJson,
    musicPath,
    voiceoverPath,
    theme = 'suspense',
    duration = 30,
    caption,
    shortUrl
  } = job.data;

  console.log(`[RenderWorker] Processing job ${job.id} for reel ${reelId}...`);

  // Step 1: render_jobs table mein status processing karo
  try {
    db.prepare(`
      UPDATE render_jobs 
      SET status = 'processing', progress = 0, started_at = CURRENT_TIMESTAMP, error_message = NULL 
      WHERE reel_id = ?
    `).run(reelId);

    db.prepare(`
      UPDATE reels 
      SET status = 'processing', render_progress = 0 
      WHERE id = ?
    `).run(reelId);

    // Emit Socket.IO progress
    const progressPayload = { reelId, progress: 0, status: 'processing', step: 'Initializing render...' };
    emitter.emitToUser(userId, 'render:progress', progressPayload);
    emitter.emitToAdmin('render:progress', progressPayload);
    
    // Legacy support emits
    emitter.emitToUser(userId, 'reel_progress', { reelId, userId, progress: 0, status: 'processing', step: 'Initializing render...' });

    // Step 2: reel_script_service se script lo
    let script = null;
    
    // Check if scenesJson is provided directly in job
    if (scenesJson) {
      const parsedScenes = typeof scenesJson === 'string' ? JSON.parse(scenesJson) : scenesJson;
      script = {
        scenes: parsedScenes,
        caption: caption || `${theme} story...`,
        hashtags: [],
        cta: '📖 Full Read Story Details In Comments 👇'
      };
    }

    // Try reading from database
    if (!script) {
      try {
        const scriptRow = db.prepare('SELECT * FROM reel_scripts WHERE reel_id = ?').get(reelId);
        if (scriptRow) {
          script = {
            scenes: JSON.parse(scriptRow.scenes_json),
            caption: scriptRow.caption,
            hashtags: JSON.parse(scriptRow.hashtags || '[]'),
            cta: scriptRow.cta_text
          };
        }
      } catch (e) {
        console.warn('[RenderWorker] Failed to query pre-existing script:', e.message);
      }
    }

    // Fallback: Generate script if not found
    if (!script) {
      const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(articleId);
      if (!article) {
        throw new Error(`Article not found for id: ${articleId}`);
      }
      if (theme === 'suspense') {
        script = await reelScriptService.generateSuspenseScenes(
          article.title,
          article.content || article.title,
          theme,
          userId,
          duration
        );
      } else {
        script = await reelScriptService.generateReelScript(article, {
          target_duration: duration,
          theme
        });
      }
    }

    // Step 3: music_engine se music select karo
    let selectedMusicPath = musicPath || null;
    if (!selectedMusicPath || !fs.existsSync(selectedMusicPath)) {
      const matchedMusic = await musicEngine.selectMusicForReel({ theme });
      if (matchedMusic && matchedMusic.file_path) {
        selectedMusicPath = matchedMusic.file_path;
      }
    }

    // Step 4: Render Facebook-style Text Story reel
    const outputPath = path.resolve(__dirname, '../../storage/reels', `${reelId}.mp4`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Build the full reelData object with textStoryRenderer fields
    const reelData = {
      scenes: script.scenes,
      textSegments: script.textSegments || null,
      backgroundColor: script.backgroundColor || null,
      patternId: script.patternId || null,
      accentColor: script.accentColor || null,
      username: script.username || 'Story User',
      footerText: script.footerText || 'Full Story In First Comment \uD83D\uDC47',
    };

    await renderTextStoryReel(reelData, outputPath, {
      musicPath: selectedMusicPath,
      voiceoverPath: voiceoverPath || null,
      onProgress: (percent) => {
        // Update DB progress
        db.prepare(`UPDATE render_jobs SET progress = ? WHERE reel_id = ?`).run(percent, reelId);
        db.prepare(`UPDATE reels SET render_progress = ? WHERE id = ?`).run(percent, reelId);

        // Emit Socket.IO progress
        const progData = { reelId, progress: percent, status: 'processing' };
        emitter.emitToUser(userId, 'render:progress', progData);
        emitter.emitToAdmin('render:progress', progData);
        emitter.emitToUser(userId, 'reel_progress', { reelId, userId, progress: percent, status: 'processing' });

        job.updateProgress(percent).catch(() => {});
      }
    });


    // Generate Thumbnail
    let relativeThumbnailPath = null;
    try {
      const { generateThumbnail } = require('../engine/ffmpegRenderer');
      const absoluteThumbnailPath = await generateThumbnail(outputPath, reelId);
      if (fs.existsSync(absoluteThumbnailPath)) {
        relativeThumbnailPath = `/storage/thumbnails/${reelId}.jpg`;
        const destThumb = path.resolve(__dirname, '../../storage/thumbnails', `${reelId}.jpg`);
        fs.mkdirSync(path.dirname(destThumb), { recursive: true });
        fs.copyFileSync(absoluteThumbnailPath, destThumb);
      }
    } catch (e) {
      console.warn('[RenderWorker] Failed to generate thumbnail:', e.message);
    }

    // Step 5: Output path render_jobs aur reels table mein save karo
    // Step 6: Status completed karo
    const relativeFilePath = `/storage/reels/${reelId}.mp4`;
    
    db.prepare(`
      UPDATE reels 
      SET status = 'completed', file_path = ?, thumbnail_path = ?, caption = COALESCE(?, caption), render_progress = 100
      WHERE id = ?
    `).run(relativeFilePath, relativeThumbnailPath, script.caption || null, reelId);

    db.prepare(`
      UPDATE render_jobs 
      SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP, output_path = ? 
      WHERE reel_id = ?
    `).run(relativeFilePath, reelId);

    // Update user stats
    db.prepare(`UPDATE users SET reels_generated = reels_generated + 1, last_activity = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(userId);

    // Step 7: Socket.IO emit: render:progress aur render:complete events
    const completePayload = {
      reelId,
      status: 'completed',
      outputPath: relativeFilePath,
      thumbnailPath: relativeThumbnailPath,
      caption: script.caption
    };
    emitter.emitToUser(userId, 'render:complete', completePayload);
    emitter.emitToAdmin('render:complete', completePayload);
    
    // Legacy support emit
    emitter.emitToUser(userId, 'reel_complete', {
      reelId,
      userId,
      progress: 100,
      downloadUrl: relativeFilePath,
      thumbnailUrl: relativeThumbnailPath,
      caption: script.caption
    });

    // Set job final progress
    await job.updateProgress(100).catch(() => {});

    return { success: true, reelId, outputPath: relativeFilePath };

  } catch (err) {
    console.error(`[RenderWorker] Process job failed for reel ${reelId}:`, err.message);

    // Error handling: status failed karo, error message save karo
    db.prepare(`
      UPDATE render_jobs 
      SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP 
      WHERE reel_id = ?
    `).run(err.message, reelId);

    db.prepare(`
      UPDATE reels 
      SET status = 'failed', render_progress = 0 
      WHERE id = ?
    `).run(reelId);

    // Emit Socket.IO failed event
    const failedPayload = { reelId, status: 'failed', error: err.message };
    emitter.emitToUser(userId, 'render:failed', failedPayload);
    emitter.emitToAdmin('render:failed', failedPayload);
    
    // Legacy support
    emitter.emitToUser(userId, 'reel_failed', { reelId, userId, error: err.message });

    throw err;
  }
}

// ─── Direct execution mode (no Redis/BullMQ required) ──────────────────────
// processRenderJob is called directly from reelController via setImmediate.
// This removes the Redis 5.0+ requirement while keeping the same render logic.
console.log('[RenderWorker] Direct execution mode active (no Redis queue).');

module.exports = {
  processRenderJob
};
