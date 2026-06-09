const Bull = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const scrapingQueue = new Bull('ScrapingQueue', { redis: redisConfig });
const renderingQueue = new Bull('RenderingQueue', { redis: redisConfig });
const imageProcessingQueue = new Bull('ImageProcessingQueue', { redis: redisConfig });
const analyticsQueue = new Bull('AnalyticsQueue', { redis: redisConfig });
const retriesQueue = new Bull('RetriesQueue', { redis: redisConfig });

const scraperQueue = new Bull('scraperQueue', { redis: redisConfig });

module.exports = {
  scrapingQueue,
  renderingQueue,
  imageProcessingQueue,
  analyticsQueue,
  retriesQueue,
  scraperQueue,
};
