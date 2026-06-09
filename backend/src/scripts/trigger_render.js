const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'reelspro-super-secret-jwt-key-change-in-production';
const user = { id: 1, name: 'Admin User', role: 'admin', status: 'approved' };
const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

async function trigger() {
  console.log('[Trigger] Sending generate request...');
  try {
    const res = await axios.post('http://localhost:5000/api/reels/generate', {
      theme: 'suspense',
      duration: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('[Trigger] Success:', res.data);
  } catch (err) {
    console.error('[Trigger] Failed:', err.response?.data || err.message);
  }
}

trigger();
