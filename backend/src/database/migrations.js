const db = require('../config/db');

const safeAlter = (sql) => {
  try {
    db.exec(sql);
  } catch (_) {
    // Column or constraint may already exist
  }
};

const runMigrations = () => {
  console.log('Running database migrations...');
  
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'pending',
      reels_generated INTEGER DEFAULT 0,
      reel_downloads INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      campaigns INTEGER DEFAULT 0,
      last_activity DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Website Sources
  db.exec(`
    CREATE TABLE IF NOT EXISTS website_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'website' or 'category'
      url TEXT NOT NULL,
      category_name TEXT,
      added_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (added_by) REFERENCES users(id)
    )
  `);

  // Articles Pool
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      image TEXT,
      source_category TEXT,
      website_source_id INTEGER,
      usage_count INTEGER DEFAULT 0,
      on_cooldown_until DATETIME,
      virality_score REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (website_source_id) REFERENCES website_sources(id)
    )
  `);

  // Reels — uses TEXT UUID primary key
  db.exec(`
    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      article_id INTEGER NOT NULL,
      status TEXT DEFAULT 'processing',
      file_path TEXT,
      thumbnail_path TEXT,
      short_url TEXT,
      utm_code TEXT,
      campaign_token TEXT,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (article_id) REFERENCES articles(id)
    )
  `);

  // Clicks Analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reel_id TEXT,
      user_id INTEGER,
      campaign_id TEXT,
      platform TEXT,
      country TEXT,
      city TEXT,
      browser TEXT,
      os TEXT,
      device TEXT,
      ip_address TEXT,
      referrer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reel_id) REFERENCES reels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // API Keys
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      owner_id INTEGER,
      type TEXT DEFAULT 'system', -- 'admin', 'user', 'system'
      is_active INTEGER DEFAULT 1,
      quota_exceeded INTEGER DEFAULT 0,
      quota_reset_at TEXT,
      model TEXT,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // Activity Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // System Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      daily_reel_limit INTEGER DEFAULT 50,
      auto_approve_users BOOLEAN DEFAULT 0,
      default_ai_provider TEXT DEFAULT 'groq',
      platform_name TEXT DEFAULT 'ReelsPro Ultimate',
      maintenance_mode BOOLEAN DEFAULT 0,
      storage_type TEXT DEFAULT 'local',
      default_theme TEXT DEFAULT 'modern',
      max_concurrent_renders INTEGER DEFAULT 3,
      rate_limit_requests INTEGER DEFAULT 100,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get().count;
  if (settingsCount === 0) {
    db.prepare(`
      INSERT INTO system_settings (id, daily_reel_limit, auto_approve_users, default_ai_provider, platform_name, maintenance_mode, storage_type, default_theme, max_concurrent_renders, rate_limit_requests) 
      VALUES (1, 50, 0, 'groq', 'ReelsPro Ultimate', 0, 'local', 'modern', 3, 100)
    `).run();
  }

  safeAlter(`ALTER TABLE system_settings ADD COLUMN article_cooldown_minutes INTEGER DEFAULT 30`);
  safeAlter(`ALTER TABLE system_settings ADD COLUMN update_available BOOLEAN DEFAULT 0`);
  safeAlter(`ALTER TABLE system_settings ADD COLUMN update_version TEXT DEFAULT ''`);
  safeAlter(`ALTER TABLE system_settings ADD COLUMN update_url TEXT DEFAULT ''`);
  safeAlter(`ALTER TABLE system_settings ADD COLUMN update_changelog TEXT DEFAULT ''`);
  safeAlter(`ALTER TABLE system_settings ADD COLUMN force_update BOOLEAN DEFAULT 0`);

  // PHASE A — New tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS utm_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      reel_id TEXT,
      user_id INTEGER,
      utm_source TEXT,
      utm_medium TEXT DEFAULT 'social',
      utm_campaign TEXT,
      campaign_token TEXT UNIQUE,
      click_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reel_scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reel_id TEXT NOT NULL,
      article_id INTEGER,
      scenes_json TEXT,
      caption TEXT,
      hashtags TEXT,
      cta_text TEXT DEFAULT '📖 Full Read Story Details In Comments 👇',
      ai_provider TEXT,
      ai_model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reel_id) REFERENCES reels(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS music_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      category TEXT NOT NULL,
      emotion TEXT,
      duration REAL,
      file_path TEXT NOT NULL,
      use_count INTEGER DEFAULT 0,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS render_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reel_id TEXT NOT NULL,
      user_id INTEGER,
      status TEXT DEFAULT 'queued',
      progress INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reel_id) REFERENCES reels(id)
    )
  `);

  // PHASE A — Missing columns on existing tables
  safeAlter(`ALTER TABLE articles ADD COLUMN content TEXT`);
  safeAlter(`ALTER TABLE articles ADD COLUMN og_image TEXT`);
  safeAlter(`ALTER TABLE articles ADD COLUMN metadata TEXT`);

  safeAlter(`ALTER TABLE reels ADD COLUMN theme TEXT DEFAULT 'suspense'`);
  safeAlter(`ALTER TABLE reels ADD COLUMN hashtags TEXT`);
  safeAlter(`ALTER TABLE reels ADD COLUMN music_file TEXT`);
  safeAlter(`ALTER TABLE reels ADD COLUMN scenes_json TEXT`);
  safeAlter(`ALTER TABLE reels ADD COLUMN render_progress INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE reels ADD COLUMN duration INTEGER DEFAULT 10`);
  safeAlter(`ALTER TABLE reels ADD COLUMN bg_type TEXT DEFAULT 'none'`);
  safeAlter(`ALTER TABLE reels ADD COLUMN bg_image_path TEXT`);

  safeAlter(`ALTER TABLE clicks ADD COLUMN source_category TEXT`);
  safeAlter(`ALTER TABLE clicks ADD COLUMN utm_source TEXT`);
  safeAlter(`ALTER TABLE clicks ADD COLUMN utm_campaign TEXT`);

  safeAlter(`ALTER TABLE website_sources ADD COLUMN is_active BOOLEAN DEFAULT 1`);
  safeAlter(`ALTER TABLE website_sources ADD COLUMN last_scraped DATETIME`);
  safeAlter(`ALTER TABLE website_sources ADD COLUMN article_count INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE website_sources ADD COLUMN scrape_interval INTEGER DEFAULT 3600`);

  // OTP columns for signup verification
  safeAlter(`ALTER TABLE users ADD COLUMN otp TEXT`);
  safeAlter(`ALTER TABLE users ADD COLUMN otp_expires DATETIME`);


  // Indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
    CREATE INDEX IF NOT EXISTS idx_reels_short_url ON reels(short_url);
    CREATE INDEX IF NOT EXISTS idx_clicks_campaign_id ON clicks(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_articles_cooldown ON articles(on_cooldown_until);
    CREATE INDEX IF NOT EXISTS idx_utm_links_short_code ON utm_links(short_code);
    CREATE INDEX IF NOT EXISTS idx_reel_scripts_reel_id ON reel_scripts(reel_id);
    CREATE INDEX IF NOT EXISTS idx_render_jobs_reel_id ON render_jobs(reel_id);
  `);

  // FIX 1 — clicks.reel_id type mismatch (INTEGER → TEXT for UUID join)
  try {
    const col = db.prepare("PRAGMA table_info(clicks)").all().find(c => c.name === 'reel_id');
    if (col && col.type === 'INTEGER') {
      db.exec(`
        CREATE TABLE IF NOT EXISTS clicks_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reel_id TEXT,
          user_id INTEGER,
          campaign_id TEXT,
          platform TEXT,
          country TEXT,
          city TEXT,
          browser TEXT,
          os TEXT,
          device TEXT,
          ip_address TEXT,
          referrer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          source_category TEXT,
          utm_source TEXT,
          utm_campaign TEXT,
          FOREIGN KEY (reel_id) REFERENCES reels(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        INSERT INTO clicks_new SELECT id, CAST(reel_id AS TEXT), user_id, campaign_id,
          platform, country, city, browser, os, device, ip_address, referrer,
          created_at, source_category, utm_source, utm_campaign FROM clicks;
        DROP TABLE clicks;
        ALTER TABLE clicks_new RENAME TO clicks;
      `);
      console.log('Migration: clicks.reel_id fixed to TEXT');
    }
  } catch (e) {
    console.log('clicks migration skipped:', e.message);
  }

  // FIX 2 — api_keys missing columns
  const apiKeyMigrations = [
    "ALTER TABLE api_keys ADD COLUMN is_active INTEGER DEFAULT 1",
    "ALTER TABLE api_keys ADD COLUMN quota_exceeded INTEGER DEFAULT 0",
    "ALTER TABLE api_keys ADD COLUMN quota_reset_at TEXT",
    "ALTER TABLE api_keys ADD COLUMN model TEXT",
    "ALTER TABLE api_keys ADD COLUMN label TEXT"
  ];
  for (const sql of apiKeyMigrations) {
    try { db.prepare(sql).run(); } catch (e) {}
  }

  // FIX 3 — music_library unique constraint on file_path
  try {
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_music_filepath ON music_library(file_path)").run();
  } catch (e) {}

  // FIX 4 — missing performance indexes
  const missingIndexes = [
    "CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_clicks_reel_id ON clicks(reel_id)",
    "CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status)",
    "CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_utm_links_user_id ON utm_links(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_utm_links_reel_id ON utm_links(reel_id)",
    "CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON render_jobs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status)"
  ];
  for (const sql of missingIndexes) {
    try { db.prepare(sql).run(); } catch (e) {}
  }

  // FIX 5 — system_settings missing columns
  const settingsMigrations = [
    "ALTER TABLE system_settings ADD COLUMN storage_type TEXT DEFAULT 'local'",
    "ALTER TABLE system_settings ADD COLUMN default_theme TEXT DEFAULT 'modern'",
    "ALTER TABLE system_settings ADD COLUMN max_concurrent_renders INTEGER DEFAULT 3",
    "ALTER TABLE system_settings ADD COLUMN rate_limit_requests INTEGER DEFAULT 100",
    "ALTER TABLE system_settings ADD COLUMN smtp_host TEXT DEFAULT 'smtp.gmail.com'",
    "ALTER TABLE system_settings ADD COLUMN smtp_port INTEGER DEFAULT 587",
    "ALTER TABLE system_settings ADD COLUMN smtp_user TEXT DEFAULT ''",
    "ALTER TABLE system_settings ADD COLUMN smtp_pass TEXT DEFAULT ''",
    "ALTER TABLE system_settings ADD COLUMN smtp_secure BOOLEAN DEFAULT 0"
  ];
  for (const sql of settingsMigrations) {
    try { db.prepare(sql).run(); } catch (e) {}
  }

  console.log('Migrations completed successfully.');
};

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
