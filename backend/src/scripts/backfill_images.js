const db = require('../config/db');

async function backfill() {
  console.log('[Backfill] Starting image backfill for articles...');
  
  const articles = db.prepare(`
    SELECT id, title FROM articles 
    WHERE image IS NULL OR image = '' OR image = 'null'
  `).all();

  console.log(`[Backfill] Found ${articles.length} articles to update.`);

  const update = db.prepare('UPDATE articles SET image = ?, og_image = ? WHERE id = ?');

  for (const art of articles) {
    // Use a high-quality relevant-looking placeholder from Picsum
    // We use the ID as a seed for variety
    const placeholder = `https://picsum.photos/seed/article${art.id}/1200/630`;
    try {
      update.run(placeholder, placeholder, art.id);
      console.log(`[Backfill] Updated Article #${art.id}: ${art.title.substring(0, 30)}...`);
    } catch (err) {
      console.error(`[Backfill] Failed to update Article #${art.id}:`, err.message);
    }
  }

  console.log('[Backfill] Done.');
}

backfill();
