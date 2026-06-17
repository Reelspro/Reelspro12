/**
 * updateController.js
 *
 * Checks GitHub Releases for latest .exe installer.
 * When a new release is found, returns the download URL
 * so users can download and run the new installer.
 *
 * GitHub Release format expected:
 *   - Tag: v1.2.0
 *   - Assets: ReelsPro-Setup-1.2.0.exe, latest.yml
 */

const path = require('path');
const fs   = require('fs');
const axios = require('axios');
const db = require('../config/db');

const ROOT_DIR     = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../../');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');

/* ─── Helpers ───────────────────────────────────────── */

function getLocalVersion() {
  try {
    return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
  } catch {
    return { version: '0.0.0', changelog: [] };
  }
}

function compareSemver(a = '0.0.0', b = '0.0.0') {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

/* ─── GET /api/update/version ───────────────────────── */
const getVersion = (req, res) => {
  res.json(getLocalVersion());
};

/* ─── GET /api/update/check ─────────────────────────── */
const checkUpdate = async (req, res) => {
  const local = getLocalVersion();

  // ── 1. Check system_settings in the database first ──────
  try {
    const settings = db.prepare('SELECT update_available, update_version, update_url, update_changelog, force_update FROM system_settings WHERE id = 1').get();
    if (settings && settings.update_available) {
      const dbVersion = settings.update_version || '0.0.0';
      const isNewer = compareSemver(dbVersion, local.version) > 0;

      if (isNewer) {
        const changelog = settings.update_changelog
          ? settings.update_changelog.split('\n').map(l => l.trim()).filter(Boolean)
          : [];
        return res.json({
          updateAvailable: true,
          localVersion: local.version,
          latestVersion: dbVersion,
          releaseDate: new Date().toISOString().split('T')[0],
          changelog,
          downloadUrl: settings.update_url,
          fileName: `ReelsPro-Setup-${dbVersion}.exe`,
          fileSize: 0,
          forceUpdate: !!settings.force_update,
        });
      }
    }
  } catch (dbErr) {
    console.error('[UpdateController] Database update check failed:', dbErr.message);
  }

  // ── 2. Fallback to GitHub Release ──────
  const repo  = process.env.GITHUB_REPO; // e.g. "username/reelspro-v12"

  if (!repo) {
    return res.json({
      updateAvailable: false,
      localVersion: local.version,
      latestVersion: local.version,
      message: 'GITHUB_REPO not set in .env',
    });
  }

  try {
    // ── 1. Fetch latest release from GitHub API ──────
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const { data: release } = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'ReelsPro-UpdateChecker/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const latestTag     = release.tag_name || 'v0.0.0';          // e.g. "v1.3.0"
    const latestVersion = latestTag.replace(/^v/, '');            // "1.3.0"
    const releaseDate   = release.published_at?.split('T')[0];
    const releaseNotes  = release.body || '';
    const releaseUrl    = release.html_url;

    // ── 2. Find .exe asset download URL ─────────────
    const exeAsset = release.assets?.find(a =>
      a.name.endsWith('.exe') || a.name.toLowerCase().includes('setup')
    );
    const downloadUrl = exeAsset?.browser_download_url || releaseUrl;
    const fileSize    = exeAsset?.size || 0;
    const fileName    = exeAsset?.name || `ReelsPro-Setup-${latestVersion}.exe`;

    // ── 3. Parse changelog from release body ────────
    const changelog = releaseNotes
      .split('\n')
      .map(l => l.replace(/^[-*•]\s*/, '').trim())
      .filter(l => l.length > 3 && !l.startsWith('#'))
      .slice(0, 10);

    const updateAvailable = compareSemver(latestVersion, local.version) > 0;

    return res.json({
      updateAvailable,
      localVersion:  local.version,
      latestVersion,
      releaseDate,
      changelog:     changelog.length ? changelog : local.changelog || [],
      downloadUrl,
      fileName,
      fileSize,
      releaseUrl,
      repoUrl: `https://github.com/${repo}`,
    });

  } catch (err) {
    console.error('[UpdateController] GitHub check failed:', err.message);

    // Fallback: try raw latest.yml from repo main branch
    try {
      const ymlUrl = `https://raw.githubusercontent.com/${repo}/main/latest.yml`;
      const { data: yml } = await axios.get(ymlUrl, { timeout: 8000 });
      const versionMatch = yml.match(/^version:\s*(.+)$/m);
      const latestVersion = versionMatch ? versionMatch[1].trim() : null;

      if (latestVersion && compareSemver(latestVersion, local.version) > 0) {
        return res.json({
          updateAvailable: true,
          localVersion: local.version,
          latestVersion,
          downloadUrl: `https://github.com/${repo}/releases/latest`,
          fileName: `ReelsPro-Setup-${latestVersion}.exe`,
          changelog: [],
          releaseUrl: `https://github.com/${repo}/releases/latest`,
        });
      }
    } catch (_) {}

    return res.json({
      updateAvailable: false,
      localVersion: local.version,
      latestVersion: local.version,
      error: 'Could not reach GitHub. Check internet connection.',
    });
  }
};

/* ─── POST /api/update/apply ────────────────────────── */
// For web app: not applicable (user downloads .exe manually)
// This endpoint just returns the download URL again
const applyUpdate = async (req, res) => {
  const result = await new Promise(resolve => {
    const fakeReq = req;
    const fakeRes = {
      json: resolve,
    };
    checkUpdate(fakeReq, fakeRes);
  });
  res.json(result);
};

module.exports = { checkUpdate, applyUpdate, getVersion };
