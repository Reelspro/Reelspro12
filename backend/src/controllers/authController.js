const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbHelper = require('../services/dbHelper');
const db = require('../config/db');
const { logActivity } = require('../services/activityLogService');

const JWT_SECRET = process.env.JWT_SECRET || 'reels_pro_ultimate_secret';

const generateToken = (id, role, status) => {
  return jwt.sign({ id, role, status }, JWT_SECRET, { expiresIn: '30d' });
};

const stripPassword = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    const userExists = dbHelper.findOne('users', 'email', email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const allUsers = dbHelper.findAll('users');
    const systemSettings = db.prepare('SELECT auto_approve_users FROM system_settings WHERE id = 1').get();
    const autoApprove = systemSettings ? !!systemSettings.auto_approve_users : false;
    
    const role = allUsers.length === 0 ? 'admin' : 'user';
    let status = allUsers.length === 0 ? 'approved' : 'pending';
    
    if (autoApprove && role === 'user') {
      status = 'approved';
    }

    const user = dbHelper.insert('users', {
      name, email, password: hashedPassword, role, status
    });

    res.status(201).json({
      id: user.id, name: user.name, email: user.email,
      role: user.role, status: user.status,
      token: generateToken(user.id, user.role, user.status)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = dbHelper.findOne('users', 'email', email);

    if (user && (await bcrypt.compare(password, user.password))) {
      dbHelper.update('users', user.id, { last_activity: new Date().toISOString() });
      res.json({
        id: user.id, name: user.name, email: user.email,
        role: user.role, status: user.status,
        token: generateToken(user.id, user.role, user.status)
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = (req, res) => {
  const user = dbHelper.findOne('users', 'id', req.user.id);
  if (user) {
    res.json({
      id: user.id, name: user.name, email: user.email,
      role: user.role, status: user.status,
      reels_generated: user.reels_generated,
      reel_downloads: user.reel_downloads,
      clicks: user.clicks, campaigns: user.campaigns
    });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};

// ============================================================
// ADMIN USER MANAGEMENT CONTROLLERS
// ============================================================

// @desc    Admin: Get ALL users (paginated, searchable)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, role, status, reels_generated, reel_downloads, clicks, last_activity, created_at FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace(
      'SELECT id, name, email, role, status, reels_generated, reel_downloads, clicks, last_activity, created_at',
      'SELECT COUNT(*) as count'
    );
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = db.prepare(query).all(...params);

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// @desc    Admin: Get single user details + their reels
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetail = (req, res) => {
  try {
    const userId = req.params.id;

    const user = db.prepare(
      'SELECT id, name, email, role, status, reels_generated, reel_downloads, clicks, campaigns, last_activity, created_at FROM users WHERE id = ?'
    ).get(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const reels = db.prepare(`
      SELECT r.id, r.status, r.short_url, r.created_at, a.title as article_title,
             (SELECT COUNT(*) FROM clicks c WHERE c.reel_id = r.id) as click_count
      FROM reels r
      LEFT JOIN articles a ON r.article_id = a.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(userId);

    const clicksByPlatform = db.prepare(
      'SELECT platform, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY platform'
    ).all(userId);

    const clicksByCountry = db.prepare(
      'SELECT country, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY country ORDER BY count DESC LIMIT 10'
    ).all(userId);

    const clicksByDevice = db.prepare(
      'SELECT device, COUNT(*) as count FROM clicks WHERE user_id = ? GROUP BY device'
    ).all(userId);

    const clicksOverTime = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM clicks WHERE user_id = ?
      GROUP BY date(created_at)
      ORDER BY date DESC LIMIT 14
    `).all(userId).reverse();

    const topCategories = db.prepare(`
      SELECT a.source_category as category, COUNT(DISTINCT r.id) as reels_count, COUNT(c.id) as total_clicks
      FROM reels r
      JOIN articles a ON r.article_id = a.id
      LEFT JOIN clicks c ON c.reel_id = r.id
      WHERE r.user_id = ?
      GROUP BY a.source_category
      ORDER BY total_clicks DESC LIMIT 5
    `).all(userId);

    const latestClicks = db.prepare(`
      SELECT c.*, r.short_url, a.title as article_title
      FROM clicks c
      JOIN reels r ON c.reel_id = r.id
      JOIN articles a ON r.article_id = a.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC LIMIT 10
    `).all(userId);

    const activityLogs = db.prepare(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);

    res.json({
      user,
      reels,
      clicksByPlatform,
      clicksByCountry,
      clicksByDevice,
      clicksOverTime,
      topCategories,
      latestClicks,
      activityLogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user detail' });
  }
};

// @desc    Admin: Update user status (approve/reject/suspend)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = (req, res) => {
  const { status } = req.body;
  const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updated = dbHelper.update('users', req.params.id, { status });
  if (updated) {
    logActivity(parseInt(req.params.id, 10), 'status_changed', { status, byAdmin: req.user.id });
    res.json({ message: `User status updated to ${status}` });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};

// @desc    Admin: Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'user'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prevent admin from demoting themselves
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const updated = dbHelper.update('users', req.params.id, { role });
  if (updated) {
    res.json({ message: `User role updated to ${role}` });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
};

// @desc    Admin: Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user's reels and clicks first (cascade)
    db.prepare('DELETE FROM clicks WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reels WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM api_keys WHERE owner_id = ?').run(req.params.id);

    const deleted = dbHelper.remove('users', req.params.id);
    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// @desc    Admin: Get pending approvals
// @route   GET /api/auth/admin/pending
// @access  Private/Admin
const getPendingUsers = (req, res) => {
  const users = dbHelper.findMany('users', 'status', 'pending');
  res.json(users.map(stripPassword));
};

// ============================================================
// SYSTEM SETTINGS CONTROLLERS
// ============================================================

// @desc    Admin: Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
// @desc    Admin: Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSystemSettings = (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    // Convert boolean integers to true/false for frontend
    if (settings) {
      settings.auto_approve_users = !!settings.auto_approve_users;
      settings.maintenance_mode = !!settings.maintenance_mode;
      settings.update_available = !!settings.update_available;
      settings.force_update = !!settings.force_update;
    }
    res.json(settings || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// @desc    Admin: Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSystemSettings = (req, res) => {
  try {
    const {
      daily_reel_limit,
      auto_approve_users,
      default_ai_provider,
      platform_name,
      maintenance_mode,
      article_cooldown_minutes,
      update_available,
      update_version,
      update_url,
      update_changelog,
      force_update,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE system_settings 
      SET daily_reel_limit = ?, 
          auto_approve_users = ?, 
          default_ai_provider = ?, 
          platform_name = ?, 
          maintenance_mode = ?,
          article_cooldown_minutes = COALESCE(?, article_cooldown_minutes, 30),
          update_available = ?,
          update_version = ?,
          update_url = ?,
          update_changelog = ?,
          force_update = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(
      daily_reel_limit,
      auto_approve_users ? 1 : 0,
      default_ai_provider,
      platform_name,
      maintenance_mode ? 1 : 0,
      article_cooldown_minutes != null ? article_cooldown_minutes : null,
      update_available ? 1 : 0,
      update_version != null ? update_version : '',
      update_url != null ? update_url : '',
      update_changelog != null ? update_changelog : '',
      force_update ? 1 : 0
    );

    const updated = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
    if (updated) {
      updated.auto_approve_users = !!updated.auto_approve_users;
      updated.maintenance_mode = !!updated.maintenance_mode;
      updated.update_available = !!updated.update_available;
      updated.force_update = !!updated.force_update;
    }
    
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getPendingUsers,
  updateUserStatus,
  getAllUsers,
  getUserDetail,
  updateUserRole,
  deleteUser,
  getSystemSettings,
  updateSystemSettings
};
