const db = require('../config/db');
const { generateShortToken, generateCampaignToken } = require('../engine/shortenerEngine');

const BASE_URL = process.env.SHORT_URL_BASE || process.env.APP_URL || 'http://localhost:5000';

async function createLink(reelId, userId, originalUrl) {
  const shortCode = generateShortToken(8); // Longer token for unlimited links
  const campaignToken = generateCampaignToken();
  const utmCampaign = campaignToken.replace('c_', '');

  // Unlimited dynamic UTM tags
  const SOURCES = ['tiktok', 'youtube', 'instagram', 'facebook', 'twitter', 'reddit', 'pinterest', 'snapchat', 'threads', 'reelspro'];
  const MEDIUMS = ['video', 'shorts', 'reels', 'story', 'post', 'social', 'feed', 'viral'];
  const utmSource = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const utmMedium = MEDIUMS[Math.floor(Math.random() * MEDIUMS.length)];

  db.prepare(`
    INSERT INTO utm_links (short_code, original_url, reel_id, user_id, utm_source, utm_medium, utm_campaign, campaign_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(shortCode, originalUrl, reelId, userId, utmSource, utmMedium, utmCampaign, campaignToken);

  const shortUrl = `${BASE_URL}/r/${shortCode}`;

  return {
    shortCode,
    shortUrl,
    utmCode: utmCampaign,
    campaignToken,
  };
}

module.exports = { createLink, BASE_URL };
