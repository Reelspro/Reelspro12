const db = require('./db');

try { db.prepare("ALTER TABLE reels ADD COLUMN bg_type TEXT DEFAULT 'none'").run(); } catch(e) {}
try { db.prepare("ALTER TABLE reels ADD COLUMN bg_image_path TEXT").run(); } catch(e) {}
