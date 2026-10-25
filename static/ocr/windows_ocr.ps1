param([Parameter(Mandatory=$true)][string]$ImageDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
function Await-WinRT($operation, [Type]$resultType) {
    $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    } | Select-Object -First 1
    $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.GetAwaiter().GetResult()
}
$storageFileType = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$streamType = [Windows.Storage.Streams.IRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$decoderType = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$softwareBitmapType = [Windows.Graphics.Imaging.SoftwareBitmap,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$ocrResultType = [Windows.Media.Ocr.OcrResult,Windows.Foundation,ContentType=WindowsRuntime]
$lang = [Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]::new('en-US')
$engine = [Windows.Media.Ocr.OcrEngine,Windows,ContentType=WindowsRuntime]::TryCreateFromLanguage($lang)
if (-not $engine) { throw 'Windows OCR language en-US is unavailable.' }
$results = @()
foreach ($item in Get-ChildItem -LiteralPath $ImageDirectory -Filter '*.png' -File) {
    $file = Await-WinRT ($storageFileType::GetFileFromPathAsync($item.FullName)) $storageFileType
    $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) $streamType
    $decoder = Await-WinRT ($decoderType::CreateAsync($stream)) $decoderType
    $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) $softwareBitmapType
    $recognized = Await-WinRT ($engine.RecognizeAsync($bitmap)) $ocrResultType
    $results += [pscustomobject]@{ variant = $item.BaseName; text = $recognized.Text }
}
ConvertTo-Json -InputObject @($results) -Compress -Depth 4
