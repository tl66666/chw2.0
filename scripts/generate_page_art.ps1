Add-Type -AssemblyName System.Drawing

function New-Scene($file, $background, $kind) {
  $bmp = New-Object System.Drawing.Bitmap 1800, 600
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb($background[0], $background[1], $background[2]))

  $cloud = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 253, 255))
  $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(133, 192, 226))
  $pink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(247, 174, 198))
  $yellow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 220, 111))
  $cream = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 246, 222))
  $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(91, 73, 104))
  $coral = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(233, 115, 130))

  foreach ($cloudPart in @(@(80,90,260,74), @(260,56,170,104), @(430,105,210,58), @(690,72,230,76), @(1380,78,220,76), @(1540,48,170,104))) {
    $g.FillEllipse($cloud, $cloudPart[0], $cloudPart[1], $cloudPart[2], $cloudPart[3])
  }

  if ($kind -eq 'map') {
    $g.FillPolygon($blue, @([System.Drawing.Point]::new(0,460), [System.Drawing.Point]::new(330,240), [System.Drawing.Point]::new(700,460)))
    $g.FillPolygon($pink, @([System.Drawing.Point]::new(560,460), [System.Drawing.Point]::new(1080,220), [System.Drawing.Point]::new(1510,460)))
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,229,240))), 0, 450, 1800, 150)
    $paper = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,248,212))
    $g.FillPolygon($paper, @([System.Drawing.Point]::new(1130,250), [System.Drawing.Point]::new(1560,185), [System.Drawing.Point]::new(1700,395), [System.Drawing.Point]::new(1260,445)))
    $route = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(118,101,181)), 10
    $route.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawLine($route, 1190, 360, 1370, 275)
    $g.DrawLine($route, 1370, 275, 1520, 355)
    $g.DrawLine($route, 1520, 355, 1640, 260)
    $route.Dispose()
    $g.FillEllipse($coral, 1460, 245, 80, 80)
    $g.FillEllipse($cloud, 1486, 270, 28, 28)
    $g.FillEllipse($yellow, 930, 100, 64, 64)
  }

  if ($kind -eq 'group') {
    $g.FillPolygon($blue, @([System.Drawing.Point]::new(0,455), [System.Drawing.Point]::new(370,245), [System.Drawing.Point]::new(760,455)))
    $g.FillPolygon($pink, @([System.Drawing.Point]::new(620,455), [System.Drawing.Point]::new(1120,225), [System.Drawing.Point]::new(1550,455)))
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,241,213))), 0, 440, 1800, 160)
    $path = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246,205,154))
    $g.FillPolygon($path, @([System.Drawing.Point]::new(880,600), [System.Drawing.Point]::new(1120,600), [System.Drawing.Point]::new(1030,430), [System.Drawing.Point]::new(970,430)))
    foreach ($person in @(@(1230,295,245,128,145), @(1400,330,117,177,208), @(1560,302,247,191,100))) {
      $pack = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($person[2], $person[3], $person[4]))
      $g.FillEllipse($ink, $person[0]+8, $person[1], 82, 82)
      $g.FillRectangle($ink, $person[0]+20, $person[1]+66, 60, 106)
      $g.FillEllipse($pack, $person[0]+63, $person[1]+78, 44, 70)
      $g.FillEllipse($cream, $person[0]+34, $person[1]+22, 30, 24)
      $pack.Dispose()
    }
  }

  if ($kind -eq 'album') {
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(249,203,220))), 0, 420, 1800, 180)
    foreach ($photo in @(@(1060,155,250,180), @(1300,250,240,170), @(1510,125,220,175))) {
      $g.FillRectangle($cream, $photo[0], $photo[1], $photo[2], $photo[3])
      $g.FillRectangle($blue, $photo[0]+18, $photo[1]+18, $photo[2]-36, $photo[3]-62)
      $g.FillEllipse($yellow, $photo[0]+48, $photo[1]+40, 46, 46)
      $g.FillPolygon($pink, @([System.Drawing.Point]::new($photo[0]+24, $photo[1]+$photo[3]-62), [System.Drawing.Point]::new($photo[0]+110, $photo[1]+$photo[3]-124), [System.Drawing.Point]::new($photo[0]+$photo[2]-24, $photo[1]+$photo[3]-62)))
    }
    $camera = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(232,119,142))
    $g.FillRectangle($camera, 1180, 370, 250, 132)
    $g.FillEllipse($cream, 1260, 388, 96, 96)
    $g.FillRectangle($camera, 1225, 338, 70, 36)
    $camera.Dispose()
  }

  if ($kind -eq 'cards') {
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(234,231,255))), 0, 430, 1800, 170)
    foreach ($card in @(@(1120,120,230,320,241,179,207), @(1360,185,230,320,130,183,222), @(1570,105,180,285,248,194,105))) {
      $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($card[4], $card[5], $card[6]))
      $g.FillRectangle($fill, $card[0], $card[1], $card[2], $card[3])
      $g.FillEllipse($cream, $card[0]+48, $card[1]+52, $card[2]-96, $card[2]-96)
      $g.FillEllipse($ink, $card[0]+78, $card[1]+92, 74, 74)
      $g.FillRectangle($cream, $card[0]+64, $card[1]+178, 102, 80)
      $fill.Dispose()
    }
    $spark = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,206,93)), 9
    $g.DrawLine($spark, 1030, 165, 1090, 165); $g.DrawLine($spark, 1060, 135, 1060, 195)
    $g.DrawLine($spark, 1480, 90, 1530, 90); $g.DrawLine($spark, 1505, 65, 1505, 115)
    $spark.Dispose()
  }

  $g.Dispose()
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$workspace = Split-Path $PSScriptRoot -Parent
$project = Get-ChildItem -Path $workspace -Directory | Where-Object { $_.Name -like '*2.0' } | Select-Object -First 1
$headers = Join-Path $project.FullName 'images\headers'
New-Item -ItemType Directory -Force -Path $headers | Out-Null
New-Scene (Join-Path $headers 'map-hero-v2.png') @(174,222,239) 'map'
New-Scene (Join-Path $headers 'group-hero-v2.png') @(255,224,191) 'group'
New-Scene (Join-Path $headers 'album-hero-v2.png') @(187,216,246) 'album'
New-Scene (Join-Path $headers 'cards-hero-v2.png') @(204,194,240) 'cards'
