
[Setup]
AppName=ReelsPro
AppVersion=1.3.0
DefaultDirName={autopf}\ReelsPro
DefaultGroupName=ReelsPro
OutputDir=dist-release
OutputBaseFilename=ReelsPro-Setup-1.3.0
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64os

WizardStyle=modern
DisableWelcomePage=no
DisableDirPage=no

[Files]
; All project files (excluding git, dist, temp, user data, dev tools)
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "\.git\*,\dist-release\*,\output\*,\backend\storage\reels\*,\backend\temp\*,*.iss,build_installer.js,build_clean_installer.js,ReelsPro-Setup-*.exe,reels_pro.db,.env,\node_modules\.cache\*,\frontend\node_modules\*,\scratch\*"

[Icons]
Name: "{group}\ReelsPro"; Filename: "{app}\launcher.vbs"
Name: "{autodesktop}\ReelsPro"; Filename: "{app}\launcher.vbs"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Run]
Filename: "{app}\launcher.vbs"; Description: "Launch ReelsPro"; Flags: postinstall nowait shellexec

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ReelsPro"; ValueData: "wscript.exe ""{app}\launcher.vbs"""; Flags: uninsdeletevalue; Tasks:
