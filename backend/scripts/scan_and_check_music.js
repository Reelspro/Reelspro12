const { scanMusicLibrary } = require('../src/services/music_engine');
const db = require('../src/config/db');

console.log('Scanning music library...');
const count = scanMusicLibrary();
console.log(`Scanned and added ${count} new tracks.`);

const rows = db.prepare('SELECT category, COUNT(*) as count FROM music_library GROUP BY category').all();
console.log('\n--- Music Library Database Summary ---');
rows.forEach(row => {
  console.log(`- ${row.category}: ${row.count} tracks`);
});

const allTracks = db.prepare('SELECT id, filename, category, file_path FROM music_library ORDER BY category, filename').all();
console.log('\n--- All Indexed Tracks in DB ---');
allTracks.forEach(track => {
  console.log(`[${track.id}] Category: ${track.category} | File: ${track.filename}`);
});
db.close();
