// FIX 5: Backfill og_image and metadata for articles that are missing it
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/config/db');
const axios = require('axios');
const cheerio = require('cheerio');

async function backfill() {
  const articles = db.prepare("SELECT id, url FROM articles WHERE og_image IS NULL OR og_image = '' OR og_image = 'null'").all();
  console.log(`[backfill] Found ${articles.length} articles missing og_image.`);

  const updateStmt = db.prepare("UPDATE articles SET og_image=?, metadata=? WHERE id=?");

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    try {
      const { data } = await axios.get(article.url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const $ = cheerio.load(data);
      const og_image = $('meta[property="og:image"]').attr('content') ||
                       $('meta[name="twitter:image"]').attr('content') || null;
      const description = $('meta[name="description"]').attr('content') || null;
      const keywords = $('meta[name="keywords"]').attr('content') || null;
      const metadata = JSON.stringify({ description, keywords });

      updateStmt.run(og_image, metadata, article.id);
      console.log(`[${i + 1}/${articles.length}] OK: og_image=${og_image ? 'found' : 'null'} | ${article.url.substring(0, 60)}`);
    } catch (err) {
      console.log(`[${i + 1}/${articles.length}] SKIP: ${err.message.substring(0, 60)}`);
    }
    // Polite delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('[backfill] Complete.');
}

backfill().catch(console.error);
