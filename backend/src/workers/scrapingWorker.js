const { scrapingQueue } = require('../config/queues');
const dbHelper = require('../services/dbHelper');
const { scrapeWebpage, scrapeRSS } = require('../engine/scraper');
const { saveArticleToPool } = require('../services/articleService');

scrapingQueue.process(5, async (job) => {
  const { sourceId } = job.data;

  let sources = [];
  if (sourceId) {
    const source = dbHelper.findOne('website_sources', 'id', sourceId);
    if (source) sources = [source];
  } else {
    sources = dbHelper.findAll('website_sources');
  }

  if (sources.length === 0) return { success: true, count: 0 };

  console.log(`[ScrapingWorker] Processing ${sources.length} sources in job ${job.id}`);

  let totalAdded = 0;
  let totalUpdated = 0;

  for (const source of sources) {
    console.log(`[ScrapingWorker] Scraping: ${source.url}`);
    try {
      let articles = await scrapeRSS(source.url);

      if (!articles || articles.length === 0) {
        const webpageData = await scrapeWebpage(source.url);
        if (webpageData && webpageData.links) {
          articles = webpageData.links.slice(0, 30).map((link) => ({
            title: webpageData.title || link,
            url: link,
            image: webpageData.image,
          }));
        }
      }

      if (articles && articles.length > 0) {
        let addedCount = 0;
        let updatedCount = 0;
        for (const item of articles.slice(0, 40)) {
          const fullUrl = item.url && item.url.startsWith('http')
            ? item.url
            : new URL(item.url, source.url).href;

          const result = await saveArticleToPool({
            title: item.title,
            url: fullUrl,
            image: item.image || null,
            content: item.content || item.contentSnippet || null,
            source_category: source.category_name || source.type,
            website_source_id: source.id,
          });

          if (result === true) addedCount++;
          else if (result === 'updated') updatedCount++;
        }
        totalAdded += addedCount;
        totalUpdated += updatedCount;

        dbHelper.update('website_sources', source.id, {
          last_scraped: new Date().toISOString(),
          article_count: (source.article_count || 0) + addedCount,
        });

        console.log(`[ScrapingWorker] ${source.url}: +${addedCount} new, ${updatedCount} updated`);
      }
    } catch (error) {
      console.error(`[ScrapingWorker] Error processing ${source.url}:`, error.message);
    }
  }

  return { success: true, added: totalAdded, updated: totalUpdated };
});

scrapingQueue.on('completed', (job) => {
  console.log(`[ScrapingWorker] Job ${job.id} completed`);
});

scrapingQueue.on('failed', (job, err) => {
  console.error(`[ScrapingWorker] Job ${job.id} failed:`, err.message);
});

console.log('[ScrapingWorker] Worker ready and listening...');

module.exports = scrapingQueue;
