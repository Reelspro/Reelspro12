$BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree"
$MUSIC = "d:\reelspro v12 cursor\backend\assets\music"

$files = @(
  # MYSTERY
  @{url="$BASE/Mystic%20Force.mp3"; dest="$MUSIC\mystery\hidden_clue_01.mp3"},
  @{url="$BASE/Phantasm.mp3"; dest="$MUSIC\mystery\secret_door_02.mp3"},
  @{url="$BASE/The%20Complex.mp3"; dest="$MUSIC\mystery\detective_theme_03.mp3"},
  @{url="$BASE/Deep%20Haze.mp3"; dest="$MUSIC\mystery\cold_case_04.mp3"},
  @{url="$BASE/Oppressive%20Gloom.mp3"; dest="$MUSIC\mystery\shadow_chase_05.mp3"},
  @{url="$BASE/Mystic%20Force.mp3"; dest="$MUSIC\mystery\track1.mp3"},

  # CRIME
  @{url="$BASE/The%20Complex.mp3"; dest="$MUSIC\crime\track1.mp3"},
  @{url="$BASE/The%20Complex.mp3"; dest="$MUSIC\crime\sirens_distant_01.mp3"},
  @{url="$BASE/Deep%20Haze.mp3"; dest="$MUSIC\crime\interrogation_02.mp3"},
  @{url="$BASE/Oppressive%20Gloom.mp3"; dest="$MUSIC\crime\crime_scene_03.mp3"},
  @{url="$BASE/Gathering%20Darkness.mp3"; dest="$MUSIC\crime\dark_alley_04.mp3"},
  @{url="$BASE/Mystic%20Force.mp3"; dest="$MUSIC\crime\verdict_05.mp3"},

  # FUNNY
  @{url="$BASE/Sneaky%20Snitch.mp3"; dest="$MUSIC\funny\track1.mp3"},
  @{url="$BASE/Sneaky%20Snitch.mp3"; dest="$MUSIC\funny\funny_01.mp3"},
  @{url="$BASE/Monkeys%20Spinning%20Monkeys.mp3"; dest="$MUSIC\funny\funny_02.mp3"},
  @{url="$BASE/Fluffing%20a%20Duck.mp3"; dest="$MUSIC\funny\funny_03.mp3"},
  @{url="$BASE/Scheming%20Weasel%20faster.mp3"; dest="$MUSIC\funny\funny_04.mp3"},
  @{url="$BASE/Carefree.mp3"; dest="$MUSIC\funny\funny_05.mp3"},

  # MOTIVATIONAL
  @{url="$BASE/Strength%20of%20the%20Titans.mp3"; dest="$MUSIC\motivational\track1.mp3"},
  @{url="$BASE/Strength%20of%20the%20Titans.mp3"; dest="$MUSIC\motivational\motivational_01.mp3"},
  @{url="$BASE/Clash%20Defiant.mp3"; dest="$MUSIC\motivational\motivational_02.mp3"},
  @{url="$BASE/Unwritten%20Return.mp3"; dest="$MUSIC\motivational\motivational_03.mp3"},

  # SHOCKING
  @{url="$BASE/Impact%20Moderato.mp3"; dest="$MUSIC\shocking\track1.mp3"},
  @{url="$BASE/Impact%20Moderato.mp3"; dest="$MUSIC\shocking\shocking_01.mp3"},
  @{url="$BASE/Severe%20Tire%20Damage.mp3"; dest="$MUSIC\shocking\shocking_02.mp3"}
)

Write-Host "Starting download of remaining music files..."
$total = $files.Count
$current = 1

foreach ($file in $files) {
  $url = $file.url
  $dest = $file.dest
  $dir = Split-Path -Parent $dest
  
  if (!(Test-Path -Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  
  $filename = Split-Path -Leaf $dest
  $category = Split-Path (Split-Path -Parent $dest) -Leaf
  
  Write-Host "[$current/$total] Downloading $filename to $category..."
  
  try {
    # Check if download is already valid (e.g. size > 1MB)
    if (Test-Path -Path $dest) {
      $size = (Get-Item $dest).Length
      if ($size -gt 1000000) {
        Write-Host "   Already exists and looks valid ($([Math]::Round($size / 1MB, 2)) MB). Skipping."
        $current++
        continue
      }
    }

    # Invoke-WebRequest with custom User-Agent to avoid getting 403 or rate-limited
    Invoke-WebRequest -Uri $url -OutFile $dest -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -TimeoutSec 300 -ErrorAction Stop
    $stats = Get-Item $dest
    $sizeMB = [Math]::Round($stats.Length / 1MB, 2)
    Write-Host "   OK: $sizeMB MB"
  } catch {
    Write-Host "   FAILED downloading $url to $dest : $_"
  }
  $current++
}

Write-Host "DONE downloading remaining music files"
