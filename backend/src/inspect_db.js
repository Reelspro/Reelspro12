const db = require('./config/db');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='reels'").get();
console.log(schema.sql);
process.exit(0);
