$folders = Get-ChildItem -Path "C:\Users\Robert Miller" -Directory -Force
$result = foreach ($folder in $folders) {
    $size = (Get-ChildItem -Path $folder.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
    [PSCustomObject]@{
        Name = $folder.Name
        SizeGB = [math]::round($size, 2)
    }
}
$result | Sort-Object SizeGB -Descending | Select-Object -First 15 | Format-Table -AutoSize
