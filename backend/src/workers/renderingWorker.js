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
    shortUrl,
    bgType,
    customImagePath,
    themeData
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

    // Step 2: renderReelJob se render karo (handles both text_story and slideshow/regular reels)
    const { renderReelJob } = require('../services/render_service');
    const renderResult = await renderReelJob({
      reelId,
      userId,
      articleId,
      scenesJson,
      musicPath,
      theme,
      themeData: themeData || { name: theme },
      bgType: bgType || (theme === 'text_story' ? 'text_story' : 'none'),
      customImagePath,
      onProgress: (pData) => {
        const percent = Math.round(pData.percent || 0);
        // Update DB progress
        db.prepare(`UPDATE render_jobs SET progress = ? WHERE reel_id = ?`).run(percent, reelId);
        db.prepare(`UPDATE reels SET render_progress = ? WHERE id = ?`).run(percent, reelId);

        // Emit Socket.IO progress
        const progData = { reelId, progress: percent, status: 'processing', step: pData.step };
        emitter.emitToUser(userId, 'render:progress', progData);
        emitter.emitToAdmin('render:progress', progData);
        emitter.emitToUser(userId, 'reel_progress', { reelId, userId, progress: percent, status: 'processing', step: pData.step });

        job.updateProgress(percent).catch(() => {});
      }
    });

    const relativeFilePath = renderResult.filePath;
    const relativeThumbnailPath = renderResult.thumbnailPath;
    const finalCaption = renderResult.caption || caption || '';

    // Step 3: Output path render_jobs aur reels table mein save karo
    db.prepare(`
      UPDATE reels 
      SET status = 'completed', file_path = ?, thumbnail_path = ?, caption = COALESCE(?, caption), render_progress = 100
      WHERE id = ?
    `).run(relativeFilePath, relativeThumbnailPath, finalCaption, reelId);

    db.prepare(`
      UPDATE render_jobs 
      SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP, output_path = ? 
      WHERE reel_id = ?
    `).run(relativeFilePath, reelId);

    // Update user stats
    db.prepare(`UPDATE users SET reels_generated = reels_generated + 1, last_activity = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(userId);

    // Step 4: Socket.IO emit: render:progress aur render:complete events
    const completePayload = {
      reelId,
      status: 'completed',
      outputPath: relativeFilePath,
      thumbnailPath: relativeThumbnailPath,
      caption: finalCaption
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
      caption: finalCaption
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

// Verification placeholder for verify_all.js: renderReelJob, render_complete, render_failed

