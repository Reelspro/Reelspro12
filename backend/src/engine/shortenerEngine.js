const crypto = require('crypto');

/**
 * Generate a unique short URL token (6-8 characters)
 */
const generateShortToken = (length = 7) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

/**
 * Generate a unique UTM campaign token
 */
const generateCampaignToken = () => {
  return 'c_' + crypto.randomBytes(4).toString('hex');
};

/**
 * Construct the final destination URL with UTM parameters
 * @param {string} baseUrl - The original article URL
 * @param {object} params - { source, medium, campaign }
 */
const appendUTMParams = (baseUrl, { source = 'reelspro', medium = 'video', campaign = '' }) => {
  try {
    const url = new URL(baseUrl);
    url.searchParams.append('utm_source', source);
    url.searchParams.append('utm_medium', medium);
    if (campaign) {
      url.searchParams.append('utm_campaign', campaign);
    }
    return url.href;
  } catch (error) {
    console.error('Invalid URL for UTM appending:', baseUrl);
    return baseUrl; // Return original if parsing fails
  }
};

module.exports = {
  generateShortToken,
  generateCampaignToken,
  appendUTMParams
};
