# Delete 360 Security and related files
$paths = @(
    "C:\Users\Robert Miller\AppData\Local\360extremebrowser",
    "C:\360SANDBOX",
    "C:\Users\Robert Miller\AppData\Roaming\360",
    "C:\Users\Robert Miller\AppData\Local\360",
    "C:\Program Files (x86)\360",
    "C:\Program Files\360"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "Deleting: $p"
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

Write-Host "`n--- Cursor DELETE ---"
$cursorPaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\cursor",
    "C:\Users\Robert Miller\AppData\Roaming\Cursor",
    "C:\Users\Robert Miller\AppData\Local\cursor-updater"
)
foreach ($p in $cursorPaths) {
    if (Test-Path $p) {
        Write-Host "Deleting: $p"
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

Write-Host "`n--- VS Code DELETE ---"
$vscodePaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\Microsoft VS Code",
    "C:\Users\Robert Miller\AppData\Roaming\Code",
    "C:\Users\Robert Miller\.vscode"
)
foreach ($p in $vscodePaths) {
    if (Test-Path $p) {
        Write-Host "Deleting: $p"
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

Write-Host "`n--- Windsurf DELETE ---"
$windsurfPaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\Windsurf",
    "C:\Users\Robert Miller\AppData\Roaming\Windsurf",
    "C:\Users\Robert Miller\.windsurf"
)
foreach ($p in $windsurfPaths) {
    if (Test-Path $p) {
        Write-Host "Deleting: $p"
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

Write-Host "`nAll done! Space should be freed now."
