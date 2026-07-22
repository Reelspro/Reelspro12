const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const rootDir = __dirname;
const releaseDir = path.join(rootDir, 'dist-release');
const versionData = JSON.parse(fs.readFileSync(path.join(rootDir, 'version.json'), 'utf8'));
const version = versionData.version;
const exeName = `ReelsPro-Setup-${version}.exe`;
const exePath = path.join(releaseDir, exeName);

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Function to download node.exe if not present
async function ensureNodeBinary() {
  const nodeLocalPath = path.join(rootDir, 'node.exe');
  if (fs.existsSync(nodeLocalPath)) {
    console.log('[Setup] node.exe already exists locally.');
    return;
  }

  console.log('[Setup] node.exe is missing. Downloading portable Node.js v20.11.1 (x64)...');
  const axios = require('axios');
  const url = 'https://nodejs.org/dist/v20.11.1/win-x64/node.exe';
  
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(nodeLocalPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log('✅ node.exe downloaded successfully.');
  } catch (err) {
    console.error('Failed to download node.exe automatically:', err.message);
    console.log('Trying fallback copy from current process node path...');
    try {
      fs.copyFileSync(process.execPath, nodeLocalPath);
      console.log('✅ node.exe fallback copy successful.');
    } catch (e) {
      console.error('ERROR: node.exe could not be prepared. Targets will fail without it.');
      process.exit(1);
    }
  }
}

async function main() {
  // Ensure we have local node.exe first
  await ensureNodeBinary();

  // Step 1: Build frontend
  console.log(`[1/5] Building frontend for v${version}...`);
  try {
    execSync('npm run build', { cwd: path.join(rootDir, 'frontend'), stdio: 'inherit' });
  } catch (err) {
    console.log('Frontend build failed or skipped. Continuing...');
  }

  // Step 2: Make sure backend node_modules are production-ready
  console.log('[2/5] Installing backend production dependencies...');
  try {
    execSync('npm install --production --no-audit --no-fund', { 
      cwd: path.join(rootDir, 'backend'), 
      stdio: 'inherit' 
    });
    console.log('Backend dependencies ready.');
  } catch (err) {
    console.warn('Backend npm install warning:', err.message);
  }

  // Step 3: Generate Inno Setup Script with node_modules AND node.exe included
  console.log('[3/5] Generating Inno Setup Script...');
  const issContent = `
[Setup]
AppName=ReelsPro
AppVersion=${version}
DefaultDirName={autopf}\\ReelsPro
DefaultGroupName=ReelsPro
OutputDir=dist-release
OutputBaseFilename=ReelsPro-Setup-${version}
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64os

WizardStyle=modern
DisableWelcomePage=no
DisableDirPage=no

[Files]
; All project files (excluding git, dist, temp, user data, dev tools)
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "\\.git\\*,\\dist-release\\*,\\output\\*,\\backend\\storage\\reels\\*,\\backend\\temp\\*,*.iss,build_installer.js,build_clean_installer.js,ReelsPro-Setup-*.exe,reels_pro.db,.env,\\node_modules\\.cache\\*,\\frontend\\node_modules\\*,\\scratch\\*"

[Icons]
Name: "{group}\\ReelsPro"; Filename: "{app}\\launcher.vbs"
Name: "{autodesktop}\\ReelsPro"; Filename: "{app}\\launcher.vbs"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\\launcher.vbs"; Description: "Launch ReelsPro"; Flags: postinstall nowait shellexec

[Registry]
Root: HKCU; Subkey: "Software\\Microsoft\\Windows\\CurrentVersion\\Run"; ValueType: string; ValueName: "ReelsPro"; ValueData: "wscript.exe ""{app}\\launcher.vbs"""; Flags: uninsdeletevalue; Tasks:
`;

  fs.writeFileSync(path.join(rootDir, 'installer.iss'), issContent);

  // Step 4: Compile installer
  console.log('[4/5] Compiling Installer (This may take several minutes - node_modules & node.exe included)...');

  // Try common Inno Setup locations
  const isccPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Inno Setup 6', 'ISCC.exe'),
    'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
    'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
  ];

  let isccPath = null;
  for (const p of isccPaths) {
    if (fs.existsSync(p)) { isccPath = p; break; }
  }

  if (!isccPath) {
    console.error('ERROR: Inno Setup 6 not found! Please install it from https://jrsoftware.org/isinfo.php');
    process.exit(1);
  }

  try {
    execSync(`"${isccPath}" installer.iss`, { cwd: rootDir, stdio: 'inherit' });
    console.log('Installer compiled successfully!');
  } catch (error) {
    console.error('Failed to compile installer:', error.message);
    process.exit(1);
  }

  // Step 5: Generate latest.yml for auto-updater
  console.log('[5/5] Generating latest.yml...');
  const exeBuffer = fs.readFileSync(exePath);
  const hash = crypto.createHash('sha512').update(exeBuffer).digest('base64');
  const size = fs.statSync(exePath).size;

  const latestYmlContent = `version: ${version}
files:
  - url: ${exeName}
    sha512: ${hash}
    size: ${size}
path: ${exeName}
sha512: ${hash}
releaseDate: '${new Date().toISOString()}'
`;

  fs.writeFileSync(path.join(rootDir, 'latest.yml'), latestYmlContent);

  console.log('\n✅ Done! Generated:');
  console.log(` - dist-release\\${exeName} (${(size/1024/1024).toFixed(2)} MB)`);
  console.log(' - latest.yml');
  console.log('\nThis installer includes node_modules & node.exe - no dependencies required on target machine!');
}

main().catch(err => {
  console.error('Build execution failed:', err);
  process.exit(1);
});
