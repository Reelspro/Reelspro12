const { scraperQueue } = require('../config/queues');
const { scrapeAllSources, scrapeSource } = require('../services/scraper_service');

// Process 2 jobs concurrently
scraperQueue.process(2, async (job) => {
  console.log('[ScraperWorker] Job received:', job.data);
  try {
    if (job.data.scrapeAll) {
      const results = await scrapeAllSources();
      return results;
    }
    if (job.data.sourceId) {
      const results = await scrapeSource(job.data.sourceId);
      return results;
    }
  } catch (e) {
    console.error('[ScraperWorker] Error:', e.message);
    throw e;
  }
});

scraperQueue.on('completed', (job, result) => {
  console.log('[ScraperWorker] Completed job:', job.id);
});

scraperQueue.on('failed', (job, err) => {
  console.error('[ScraperWorker] Failed job:', job?.id, err.message);
});

module.exports = { scraperWorker: scraperQueue };
