const db = require('./config/db');
const renderJobs = db.prepare('SELECT * FROM render_jobs ORDER BY created_at DESC LIMIT 10').all();
console.log('Render Jobs:', JSON.stringify(renderJobs, null, 2));

const reels = db.prepare('SELECT id, status, theme, music_file, bg_type, created_at FROM reels ORDER BY created_at DESC LIMIT 10').all();
console.log('Reels:', JSON.stringify(reels, null, 2));
process.exit(0);
