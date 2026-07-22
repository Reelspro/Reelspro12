Set WshShell = CreateObject("WScript.Shell")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Start Backend silently
WshShell.Run "cmd /c cd /d """ & strDir & "\backend"" && node src/server.js", 0, False

' Wait 3 seconds for backend to initialize
WScript.Sleep 3000

' Open browser
WshShell.Run "http://localhost:5000", 1, False
