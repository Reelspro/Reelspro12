const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const db = require('../config/db');

const parser = new Parser({ timeout: 8000 });

function unescapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');
}

async function fetchHtml(url) {
  const cleanUrl = unescapeHtml(url);
  try {
    const res = await axios.get(cleanUrl, {
      timeout: 10000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    return res.data;
  } catch (err) {
    if (err.response && (err.response.status === 403 || err.response.status === 409 || err.response.status === 503)) {
      console.log(`[Scraper] Standard fetch failed (${err.response.status}). Retrying via Google Translate proxy for:`, cleanUrl);
      try {
        const translateUrl = 'https://translate.google.com/translate?sl=auto&tl=en&hl=en-GB&u=' + encodeURIComponent(cleanUrl);
        const res = await axios.get(translateUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        return res.data;
      } catch (proxyErr) {
        console.error('[Scraper] Proxy fetch also failed:', proxyErr.message);
        throw proxyErr;
      }
    }
    throw err;
  }
}

async function scrapeSourceUrl(url, sourceId, category) {
  url = unescapeHtml(url).replace(/\/+$/, '');
  const saved = [];

  // TRY RSS FIRST
  const rssAttempts = [
    url + '/feed',
    url + '/rss',
    url + '/feed/rss2',
    url + '/rss.xml',
    url,
  ];

  let rssDone = false;
  for (const feedUrl of rssAttempts) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of (feed.items || []).slice(0, 15)) {
        const title = item.title?.trim();
        const articleUrl = item.link?.trim();
        if (!title || !articleUrl) continue;

        const image = item.enclosure?.url || null;
        const content = item.contentSnippet || item.content || item.summary || '';
        const metadata = JSON.stringify({
          description: item.contentSnippet || '',
          keywords: category || '',
          pubDate: item.pubDate || '',
        });

        try {
          db.prepare(`
            INSERT OR IGNORE INTO articles (title, url, image, og_image, content, metadata, source_category, website_source_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(title, articleUrl, image, image, content.substring(0, 5000), metadata, category || 'general', sourceId);
          saved.push(title);
        } catch (e) {}
      }
      if (saved.length > 0) { rssDone = true; break; }
    } catch (e) {}
  }

  // CHEERIO FALLBACK if RSS gave nothing
  if (!rssDone) {
    try {
      const mainHtml = await fetchHtml(url);
      const $ = cheerio.load(mainHtml);

      // Extract article links
      const articleLinks = new Set();
      $('article a, .post a, .entry a, h2 a, h3 a, .title a, .headline a').each((i, el) => {
        const href = $(el).attr('href');
        if (!href || href === '#' || href.startsWith('javascript')) return;
        
        // Handle Google Translate URL rewriting
        if (href.includes('.translate.goog') || href.includes('translate.googleusercontent.com')) {
          try {
            const u = new URL(href);
            const originalHost = new URL(unescapeHtml(url)).host;
            const originalArticleUrl = `https://${originalHost}${u.pathname}`;
            articleLinks.add(originalArticleUrl);
            return;
          } catch (e) {}
        }

        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
        if (fullUrl.startsWith(url) || fullUrl.includes(new URL(url).hostname)) {
          articleLinks.add(fullUrl);
        }
      });

      // Scrape each article page
      const links = [...articleLinks].slice(0, 10);
      for (const articleUrl of links) {
        try {
          const articleHtml = await fetchHtml(articleUrl);
          const a$ = cheerio.load(articleHtml);

          const title = (
            a$('h1').first().text() ||
            a$('h2').first().text() ||
            a$('.post-title').first().text() ||
            a$('.entry-title').first().text() ||
            a$('title').text()
          ).trim();

          if (!title || title.length < 5) continue;

          const contentParts = [];
          a$('article p, .post-content p, .entry-content p, .article-body p, main p').each((i, el) => {
            const text = a$(el).text().trim();
            if (text.length > 30) contentParts.push(text);
          });
          const content = contentParts.join(' ').substring(0, 5000);

          const ogImage = a$('meta[property="og:image"]').attr('content') || null;
          const firstImg = a$('article img, .post-content img').first().attr('src') || null;
          const image = ogImage || firstImg || null;

          const description = a$('meta[name="description"]').attr('content') || '';
          const keywords = a$('meta[name="keywords"]').attr('content') || category || '';
          const metadata = JSON.stringify({ description, keywords });

          try {
            db.prepare(`
              INSERT OR IGNORE INTO articles (title, url, image, og_image, content, metadata, source_category, website_source_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(title, articleUrl, image, ogImage, content, metadata, category || 'general', sourceId);
            saved.push(title);
          } catch (e) {}
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[Scraper] Cheerio failed for', url, ':', e.message);
    }
  }

  // Update source stats
  if (saved.length > 0) {
    try {
      db.prepare(`
        UPDATE website_sources
        SET last_scraped = CURRENT_TIMESTAMP,
            article_count = (SELECT COUNT(*) FROM articles WHERE website_source_id = ?)
        WHERE id = ?
      `).run(sourceId, sourceId);
    } catch (e) {}
  }

  console.log('[Scraper] Source', sourceId, '— saved', saved.length, 'articles from', url);
  return saved;
}

async function scrapeSource(sourceId) {
  try {
    const source = db.prepare('SELECT * FROM website_sources WHERE id = ?').get(sourceId);
    if (!source) { console.warn('[Scraper] Source not found:', sourceId); return []; }
    return await scrapeSourceUrl(source.url, source.id, source.category_name);
  } catch (e) {
    console.error('[Scraper] scrapeSource error:', e.message);
    return [];
  }
}

async function scrapeAllSources() {
  try {
    const sources = db.prepare('SELECT * FROM website_sources WHERE is_active = 1').all();
    console.log('[Scraper] Starting scrape for', sources.length, 'sources');
    const results = [];
    for (const source of sources) {
      try {
        const saved = await scrapeSourceUrl(source.url, source.id, source.category_name);
        results.push({ sourceId: source.id, url: source.url, saved: saved.length });
      } catch (e) {
        console.error('[Scraper] Failed source', source.id, ':', e.message);
      }
    }
    const total = results.reduce((s, r) => s + r.saved, 0);
    console.log('[Scraper] All done — total saved:', total, 'articles');
    return results;
  } catch (e) {
    console.error('[Scraper] scrapeAllSources error:', e.message);
    return [];
  }
}

module.exports = { scrapeAllSources, scrapeSource, scrapeSourceUrl };
