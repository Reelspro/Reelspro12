const fs = require('fs');
const path = require('path');
const https = require('https');

const MUSIC_DIR = path.resolve(__dirname, '../assets/music');

const downloads = [
  // EMOTIONAL
  { url: 'Heartbreaking.mp3', cat: 'emotional', file: 'heartbreak_01.mp3' },
  { url: 'Sad%20Trio.mp3', cat: 'emotional', file: 'tears_falling_02.mp3' },
  { url: 'Almost%20in%20F.mp3', cat: 'emotional', file: 'broken_dreams_05.mp3' },
  { url: 'Leaving%20Home.mp3', cat: 'emotional', file: 'last_goodbye_07.mp3' },
  { url: 'Gymnopedie%20No%201.mp3', cat: 'emotional', file: 'fading_memory_04.mp3' },
  { url: 'Autumn%20Day.mp3', cat: 'emotional', file: 'empty_room_08.mp3' },
  { url: 'Wounded.mp3', cat: 'emotional', file: 'whispered_pain_13.mp3' },
  { url: 'Echoes%20of%20Time.mp3', cat: 'emotional', file: 'winter_sorrow_10.mp3' },
  { url: 'Gymnopedie%20No%201.mp3', cat: 'emotional', file: 'track1.mp3' },

  // SUSPENSE
  { url: 'Oppressive%20Gloom.mp3', cat: 'suspense', file: 'dark_tension_01.mp3' },
  { url: 'Deep%20Haze.mp3', cat: 'suspense', file: 'deep_drone_02.mp3' },
  { url: 'The%20Complex.mp3', cat: 'suspense', file: 'eerie_pulse_03.mp3' },
  { url: 'Mystic%20Force.mp3', cat: 'suspense', file: 'shadow_hum_04.mp3' },
  { url: 'Ghost%20Story.mp3', cat: 'suspense', file: 'danger_close_05.mp3' },
  { url: 'Gathering%20Darkness.mp3', cat: 'suspense', file: 'night_crawler_06.mp3' },
  { url: 'Oppressive%20Gloom.mp3', cat: 'suspense', file: 'track1.mp3' },

  // HORROR
  { url: 'Classic%20Horror%201.mp3', cat: 'horror', file: 'nightmare_01.mp3' },
  { url: 'Classic%20Horror%202.mp3', cat: 'horror', file: 'dark_hallway_02.mp3' },
  { url: 'Classic%20Horror%203.mp3', cat: 'horror', file: 'evil_presence_03.mp3' },
  { url: 'Unseen%20Horrors.mp3', cat: 'horror', file: 'blood_moon_04.mp3' },
  { url: 'Supernatural.mp3', cat: 'horror', file: 'demon_breath_05.mp3' },
  { url: 'Spider%20Eyes.mp3', cat: 'horror', file: 'graveyard_fog_06.mp3' },
  { url: 'Phantasm.mp3', cat: 'horror', file: 'haunted_house_07.mp3' },
  { url: 'Classic%20Horror%201.mp3', cat: 'horror', file: 'track1.mp3' },

  // MYSTERY
  { url: 'Mystic%20Force.mp3', cat: 'mystery', file: 'hidden_clue_01.mp3' },
  { url: 'Phantasm.mp3', cat: 'mystery', file: 'secret_door_02.mp3' },
  { url: 'The%20Complex.mp3', cat: 'mystery', file: 'detective_theme_03.mp3' },
  { url: 'Deep%20Haze.mp3', cat: 'mystery', file: 'cold_case_04.mp3' },
  { url: 'Oppressive%20Gloom.mp3', cat: 'mystery', file: 'shadow_chase_05.mp3' },
  { url: 'Mystic%20Force.mp3', cat: 'mystery', file: 'track1.mp3' },

  // CRIME
  { url: 'The%20Complex.mp3', cat: 'crime', file: 'track1.mp3' },
  { url: 'The%20Complex.mp3', cat: 'crime', file: 'sirens_distant_01.mp3' },
  { url: 'Deep%20Haze.mp3', cat: 'crime', file: 'interrogation_02.mp3' },
  { url: 'Oppressive%20Gloom.mp3', cat: 'crime', file: 'crime_scene_03.mp3' },
  { url: 'Gathering%20Darkness.mp3', cat: 'crime', file: 'dark_alley_04.mp3' },
  { url: 'Mystic%20Force.mp3', cat: 'crime', file: 'verdict_05.mp3' },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function downloadFileWithRetry(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await downloadFile(url, destPath);
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`      ⚠️ Attempt ${attempt} failed for ${path.basename(destPath)}: ${err.message}. Retrying in 2.5s...`);
      await new Promise(r => setTimeout(r, 2500));
    }
  }
}

async function run() {
  console.log('--- STARTING PREMIUM MUSIC LIBRARY DOWNLOAD (CONCURRENT WITH RETRIES) ---');
  let successCount = 0;
  const CONCURRENCY = 3; // Muted concurrency to avoid rate limiting
  const queue = [...downloads];

  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      const index = downloads.indexOf(item);
      const sourceUrl = `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${item.url}`;
      const targetPath = path.join(MUSIC_DIR, item.cat, item.file);
      
      // Ensure parent category directory exists
      const catDir = path.dirname(targetPath);
      if (!fs.existsSync(catDir)) {
        fs.mkdirSync(catDir, { recursive: true });
      }

      console.log(`[${index + 1}/${downloads.length}] Downloading ${item.url} to ${item.cat}/${item.file}...`);
      try {
        await downloadFileWithRetry(sourceUrl, targetPath, 3);
        const stats = fs.statSync(targetPath);
        console.log(`   ✅ Success [${item.url} -> ${item.cat}/${item.file}]: Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Failed [${item.url} -> ${item.cat}/${item.file}]: ${err.message}`);
      }
    }
  };

  const workers = Array(CONCURRENCY).fill(null).map(() => worker());
  await Promise.all(workers);
  
  console.log(`\n--- DOWNLOAD SUMMARY: ${successCount}/${downloads.length} tracks updated successfully! ---`);
}

run();
