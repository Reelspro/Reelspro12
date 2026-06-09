const dbHelper = require('../services/dbHelper');
const { appendUTMParams } = require('../engine/shortenerEngine');
const { detectPlatform } = require('../utils/platformDetector');
const geoip = require('geoip-lite');

// @desc    Handle short URL redirection and log analytics
// @route   GET /r/:shortToken
// @access  Public
const handleRedirect = (req, res) => {
  try {
    const { shortToken } = req.params;

    // 1. Find the reel associated with this short token
    const db = require('../config/db');
    const { BASE_URL } = require('../services/shortener_service');
    const fullUrl = `${BASE_URL}/r/${shortToken}`;

    const stmt = db.prepare(`
      SELECT r.*, a.url as article_url, a.title as article_title, a.source_category
      FROM reels r 
      JOIN articles a ON r.article_id = a.id 
      WHERE r.short_url = ? OR r.short_url = ?
    `);
    const reel = stmt.get(shortToken, fullUrl);

    if (!reel) {
      // If not found, redirect to a fallback or show 404
      return res.status(404).send('Link not found or expired.');
    }

    // 2. Extract analytics data from the request
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const referrer = req.headers['referer'] || '';
    
    // Basic User-Agent parsing (in Phase 13 this will be expanded with actual detectors)
    const isMobile = /mobile/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                    userAgent.includes('Safari') ? 'Safari' : 
                    userAgent.includes('Firefox') ? 'Firefox' : 'Other';
    const os = userAgent.includes('Windows') ? 'Windows' : 
               userAgent.includes('Mac OS') ? 'MacOS' : 
               userAgent.includes('Linux') ? 'Linux' : 
               userAgent.includes('Android') ? 'Android' : 
               userAgent.includes('iOS') ? 'iOS' : 'Other';

    const platform = detectPlatform(referrer, userAgent);

    // Country detection using geoip-lite
    // If running locally, IP might be ::1 or 127.0.0.1, geoip will return null
    const geo = geoip.lookup(ipAddress);
    const country = geo ? geo.country : 'Unknown';
    const city = geo ? geo.city : 'Unknown';

    // 3. Log the click asynchronously in the database
    try {
      const clickData = {
        reel_id: reel.id,
        user_id: reel.user_id,
        campaign_id: reel.campaign_token,
        platform,
        country,
        city,
        browser,
        os,
        device,
        ip_address: ipAddress,
        referrer
      };
      
      db.prepare(`UPDATE utm_links SET click_count = click_count + 1 WHERE short_code = ?`).run(shortToken);

      const insertResult = dbHelper.insert('clicks', {
        ...clickData,
        source_category: reel.source_category,
        utm_source: reel.campaign_token,
        utm_campaign: reel.campaign_token,
      });

      const user = dbHelper.findOne('users', 'id', reel.user_id);
      const socketPayload = {
        ...clickData,
        id: insertResult.id,
        created_at: new Date().toISOString(),
        short_url: reel.short_url,
        article_title: reel.article_title,
        source_category: reel.source_category,
        user_name: user?.name,
        user_email: user?.email,
      };

      const server = require('../server');
      if (server.io) {
        server.io.to(`user_${reel.user_id}`).emit('new_click', socketPayload);
        server.io.to('admin').emit('new_click', socketPayload);
      }

      if (user) {
        dbHelper.update('users', user.id, {
          clicks: (user.clicks || 0) + 1,
          last_activity: new Date().toISOString(),
        });
      }
    } catch (logError) {
      console.error('Failed to log click analytics:', logError.message);
      // We don't fail the redirect if logging fails
    }

    // 4. Construct final destination URL with UTM parameters
    const destinationUrl = appendUTMParams(reel.article_url, {
      source: platform.toLowerCase(),
      medium: 'shortlink',
      campaign: reel.campaign_token
    });

    // 5. Perform the redirect
    res.redirect(302, destinationUrl);

  } catch (error) {
    console.error('[RedirectController] Error handling redirect:', error);
    res.status(500).send('An error occurred during redirection.');
  }
};

module.exports = {
  handleRedirect
};
