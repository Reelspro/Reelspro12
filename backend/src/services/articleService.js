const dbHelper = require('./dbHelper');
const redisConnection = require('../config/redis');
const { scrapeArticleContent } = require('../engine/scraper');

const saveArticleToPool = async (articleData) => {
  try {
    const db = require('../config/db');
    const existing = dbHelper.findOne('articles', 'url', articleData.url);

    let content = articleData.content || null;
    let og_image = articleData.og_image || articleData.image || null;
    let metadata = articleData.metadata || null;

    if ((!content || content.length < 50) && articleData.url) {
      const scraped = await scrapeArticleContent(articleData.url);
      if (scraped) {
        content = content || scraped.content;
        og_image = og_image || scraped.og_image;
        metadata = metadata || scraped.metadata;
        if (!articleData.title && scraped.title) articleData.title = scraped.title;
        if (!articleData.image && scraped.image) articleData.image = scraped.image;
      }
    }

    if (!existing) {
      dbHelper.insert('articles', {
        title: articleData.title,
        url: articleData.url,
        image: articleData.image || og_image,
        content,
        og_image,
        metadata,
        source_category: articleData.source_category,
        website_source_id: articleData.website_source_id,
        usage_count: 0,
        virality_score: 0.0,
      });
      return true;
    }

    const updates = {};
    if (content && (!existing.content || existing.content.length < 50)) updates.content = content;
    if (og_image && !existing.og_image) updates.og_image = og_image;
    if (metadata && !existing.metadata) updates.metadata = metadata;
    if (articleData.image && !existing.image) updates.image = articleData.image;
    if (Object.keys(updates).length) {
      dbHelper.update('articles', existing.id, updates);
      return 'updated';
    }
    return false;
  } catch (error) {
    console.error(`Error saving article ${articleData.url}:`, error.message);
    return false;
  }
};

/**
 * Backfill content for articles missing body text
 */
const backfillArticleContent = async (limit = 50) => {
  const db = require('../config/db');
  const rows = db.prepare(`
    SELECT id, url, title, image FROM articles
    WHERE content IS NULL OR length(content) < 50
    LIMIT ?
  `).all(limit);

  let updated = 0;
  for (const row of rows) {
    const scraped = await scrapeArticleContent(row.url);
    if (scraped?.content) {
      dbHelper.update('articles', row.id, {
        content: scraped.content,
        og_image: scraped.og_image || row.image,
        metadata: scraped.metadata,
        image: row.image || scraped.image,
      });
      updated++;
    }
  }
  console.log(`[ArticleService] Backfilled content for ${updated}/${rows.length} articles`);
  return updated;
};

async function getRandomArticle(userId) {
  try {
    const db = require('../config/db');
    const settings = db.prepare('SELECT article_cooldown_minutes FROM system_settings LIMIT 1').get();
    const cooldownMinutes = settings?.article_cooldown_minutes || 30;

    // Try article with content first
    let article = db.prepare(`
      SELECT * FROM articles
      WHERE (on_cooldown_until IS NULL OR on_cooldown_until < datetime('now'))
      AND content IS NOT NULL AND content != '' AND length(content) > 50
      ORDER BY RANDOM() LIMIT 1
    `).get();

    // Fallback: any non-cooldown article
    if (!article) {
      article = db.prepare(`
        SELECT * FROM articles
        WHERE (on_cooldown_until IS NULL OR on_cooldown_until < datetime('now'))
        ORDER BY RANDOM() LIMIT 1
      `).get();
    }

    // Last resort: reset all cooldowns
    if (!article) {
      db.prepare("UPDATE articles SET on_cooldown_until = NULL").run();
      article = db.prepare('SELECT * FROM articles ORDER BY RANDOM() LIMIT 1').get();
    }

    if (!article) return null;

    // Set cooldown
    db.prepare(`
      UPDATE articles
      SET on_cooldown_until = datetime('now', '+' || ? || ' minutes'),
          usage_count = usage_count + 1
      WHERE id = ?
    `).run(cooldownMinutes, article.id);

    console.log('[ArticleService] Selected article:', article.title?.substring(0, 60));
    return article;
  } catch (e) {
    console.error('[ArticleService] getRandomArticle error:', e.message);
    return null;
  }
}

function getArticlesCount() {
  try {
    const db = require('../config/db');
    return db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  } catch { return 0; }
}

module.exports = {
  saveArticleToPool,
  getRandomArticle,
  backfillArticleContent,
  getArticlesCount,
};
