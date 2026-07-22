$folders = Get-ChildItem -Path "C:\Users\Robert Miller\AppData\Local", "C:\Users\Robert Miller\AppData\Roaming", "C:\Users\Robert Miller\AppData\LocalLow" -Directory -Force -ErrorAction SilentlyContinue
$result = foreach ($folder in $folders) {
    $size = (Get-ChildItem -Path $folder.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
    [PSCustomObject]@{
        Name = $folder.Name
        Location = $folder.Parent.Name
        Path = $folder.FullName
        SizeGB = [math]::round($size, 2)
    }
}
$result | Sort-Object SizeGB -Descending | Select-Object -First 20 | Format-Table -AutoSize
