# Check D:\Program Files for these apps
Write-Host "=== D:\Program Files contents ==="
$progFiles = Get-ChildItem -Path "D:\Program Files" -Directory -Force -ErrorAction SilentlyContinue
foreach ($f in $progFiles) {
    Write-Host $f.FullName
}

# Also check C:\Program Files and C:\Users\Robert Miller\AppData\Local\Programs
Write-Host "`n=== C:\Program Files contents ==="
$cProg = Get-ChildItem -Path "C:\Program Files" -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "zed|windsurf|veve" }
foreach ($f in $cProg) { Write-Host "FOUND: $($f.FullName)" }

Write-Host "`n=== C:\Program Files (x86) contents ==="
$cProg86 = Get-ChildItem -Path "C:\Program Files (x86)" -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "zed|windsurf|veve" }
foreach ($f in $cProg86) { Write-Host "FOUND: $($f.FullName)" }

Write-Host "`n=== C:\Users\Robert Miller\AppData\Local\Programs contents ==="
$localProgs = Get-ChildItem -Path "C:\Users\Robert Miller\AppData\Local\Programs" -Directory -Force -ErrorAction SilentlyContinue
foreach ($f in $localProgs) {
    Write-Host $f.FullName
}
