const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../../');
const TEMP_DIR = path.resolve(rootDir, 'output/temp');

function searchPixabay(query, apiKey) {
  return new Promise((resolve) => {
    if (!apiKey) { resolve([]); return; }
    const q = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${q}&image_type=photo&orientation=vertical&per_page=10&safesearch=true&order=popular`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const urls = (json.hits || []).map(h => h.webformatURL).filter(Boolean);
          resolve(urls);
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const req = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        downloadImage(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
      file.on('error', reject);
    });
    req.on('error', reject);
  });
}

function extractKeywords(scenes) {
  const stopWords = new Set(['the','a','an','is','was','were','are','be','been','have','has','do','does','did','will','would','could','should','and','or','but','in','on','at','to','for','of','with','by','from','this','that','i','you','he','she','it','we','they','very','just','not','no','so','than','too']);
  const allText = scenes.map(s => s.text || '').join(' ');
  const words = allText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const freq = {};
  words.filter(w => w.length > 3 && !stopWords.has(w)).forEach(w => freq[w] = (freq[w] || 0) + 1);
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,3).map(e => e[0]);
}

async function fetchSceneImages(articleImageUrl, scenes, reelId) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  
  const apiKey = process.env.PIXABAY_API_KEY || '';
  const keywords = extractKeywords(scenes);
  const searchQuery = keywords.length > 0 ? keywords.join(' ') : 'dark cinematic night';
  
  console.log('[ImageEngine] Pixabay search:', searchQuery);
  
  let imageUrls = await searchPixabay(searchQuery, apiKey);
  
  // Fallback searches if no results
  if (imageUrls.length === 0) imageUrls = await searchPixabay('dark mystery night', apiKey);
  if (imageUrls.length === 0 && articleImageUrl) imageUrls = [articleImageUrl];
  
  console.log('[ImageEngine] Found', imageUrls.length, 'images');
  
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const url = imageUrls[i % Math.max(imageUrls.length, 1)];
    if (!url) { results.push(null); continue; }
    const dest = path.join(TEMP_DIR, `${reelId}_scene_${i}.jpg`);
    try {
      await downloadImage(url, dest);
      results.push(dest);
    } catch (e) {
      console.warn('[ImageEngine] Download failed scene', i, e.message);
      results.push(null);
    }
  }
  return results;
}

function cleanupSceneImages(reelId, count) {
  for (let i = 0; i < count + 2; i++) {
    const f = path.join(TEMP_DIR, `${reelId}_scene_${i}.jpg`);
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  }
}

async function getBackgroundImages(options, scenes, reelId) {
  // options = { bgType: 'custom'|'none', customImagePath: null|'/storage/uploads/...' }
  const { bgType = 'none', customImagePath = null } = options || {};

  if (bgType === 'none') {
    console.log('[ImageEngine] No background — using theme color only');
    return new Array(scenes.length).fill(null);
  }

  if (bgType === 'custom' && customImagePath) {
    const rootDir = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../../');
    const fullPath = path.resolve(rootDir, customImagePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      console.log('[ImageEngine] Using custom background:', fullPath);
      return new Array(scenes.length).fill(fullPath);
    } else {
      console.warn('[ImageEngine] Custom image not found, falling back to none');
    }
  }

  // Default: Theme color (none)
  return new Array(scenes.length).fill(null);
}

module.exports = { fetchSceneImages, cleanupSceneImages, downloadImage, getBackgroundImages };
