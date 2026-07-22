# Delete Windsurf
$windsurfPaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\Windsurf",
    "C:\Users\Robert Miller\AppData\Roaming\Windsurf",
    "C:\Users\Robert Miller\AppData\Local\windsurf-updater",
    "C:\Users\Robert Miller\.windsurf"
)
Write-Host "=== Deleting Windsurf ==="
foreach ($p in $windsurfPaths) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "DELETED: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

# Delete VEVE Media
$vevePaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\VEVE Media",
    "C:\Users\Robert Miller\AppData\Roaming\VEVE Media",
    "C:\Users\Robert Miller\AppData\Local\VEVE Media",
    "C:\Users\Robert Miller\AppData\Local\veve-media-updater"
)
Write-Host "`n=== Deleting VEVE Media ==="
foreach ($p in $vevePaths) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "DELETED: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

# Delete VS Code (still present)
$vscodePaths = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\Microsoft VS Code",
    "C:\Users\Robert Miller\AppData\Roaming\Code",
    "C:\Users\Robert Miller\.vscode"
)
Write-Host "`n=== Deleting VS Code ==="
foreach ($p in $vscodePaths) {
    if (Test-Path $p) {
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "DELETED: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

# Search for Zed
Write-Host "`n=== Searching for Zed ==="
$zedSearch = @(
    "C:\Users\Robert Miller\AppData\Local\Programs\Zed",
    "C:\Users\Robert Miller\AppData\Roaming\Zed",
    "C:\Users\Robert Miller\AppData\Local\Zed",
    "C:\Program Files\Zed",
    "D:\Program Files\Zed"
)
foreach ($p in $zedSearch) {
    if (Test-Path $p) {
        Write-Host "FOUND ZED: $p"
        Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "DELETED: $p"
    } else {
        Write-Host "Not found: $p"
    }
}

Write-Host "`n=== All done! ==="
