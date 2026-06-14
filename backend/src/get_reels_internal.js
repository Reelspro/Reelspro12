const db = require('./config/db');
const reels = db.prepare('SELECT * FROM reels').all();
console.log(JSON.stringify(reels, null, 2));
process.exit(0);
