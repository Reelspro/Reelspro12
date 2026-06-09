const dbHelper = require('../services/dbHelper');
const { encrypt, decrypt } = require('../services/encryptionService');

// @desc    Get API keys for admin (system keys) or sub-user (user keys)
// @route   GET /api/keys
// @access  Private
const getApiKeys = (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let query;
    let params;

    const db = require('../config/db');
    if (isAdmin) {
      // Admins see system keys
      const stmt = db.prepare(`SELECT id, provider, owner_id, type, created_at FROM api_keys WHERE type = 'system' OR type = 'admin'`);
      res.json(stmt.all());
    } else {
      // Sub-users see their own keys
      const stmt = db.prepare(`SELECT id, provider, owner_id, type, created_at FROM api_keys WHERE owner_id = ? AND type = 'user'`);
      res.json(stmt.all(req.user.id));
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching API keys' });
  }
};

// @desc    Add a new API key
// @route   POST /api/keys
// @access  Private
const addApiKey = (req, res) => {
  try {
    const { provider, api_key } = req.body;
    if (!provider || !api_key) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    const type = req.user.role === 'admin' ? 'system' : 'user';
    const encryptedKey = encrypt(api_key);

    if (!encryptedKey) {
      return res.status(500).json({ error: 'Failed to encrypt API key' });
    }

    // Check if key for provider already exists for this user/system
    const db = require('../config/db');
    let existing;
    if (type === 'system') {
      existing = db.prepare(`SELECT id FROM api_keys WHERE provider = ? AND type IN ('system', 'admin')`).get(provider);
    } else {
      existing = db.prepare(`SELECT id FROM api_keys WHERE provider = ? AND owner_id = ? AND type = 'user'`).get(provider, req.user.id);
    }

    if (existing) {
      // Update existing key
      dbHelper.update('api_keys', existing.id, { api_key: encryptedKey });
      res.json({ message: 'API key updated successfully' });
    } else {
      // Insert new key
      const newKey = dbHelper.insert('api_keys', {
        provider,
        api_key: encryptedKey,
        owner_id: req.user.id,
        type
      });
      // Do not send back the actual key value
      const { api_key: removed, ...safeData } = newKey;
      res.status(201).json(safeData);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding API key' });
  }
};

// @desc    Delete an API key
// @route   DELETE /api/keys/:id
// @access  Private
const deleteApiKey = (req, res) => {
  try {
    const key = dbHelper.findOne('api_keys', 'id', req.params.id);
    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (req.user.role !== 'admin' && key.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this key' });
    }

    dbHelper.remove('api_keys', req.params.id);
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting API key' });
  }
};

module.exports = {
  getApiKeys,
  addApiKey,
  deleteApiKey
};
