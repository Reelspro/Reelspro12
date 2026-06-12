
[Setup]
AppName=ReelsPro
AppVersion=1.3.0
DefaultDirName={autopf}\ReelsPro
DefaultGroupName=ReelsPro
OutputDir=dist-release
OutputBaseFilename=ReelsPro-Setup-1.3.0
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "\.git\*,\dist-release\*,\output\*,\node_modules\.cache\*,\backend\storage\reels\*,\backend\temp\*,*.iss,build_installer.js,ReelsPro-Setup-*.exe"

[Icons]
Name: "{group}\ReelsPro"; Filename: "{app}\start.bat"; IconFilename: "{sys}\cmd.exe"
Name: "{autodesktop}\ReelsPro"; Filename: "{app}\start.bat"; IconFilename: "{sys}\cmd.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\setup.bat"; Description: "Run Setup (Install Node dependencies if missing)"; Flags: postinstall waituntilterminated
Filename: "{app}\start.bat"; Description: "Launch ReelsPro"; Flags: postinstall nowait
