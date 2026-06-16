const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const versionData = JSON.parse(fs.readFileSync(path.join(rootDir, 'version.json'), 'utf8'));
const version = versionData.version;
const exeName = `ReelsPro-Setup-Protected-${version}.exe`;

console.log('[1/2] Generating Clean Inno Setup Script...');
const issContent = `
[Setup]
AppName=ReelsPro Ultimate
AppVersion=${version}
DefaultDirName={autopf}\\ReelsPro
DefaultGroupName=ReelsPro
OutputDir=dist-release
OutputBaseFilename=ReelsPro-Setup-Protected-${version}
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
DisableWelcomePage=no
DisableDirPage=no

[Files]
Source: "dist-release\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "ReelsPro-Setup-*.exe,ReelsPro.exe,*.yml,*.iss,build_clean_installer.js"

[Icons]
Name: "{group}\\ReelsPro"; Filename: "{app}\\start.bat"; IconFilename: "{sys}\\cmd.exe"
Name: "{autodesktop}\\ReelsPro"; Filename: "{app}\\start.bat"; IconFilename: "{sys}\\cmd.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\\start.bat"; Description: "Launch ReelsPro"; Flags: postinstall nowait
`;

fs.writeFileSync(path.join(rootDir, 'installer_clean.iss'), issContent);

console.log('[2/2] Compiling Installer using Inno Setup...');
const isccPath = '"' + path.join(process.env.LOCALAPPDATA, 'Programs', 'Inno Setup 6', 'ISCC.exe') + '"';
try {
  execSync(`${isccPath} installer_clean.iss`, { cwd: rootDir, stdio: 'inherit' });
  console.log('Clean Installer compiled successfully!');
  console.log(`\n✅ Generated File: dist-release\\${exeName}`);
} catch (error) {
  console.error('Failed to compile installer:', error.message);
  process.exit(1);
}
