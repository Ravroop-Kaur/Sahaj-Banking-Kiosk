param(
    [Parameter(Mandatory=$true)][string]$DataFile,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$rows = Get-Content -Raw -LiteralPath $DataFile | ConvertFrom-Json
$width = 1500; $height = 1000
$navy = [System.Drawing.Color]::FromArgb(22, 55, 82)
$teal = [System.Drawing.Color]::FromArgb(0, 125, 126)
$gray = [System.Drawing.Color]::FromArgb(77, 92, 106)
$red = [System.Drawing.Color]::FromArgb(170, 35, 35)
foreach ($row in $rows) {
    $bitmap = [System.Drawing.Bitmap]::new($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::White)
    $pen = [System.Drawing.Pen]::new($teal, 5)
    $g.DrawRectangle($pen, 24, 24, 1452, 952)
    $header = [System.Drawing.SolidBrush]::new($navy)
    $g.FillRectangle($header, 27, 27, 1446, 150)
    $titleFont = [System.Drawing.Font]::new('Arial', 37, [System.Drawing.FontStyle]::Bold)
    $subFont = [System.Drawing.Font]::new('Arial', 19, [System.Drawing.FontStyle]::Bold)
    $labelFont = [System.Drawing.Font]::new('Arial', 22, [System.Drawing.FontStyle]::Bold)
    $valueFont = [System.Drawing.Font]::new('Arial', 27, [System.Drawing.FontStyle]::Regular)
    $smallFont = [System.Drawing.Font]::new('Arial', 12, [System.Drawing.FontStyle]::Bold)
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $dark = [System.Drawing.SolidBrush]::new($navy)
    $muted = [System.Drawing.SolidBrush]::new($gray)
    $warning = [System.Drawing.SolidBrush]::new($red)
    $g.DrawString('SYNTHETIC DEMO BANK', $titleFont, $white, 62, 52)
    $g.DrawString('PASSBOOK  |  NOT A REAL BANK DOCUMENT', $subFont, $white, 65, 113)
    $g.DrawString('SYNTHETIC SAMPLE ONLY - NOT VALID FOR BANKING', $smallFont, $warning, 64, 204)
    $g.DrawLine([System.Drawing.Pen]::new([System.Drawing.Color]::LightGray, 2), 60, 245, 1440, 245)

    $g.DrawString('CUSTOMER NAME', $labelFont, $muted, 70, 280)
    $g.DrawString([string]$row.name, $valueFont, $dark, 70, 320)
    $g.DrawString('ACCOUNT NO:', $labelFont, $muted, 70, 405)
    $g.DrawString([string]$row.account, $valueFont, $dark, 330, 400)
    $g.DrawString('CUSTOMER REF:', $labelFont, $muted, 880, 405)
    $g.DrawString([string]$row.customer_ref, $valueFont, $dark, 1170, 405)

    $g.DrawString('ACCOUNT TYPE', $labelFont, $muted, 70, 505)
    $g.DrawString([string]$row.type, $valueFont, $dark, 70, 545)
    $g.DrawString('BRANCH', $labelFont, $muted, 800, 505)
    $g.DrawString([string]$row.branch, $valueFont, $dark, 800, 545)
    $g.DrawString('DATE OF BIRTH (DEMO)', $labelFont, $muted, 70, 625)
    $g.DrawString([string]$row.dob, $valueFont, $dark, 70, 665)
    $g.DrawString('PHONE (SYNTHETIC)', $labelFont, $muted, 800, 625)
    $g.DrawString([string]$row.phone, $valueFont, $dark, 800, 665)
    $g.DrawString('ADDRESS (DEMO)', $labelFont, $muted, 70, 735)
    $g.DrawString([string]$row.address, $valueFont, $dark, 70, 775)
    $g.DrawString('OCCUPATION (DEMO)', $labelFont, $muted, 800, 735)
    $g.DrawString([string]$row.occupation, $valueFont, $dark, 800, 775)
    $g.DrawString('BALANCE (DEMO)', $labelFont, $muted, 70, 835)
    $g.DrawString(('INR {0:N2}' -f ([double]$row.balance_paise / 100)), $valueFont, $dark, 70, 875)
    $g.DrawString(('DEMO ID: ' + [string]$row.demo_id + ' | DEMO PAN: ' + [string]$row.demo_pan + ' - INVALID FOR IDENTITY'), $smallFont, $warning, 800, 850)
    $g.DrawLine([System.Drawing.Pen]::new([System.Drawing.Color]::LightGray, 2), 60, 920, 1440, 920)
    $g.DrawString('For software demonstration and OCR testing only. All records and values are fictional.', $smallFont, $muted, 70, 935)

    $path = Join-Path $OutputDirectory ('passbook-' + $row.customer_ref.ToLowerInvariant() + '.png')
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bitmap.Dispose(); $pen.Dispose(); $header.Dispose()
    $titleFont.Dispose(); $subFont.Dispose(); $labelFont.Dispose(); $valueFont.Dispose(); $smallFont.Dispose()
    $white.Dispose(); $dark.Dispose(); $muted.Dispose(); $warning.Dispose()
}
