/**
 * Detect social traffic platform from referrer and user-agent.
 */
const detectPlatform = (referrer = '', userAgent = '') => {
  const ref = referrer.toLowerCase();
  const ua = userAgent.toLowerCase();

  const fromRef = [
    ['facebook.com', 'Facebook'],
    ['fb.com', 'Facebook'],
    ['fbclid', 'Facebook'],
    ['instagram.com', 'Instagram'],
    ['tiktok.com', 'TikTok'],
    ['youtube.com', 'YouTube'],
    ['youtu.be', 'YouTube'],
    ['pinterest.com', 'Pinterest'],
    ['t.me', 'Telegram'],
    ['telegram', 'Telegram'],
    ['whatsapp', 'WhatsApp'],
    ['twitter.com', 'Twitter/X'],
    ['x.com', 'Twitter/X'],
    ['snapchat.com', 'Snapchat'],
  ];

  for (const [needle, platform] of fromRef) {
    if (ref.includes(needle)) return platform;
  }

  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('facebook')) return 'Facebook';
  if (ua.includes('instagram')) return 'Instagram';
  if (ua.includes('tiktok')) return 'TikTok';
  if (ua.includes('whatsapp')) return 'WhatsApp';
  if (ua.includes('telegram')) return 'Telegram';

  if (!referrer || ref.trim() === '') return 'Direct';
  return 'Other';
};

module.exports = { detectPlatform };
