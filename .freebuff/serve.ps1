param([int]$Port = 8777, [string]$Root = (Get-Location).Path)

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.mjs'  = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf'
  '.mp3'  = 'audio/mpeg'
  '.wav'  = 'audio/wav'
  '.md'   = 'text/plain; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
}

$rootFull = (Resolve-Path $Root).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Output "SERVING $rootFull at http://127.0.0.1:$Port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($rel -eq '') { $rel = 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $rootFull $rel))
    if (-not $path.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }
    if ((Test-Path $path -PathType Container)) { $path = Join-Path $path 'index.html' }
    if (-not (Test-Path $path -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $buf = [Text.Encoding]::UTF8.GetBytes("404 $rel")
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $ctx.Response.OutputStream.Write($buf, 0, $buf.Length)
      $ctx.Response.Close(); continue
    }
    $bytes = [IO.File]::ReadAllBytes($path)
    $ext = [IO.Path]::GetExtension($path).ToLower()
    $ctx.Response.StatusCode = 200
    $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
  } catch {
    Write-Output ("ERR " + $_.Exception.Message)
  }
}
