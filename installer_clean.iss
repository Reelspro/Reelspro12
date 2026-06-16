
[Setup]
AppName=ReelsPro Ultimate
AppVersion=1.3.0
DefaultDirName={autopf}\ReelsPro
DefaultGroupName=ReelsPro
OutputDir=dist-release
OutputBaseFilename=ReelsPro-Setup-Protected-1.3.0
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
DisableWelcomePage=no
DisableDirPage=no

[Files]
Source: "dist-release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "ReelsPro-Setup-*.exe,*.yml,*.iss,build_clean_installer.js"

[Icons]
Name: "{group}\ReelsPro"; Filename: "{app}\start.bat"; IconFilename: "{sys}\cmd.exe"
Name: "{autodesktop}\ReelsPro"; Filename: "{app}\start.bat"; IconFilename: "{sys}\cmd.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\start.bat"; Description: "Launch ReelsPro"; Flags: postinstall nowait
