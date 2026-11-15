param(
    [Parameter(Mandatory=$true)][string]$SourcePath,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$source = [System.Drawing.Image]::FromFile($SourcePath)
try {
    foreach ($angle in @(0, 90, 180, 270)) {
        $rotated = [System.Drawing.Bitmap]::new($source)
        switch ($angle) {
            90  { $rotated.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            180 { $rotated.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
            270 { $rotated.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
        }
        $scale = [Math]::Min(3.0, [Math]::Max(1.0, 1600.0 / [Math]::Min($rotated.Width, $rotated.Height)))
        $w = [int][Math]::Round($rotated.Width * $scale)
        $h = [int][Math]::Round($rotated.Height * $scale)
        foreach ($variant in @('gray', 'contrast')) {
            $bitmap = [System.Drawing.Bitmap]::new($w, $h)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $matrix = [float[][]]::new(5)
            if ($variant -eq 'gray') {
                $matrix[0] = [float[]]@(0.299,0.299,0.299,0,0)
                $matrix[1] = [float[]]@(0.587,0.587,0.587,0,0)
                $matrix[2] = [float[]]@(0.114,0.114,0.114,0,0)
            } else {
                $matrix[0] = [float[]]@(0.45,0.45,0.45,0,0)
                $matrix[1] = [float[]]@(0.88,0.88,0.88,0,0)
                $matrix[2] = [float[]]@(0.17,0.17,0.17,0,0)
            }
            $matrix[3] = [float[]]@(0,0,0,1,0)
            $matrix[4] = [float[]]@(0.035,0.035,0.035,0,1)
            $colorMatrix = [System.Drawing.Imaging.ColorMatrix]::new($matrix)
            $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
            $attributes.SetColorMatrix($colorMatrix)
            $rect = [System.Drawing.Rectangle]::new(0,0,$w,$h)
            $graphics.DrawImage($rotated,$rect,0,0,$rotated.Width,$rotated.Height,[System.Drawing.GraphicsUnit]::Pixel,$attributes)
            $outPath = Join-Path $OutputDirectory ("{0}_{1}.png" -f $variant,$angle)
            $bitmap.Save($outPath,[System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose(); $bitmap.Dispose(); $attributes.Dispose()
        }
        $rotated.Dispose()
    }
} finally { $source.Dispose() }
