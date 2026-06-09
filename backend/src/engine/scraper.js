const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  timeout: 15000,
});

const CONTENT_SELECTORS = [
  'article',
  '.post-content',
  '.entry-content',
  '.article-body',
  'main',
];

/**
 * Extract full article body, OG image, and metadata from a page URL
 */
const scrapeArticleContent = async (url) => {
  try {
    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);

    let content = '';
    for (const selector of CONTENT_SELECTORS) {
      const el = $(selector).first();
      if (el.length) {
        content = el.find('p').map((_, p) => $(p).text().trim()).get().filter(Boolean).join('\n');
        if (content.length > 100) break;
      }
    }
    if (!content || content.length < 50) {
      content = $('p').map((_, p) => $(p).text().trim()).get().filter((t) => t.length > 40).slice(0, 8).join('\n');
    }

    const ogImage = $('meta[property="og:image"]').attr('content') || null;
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || null;

    const metadata = {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
    };

    return {
      title: ogTitle,
      content: content.substring(0, 15000),
      og_image: ogImage,
      image: ogImage,
      metadata: JSON.stringify(metadata),
    };
  } catch (error) {
    console.error(`[Scraper] Failed to scrape article content ${url}:`, error.message);
    return null;
  }
};

const scrapeWebpage = async (url) => {
  try {
    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);

    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    const ogImage = $('meta[property="og:image"]').attr('content');

    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    return {
      title: ogTitle,
      image: ogImage,
      links: [...new Set(links)],
    };
  } catch (error) {
    console.error(`Failed to scrape webpage ${url}:`, error.message);
    return null;
  }
};

const scrapeRSS = async (url) => {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map((item) => ({
      title: item.title,
      url: item.link,
      contentSnippet: item.contentSnippet,
      content: item['content:encoded'] || item.content || item.contentSnippet || '',
      pubDate: item.pubDate,
      image: item.enclosure?.url || null,
    }));
  } catch (error) {
    console.error(`Failed to parse RSS ${url}:`, error.message);
    return null;
  }
};

module.exports = {
  scrapeWebpage,
  scrapeRSS,
  scrapeArticleContent,
  axiosInstance,
};
