const dbHelper = require('../services/dbHelper');

// @desc    Get all website sources
// @route   GET /api/sources
// @access  Private/Admin
const getSources = (req, res) => {
  try {
    const sources = dbHelper.findAll('website_sources');
    res.json(sources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching sources' });
  }
};

// @desc    Add a new website/category source
// @route   POST /api/sources
// @access  Private/Admin
const addSource = (req, res) => {
  try {
    const { type, url, category_name } = req.body;

    if (!type || !url) {
      return res.status(400).json({ error: 'Type and URL are required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const db = require('../config/db');

    // Auto-delete any previously added website sources (cascade delete everything)
    const existingSources = db.prepare('SELECT id FROM website_sources').all();
    if (existingSources.length > 0) {
      console.log(`[SourceController] Auto-deleting ${existingSources.length} existing sources to replace with new website.`);
      
      db.transaction(() => {
        for (const src of existingSources) {
          const sourceId = src.id;
          
          // 1. Delete clicks
          db.prepare(`
            DELETE FROM clicks 
            WHERE reel_id IN (
              SELECT r.id FROM reels r 
              JOIN articles a ON r.article_id = a.id 
              WHERE a.website_source_id = ?
            )
          `).run(sourceId);

          // 2. Delete render jobs
          db.prepare(`
            DELETE FROM render_jobs 
            WHERE reel_id IN (
              SELECT r.id FROM reels r 
              JOIN articles a ON r.article_id = a.id 
              WHERE a.website_source_id = ?
            )
          `).run(sourceId);

          // 3. Delete reel_scripts
          db.prepare(`
            DELETE FROM reel_scripts 
            WHERE reel_id IN (
              SELECT r.id FROM reels r 
              JOIN articles a ON r.article_id = a.id 
              WHERE a.website_source_id = ?
            )
          `).run(sourceId);

          // 4. Delete utm_links
          db.prepare(`
            DELETE FROM utm_links 
            WHERE reel_id IN (
              SELECT r.id FROM reels r 
              JOIN articles a ON r.article_id = a.id 
              WHERE a.website_source_id = ?
            )
          `).run(sourceId);

          // 5. Delete reels
          db.prepare(`
            DELETE FROM reels 
            WHERE article_id IN (
              SELECT id FROM articles WHERE website_source_id = ?
            )
          `).run(sourceId);

          // 6. Delete articles
          db.prepare(`DELETE FROM articles WHERE website_source_id = ?`).run(sourceId);

          // 7. Delete the website source itself
          db.prepare('DELETE FROM website_sources WHERE id = ?').run(sourceId);
        }
      })();
    }

    // Insert the new single source
    const source = dbHelper.insert('website_sources', {
      type: 'website',
      url,
      category_name: category_name || null,
      added_by: req.user?.id || 1,
      is_active: 1,
      scrape_interval: 3600
    });

    res.status(201).json(source);
  } catch (error) {
    console.error('[SourceController] addSource error:', error.message);
    res.status(500).json({ error: `Backend Error: ${error.message}` });
  }
};

// @desc    Update a source
// @route   PUT /api/sources/:id
// @access  Private/Admin
const updateSource = (req, res) => {
  try {
    const { type, url, category_name } = req.body;
    
    // Check if exists
    const existing = dbHelper.findOne('website_sources', 'id', req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Source not found' });
    }

    const updated = dbHelper.update('website_sources', req.params.id, {
      type: type || existing.type,
      url: url || existing.url,
      category_name: category_name !== undefined ? category_name : existing.category_name
    });

    if (updated) {
      res.json({ message: 'Source updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update source' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating source' });
  }
};

// @desc    Delete a source
// @route   DELETE /api/sources/:id
// @access  Private/Admin
const deleteSource = (req, res) => {
  try {
    const sourceId = req.params.id;
    const db = require('../config/db');

    // Start transaction to delete articles and cascade to reels, scripts, jobs, clicks, and utm_links
    const deleteTx = db.transaction(() => {
      // 1. Delete clicks associated with reels of these articles
      db.prepare(`
        DELETE FROM clicks 
        WHERE reel_id IN (
          SELECT r.id FROM reels r 
          JOIN articles a ON r.article_id = a.id 
          WHERE a.website_source_id = ?
        )
      `).run(sourceId);

      // 2. Delete render jobs associated with reels of these articles
      db.prepare(`
        DELETE FROM render_jobs 
        WHERE reel_id IN (
          SELECT r.id FROM reels r 
          JOIN articles a ON r.article_id = a.id 
          WHERE a.website_source_id = ?
        )
      `).run(sourceId);

      // 3. Delete reel_scripts associated with reels of these articles
      db.prepare(`
        DELETE FROM reel_scripts 
        WHERE reel_id IN (
          SELECT r.id FROM reels r 
          JOIN articles a ON r.article_id = a.id 
          WHERE a.website_source_id = ?
        )
      `).run(sourceId);

      // 4. Delete utm_links associated with reels of these articles
      db.prepare(`
        DELETE FROM utm_links 
        WHERE reel_id IN (
          SELECT r.id FROM reels r 
          JOIN articles a ON r.article_id = a.id 
          WHERE a.website_source_id = ?
        )
      `).run(sourceId);

      // 5. Delete reels associated with these articles
      db.prepare(`
        DELETE FROM reels 
        WHERE article_id IN (
          SELECT id FROM articles WHERE website_source_id = ?
        )
      `).run(sourceId);

      // 6. Delete the articles themselves
      db.prepare(`DELETE FROM articles WHERE website_source_id = ?`).run(sourceId);

      // 7. Finally, delete the website source
      return db.prepare('DELETE FROM website_sources WHERE id = ?').run(sourceId).changes;
    });

    const changes = deleteTx();

    if (changes > 0) {
      res.json({ message: 'Source and all associated articles, reels, click data, and short links removed successfully' });
    } else {
      res.status(404).json({ error: 'Source not found' });
    }
  } catch (error) {
    console.error('[SourceController] deleteSource error:', error.message);
    res.status(500).json({ error: `Server error deleting source: ${error.message}` });
  }
};

module.exports = {
  getSources,
  addSource,
  updateSource,
  deleteSource
};
