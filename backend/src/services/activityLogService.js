const dbHelper = require('./dbHelper');

const logActivity = (userId, action, details = null) => {
  try {
    dbHelper.insert('activity_logs', {
      user_id: userId || null,
      action,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.warn('[ActivityLog] Failed to log:', err.message);
  }
};

module.exports = { logActivity };
