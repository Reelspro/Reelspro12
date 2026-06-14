const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'reels_pro.db');
const db = new Database(dbPath);
const reels = db.prepare('SELECT * FROM reels').all();
console.log(JSON.stringify(reels, null, 2));
db.close();
