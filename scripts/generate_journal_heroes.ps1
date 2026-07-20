Add-Type -AssemblyName System.Drawing

function Brush($hex) { New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function Pen($hex, $width) { New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($hex)), $width }

function Add-Cloud($g, $x, $y, $s) {
  $fill = Brush '#FFFDF8'
  $line = Pen '#D9A195' 3
  $g.FillEllipse($fill, $x, $y + 20*$s, 110*$s, 42*$s)
  $g.FillEllipse($fill, $x + 44*$s, $y, 76*$s, 72*$s)
  $g.FillEllipse($fill, $x + 95*$s, $y + 15*$s, 96*$s, 48*$s)
  $g.DrawArc($line, $x, $y + 20*$s, 110*$s, 42*$s, 180, 180)
  $g.DrawArc($line, $x + 44*$s, $y, 76*$s, 72*$s, 190, 150)
  $g.DrawArc($line, $x + 95*$s, $y + 15*$s, 96*$s, 48*$s, 195, 145)
  $fill.Dispose(); $line.Dispose()
}

function Add-Person($g, $x, $y, $s, $accent, $lookLeft) {
  $outline = Pen '#9C625B' 5
  $skin = Brush '#FFE5CF'
  $hair = Brush '#835F58'
  $shirt = Brush $accent
  $pack = Brush '#E7B06E'
  $cream = Brush '#FFF8E9'
  $eye = Brush '#5C4845'
  $headX = $x + 33*$s
  $g.FillEllipse($skin, $headX, $y, 74*$s, 74*$s)
  $g.DrawEllipse($outline, $headX, $y, 74*$s, 74*$s)
  $g.FillPie($hair, $headX - 2*$s, $y - 8*$s, 79*$s, 70*$s, 180, 195)
  $g.DrawArc($outline, $headX - 2*$s, $y - 8*$s, 79*$s, 70*$s, 180, 195)
  if ($lookLeft) { $eyeX = $headX + 24*$s } else { $eyeX = $headX + 49*$s }
  $g.FillEllipse($eye, $eyeX, $y + 34*$s, 8*$s, 10*$s)
  $g.DrawArc($outline, $headX + 31*$s, $y + 49*$s, 24*$s, 12*$s, 10, 155)
  $g.FillRectangle($shirt, $x + 25*$s, $y + 65*$s, 92*$s, 98*$s)
  $g.DrawRectangle($outline, $x + 25*$s, $y + 65*$s, 92*$s, 98*$s)
  $g.FillRectangle($pack, $x + 91*$s, $y + 82*$s, 44*$s, 66*$s)
  $g.DrawRectangle($outline, $x + 91*$s, $y + 82*$s, 44*$s, 66*$s)
  $g.FillRectangle($cream, $x + 32*$s, $y + 156*$s, 28*$s, 18*$s)
  $g.FillRectangle($cream, $x + 82*$s, $y + 156*$s, 28*$s, 18*$s)
  $g.DrawLine($outline, $x + 36*$s, $y + 160*$s, $x + 30*$s, $y + 184*$s)
  $g.DrawLine($outline, $x + 105*$s, $y + 160*$s, $x + 112*$s, $y + 184*$s)
  $g.DrawLine($outline, $x + 30*$s, $y + 184*$s, $x + 62*$s, $y + 184*$s)
  $g.DrawLine($outline, $x + 112*$s, $y + 184*$s, $x + 142*$s, $y + 184*$s)
  $outline.Dispose(); $skin.Dispose(); $hair.Dispose(); $shirt.Dispose(); $pack.Dispose(); $cream.Dispose(); $eye.Dispose()
}

function New-Hero($file, $scene) {
  $bmp = New-Object System.Drawing.Bitmap 1800, 600
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#FFF7EA'))
  $ground = Brush '#FDE9DA'
  $hillBlue = Brush '#B9D6E8'
  $hillPeach = Brush '#F2B8AB'
  $outline = Pen '#C98378' 5
  $g.FillPolygon($hillBlue, @([System.Drawing.Point]::new(0,470), [System.Drawing.Point]::new(500,280), [System.Drawing.Point]::new(970,470)))
  $g.FillPolygon($hillPeach, @([System.Drawing.Point]::new(590,470), [System.Drawing.Point]::new(1120,255), [System.Drawing.Point]::new(1600,470)))
  $g.FillRectangle($ground, 0, 468, 1800, 132)
  $g.DrawArc($outline, 120, 380, 520, 170, 190, 150)
  $g.DrawArc($outline, 785, 365, 590, 180, 190, 150)
  Add-Cloud $g 90 65 1.1; Add-Cloud $g 620 78 0.9; Add-Cloud $g 1390 62 1.0

  if ($scene -eq 'map') {
    Add-Person $g 1330 264 1.25 '#9FB9D7' $true
    $paper = Brush '#FFFDF2'; $g.FillPolygon($paper, @([System.Drawing.Point]::new(1170,382), [System.Drawing.Point]::new(1282,350), [System.Drawing.Point]::new(1322,446), [System.Drawing.Point]::new(1208,466)))
    $g.DrawPolygon($outline, @([System.Drawing.Point]::new(1170,382), [System.Drawing.Point]::new(1282,350), [System.Drawing.Point]::new(1322,446), [System.Drawing.Point]::new(1208,466)))
    $route = Pen '#9C7AB6' 6; $route.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash; $g.DrawArc($route, 1195, 380, 90, 58, 180, 145); $route.Dispose(); $paper.Dispose()
  }
  if ($scene -eq 'group') {
    Add-Person $g 1180 280 0.95 '#F0ADAD' $false
    Add-Person $g 1375 315 0.8 '#AFC6D8' $true
    Add-Person $g 1535 275 0.98 '#F3C77B' $false
  }
  if ($scene -eq 'album') {
    Add-Person $g 1350 275 1.0 '#D7A9C6' $true
    $camera = Brush '#E998A3'; $lens = Brush '#FFF8E9'
    $g.FillRectangle($camera, 1150, 380, 150, 88)
    $g.DrawRectangle($outline, 1150, 380, 150, 88)
    $g.FillEllipse($lens, 1195, 397, 65, 65); $g.DrawEllipse($outline, 1195, 397, 65, 65)
    $camera.Dispose(); $lens.Dispose()
  }
  if ($scene -eq 'cards') {
    Add-Person $g 1420 280 0.9 '#C8A8DC' $true
    foreach ($x in @(1080, 1230, 1360)) {
      $card = Brush '#FFFDF8'; $g.FillRectangle($card, $x, 230 + (($x / 10) % 2)*25, 115, 170); $g.DrawRectangle($outline, $x, 230 + (($x / 10) % 2)*25, 115, 170); $g.FillEllipse((Brush '#F3C27E'), $x+32, 265, 52, 52); $card.Dispose()
    }
  }

  $g.Dispose(); $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

$workspace = Split-Path $PSScriptRoot -Parent
$project = Get-ChildItem -Path $workspace -Directory | Where-Object { $_.Name -like '*2.0' } | Select-Object -First 1
$headers = Join-Path $project.FullName 'images\headers'
New-Hero (Join-Path $headers 'map-hero-v3.png') 'map'
New-Hero (Join-Path $headers 'group-hero-v3.png') 'group'
New-Hero (Join-Path $headers 'album-hero-v3.png') 'album'
New-Hero (Join-Path $headers 'cards-hero-v3.png') 'cards'
