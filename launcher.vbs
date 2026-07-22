Set WshShell = CreateObject("WScript.Shell")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Start Backend using local bundled node.exe
WshShell.Run "cmd /c cd /d """ & strDir & "\backend"" && """ & strDir & "\node.exe"" src/server.js", 0, False

' Wait 3 seconds for backend to initialize
WScript.Sleep 3000

' Open browser
WshShell.Run "http://localhost:5000", 1, False

