const cron = require('node-cron');
const { scrapingQueue } = require('../config/queues');

const dbHelper = require('../services/dbHelper');

// Run the scraping job every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Cron] Fetching sources for scheduled scraping...');
  try {
    const sources = dbHelper.findAll('website_sources');
    
    if (sources.length === 0) {
      console.log('[Cron] No website sources found to scrape.');
      return;
    }

    for (const source of sources) {
      await scrapingQueue.add({ sourceId: source.id }, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 2
      });
    }
    
    console.log(`[Cron] \${sources.length} scraping jobs queued.`);
  } catch (error) {
    console.error('[Cron] Failed to dispatch scraping jobs:', error.message);
  }
});

console.log('[Cron] Scraper cron schedule registered (every 30 min).');
