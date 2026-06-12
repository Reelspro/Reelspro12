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

console.log(`[1/4] Building frontend for v${version}...`);
try {
  execSync('npm run build', { cwd: path.join(rootDir, 'frontend'), stdio: 'inherit' });
} catch (err) {
  console.log('Frontend build failed or skipped. Continuing...');
}

console.log('[2/4] Generating Inno Setup Script...');
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
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "\\.git\\*,\\dist-release\\*,\\output\\*,\\node_modules\\.cache\\*,\\backend\\storage\\reels\\*,\\backend\\temp\\*,*.iss,build_installer.js,ReelsPro-Setup-*.exe"

[Icons]
Name: "{group}\\ReelsPro"; Filename: "{app}\\start.bat"; IconFilename: "{sys}\\cmd.exe"
Name: "{autodesktop}\\ReelsPro"; Filename: "{app}\\start.bat"; IconFilename: "{sys}\\cmd.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\\setup.bat"; Description: "Run Setup (Install Node dependencies if missing)"; Flags: postinstall waituntilterminated
Filename: "{app}\\start.bat"; Description: "Launch ReelsPro"; Flags: postinstall nowait
`;

fs.writeFileSync(path.join(rootDir, 'installer.iss'), issContent);

console.log('[3/4] Compiling Installer (This may take a minute or two)...');
const isccPath = '"' + path.join(process.env.LOCALAPPDATA, 'Programs', 'Inno Setup 6', 'ISCC.exe') + '"';
try {
  execSync(`${isccPath} installer.iss`, { cwd: rootDir, stdio: 'inherit' });
  console.log('Installer compiled successfully!');
} catch (error) {
  console.error('Failed to compile installer:', error.message);
  process.exit(1);
}

console.log('[4/4] Generating latest.yml...');
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

console.log('Done! Generated:');
console.log(` - dist-release\\${exeName} (${(size/1024/1024).toFixed(2)} MB)`);
console.log(' - latest.yml');
