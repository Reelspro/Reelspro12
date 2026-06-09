// FIX 4: Fix HTML-encoded URL in website_sources
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/config/db');

const result = db.prepare("UPDATE website_sources SET url = 'http://bnvg.online/' WHERE id = 2").run();
console.log(`[fix_url] Updated ${result.changes} row(s). URL set to http://bnvg.online/`);

// Also fix any other HTML-encoded URLs
const allSources = db.prepare("SELECT id, url FROM website_sources").all();
let fixed = 0;
allSources.forEach(s => {
  const decoded = s.url
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x3A;/g, ':');
  if (decoded !== s.url) {
    db.prepare("UPDATE website_sources SET url = ? WHERE id = ?").run(decoded, s.id);
    console.log(`[fix_url] Fixed source id=${s.id}: ${s.url} -> ${decoded}`);
    fixed++;
  }
});
console.log(`[fix_url] Done. Fixed ${fixed} additional HTML-encoded URLs.`);
