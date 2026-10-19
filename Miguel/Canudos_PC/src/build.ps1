# Monta o Canudos para PC: copia o jogo de ..\..\Canudos para jogo\, gera o ícone,
# copia as DLLs do WebView2 e compila Canudos.exe com o csc do .NET Framework.
# Rodar de novo depois de qualquer mudança no jogo.
$ErrorActionPreference = 'Stop'
$src  = $PSScriptRoot
$root = Split-Path $src -Parent
$fonte = Join-Path (Split-Path $root -Parent) 'Canudos'
Add-Type -AssemblyName System.Drawing

# 1) Arquivos do jogo
$jogo = Join-Path $root 'jogo'
New-Item -ItemType Directory -Force $jogo | Out-Null
$arquivos = 'index.html', 'dados.js', 'nucleo.js', 'historia.js', 'abertura.js', 'render_pixel.js', 'render.js', 'ui.js', 'capa.jpg'
foreach ($a in $arquivos) {
  $de = Join-Path $fonte $a
  if (Test-Path $de) { Copy-Item $de (Join-Path $jogo $a) -Force }
}
# Fontes guardadas junto do jogo: na cópia para PC, o link do Google Fonts vira o CSS local,
# para o jogo funcionar sem internet. (Leitura e escrita em UTF-8 sem BOM: o HTML tem acentos.)
$fontes = Join-Path $fonte 'fontes'
if (Test-Path $fontes) {
  New-Item -ItemType Directory -Force (Join-Path $jogo 'fontes') | Out-Null
  Copy-Item (Join-Path $fontes '*') (Join-Path $jogo 'fontes') -Force
  $html = Join-Path $jogo 'index.html'
  $utf8 = New-Object System.Text.UTF8Encoding $false
  $txt = [IO.File]::ReadAllText($html, $utf8)
  $txt = [regex]::Replace($txt, '<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\r?\n?', '')
  $txt = [regex]::Replace($txt, '<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">', '<link rel="stylesheet" href="fontes/fontes.css">')
  if ($txt -notmatch 'fontes/fontes\.css') { throw 'não achei o link do Google Fonts no index.html' }
  [IO.File]::WriteAllText($html, $txt, $utf8)
}

# 2) DLLs do WebView2 (reaproveitadas do Office instalado; o SDK permite redistribuir)
$sdk = "C:\Program Files\Microsoft Office\root\Office16\ADDINS\Microsoft Power Query for Excel Integrated\bin"
foreach ($d in 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll') {
  if (-not (Test-Path "$root\$d")) { Copy-Item "$sdk\$d" "$root\$d" }
}

# 3) Ícone: as duas torres da igreja de Belo Monte, 16x16, ampliadas sem suavização
$art = @(
  '....W......W....',
  '...WWW....WWW...',
  '....W......W....',
  '...RRR....RRR...',
  '..RRRRR..RRRRR..',
  '..WWWWW..WWWWW..',
  '..WDWDW..WDWDW..',
  '..WWWWWRRWWWWW..',
  '..WWWWRRRRWWWW..',
  '..WWWRRRRRRWWW..',
  '..WWWWWWWWWWWW..',
  '..WWWWWDDWWWWW..',
  '..SSSSSDDSSSSS..',
  '..SSSSSDDSSSSS..',
  'GGGGGGGGGGGGGGGG',
  '.HHHHHHHHHHHHHH.'
)
# (as chaves de hashtable do PowerShell ignoram maiúsculas: uma letra por cor)
$pal = @{ 'W' = '#f1ecdf'; 'S' = '#c8c0ad'; 'R' = '#a24d30'; 'D' = '#3c2716'; 'G' = '#b97a46'; 'H' = '#875231' }
$base = New-Object System.Drawing.Bitmap 16, 16
for ($y = 0; $y -lt 16; $y++) { for ($x = 0; $x -lt 16; $x++) {
  $ch = [string]$art[$y][$x]
  if ($pal.ContainsKey($ch)) { $base.SetPixel($x, $y, [System.Drawing.ColorTranslator]::FromHtml($pal[$ch])) } else { $base.SetPixel($x, $y, [System.Drawing.Color]::Transparent) }
} }
# contorno escuro em volta de tudo, para o ícone aparecer em barra clara ou escura
$contorno = [System.Drawing.ColorTranslator]::FromHtml('#1d120c')
$copia = $base.Clone()
for ($y = 0; $y -lt 16; $y++) { for ($x = 0; $x -lt 16; $x++) {
  if ($copia.GetPixel($x, $y).A -ne 0) { continue }
  $viz = $false
  foreach ($d in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) {
    $nx = $x + $d[0]; $ny = $y + $d[1]
    if ($nx -ge 0 -and $ny -ge 0 -and $nx -lt 16 -and $ny -lt 16 -and $copia.GetPixel($nx, $ny).A -ne 0) { $viz = $true }
  }
  if ($viz) { $base.SetPixel($x, $y, $contorno) }
} }
$copia.Dispose()
$sizes = 16, 32, 48, 256
$pngs = @()
foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
  $g.DrawImage($base, 0, 0, $s, $s); $g.Dispose()
  $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $pngs += , $ms.ToArray(); $bmp.Dispose()
}
$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $ico
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]; $dim = if ($s -ge 256) { 0 } else { $s }
  $bw.Write([byte]$dim); $bw.Write([byte]$dim); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$pngs[$i].Length); $bw.Write([UInt32]$offset)
  $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
$bw.Flush(); [IO.File]::WriteAllBytes("$src\app.ico", $ico.ToArray()); $bw.Dispose(); $base.Dispose()

# 4) Compilação
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $csc /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 `
  "/win32icon:$src\app.ico" `
  "/r:$root\Microsoft.Web.WebView2.Core.dll" "/r:$root\Microsoft.Web.WebView2.WinForms.dll" `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll `
  "/out:$root\Canudos.exe" "$src\Canudos.cs"
if ($LASTEXITCODE -ne 0) { throw "falha na compilação" }
Write-Host "OK -> $root\Canudos.exe"
