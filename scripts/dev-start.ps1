param(
  [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$pidsFile = Join-Path $root ".dev\pids.json"
$apiLog = Join-Path $root ".dev\logs\api.log"
$webLog = Join-Path $root ".dev\logs\web.log"

function Read-Pids {
  if (Test-Path $pidsFile) {
    try { return Get-Content -Raw $pidsFile | ConvertFrom-Json } catch { return $null }
  }
  return $null
}

function Is-Running($pid) {
  if (-not $pid) { return $false }
  try { Get-Process -Id $pid -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Stop-If-Running($pid) {
  if (Is-Running $pid) {
    Stop-Process -Id $pid -Force
  }
}

$existing = Read-Pids
if ($existing -and -not $ForceRestart) {
  $apiAlive = Is-Running $existing.apiPid
  $webAlive = Is-Running $existing.webPid
  if ($apiAlive -or $webAlive) {
    Write-Host "已有开发进程在运行。使用 -ForceRestart 强制重启。" -ForegroundColor Yellow
    Write-Host "API PID: $($existing.apiPid) (alive=$apiAlive)"
    Write-Host "WEB PID: $($existing.webPid) (alive=$webAlive)"
    exit 0
  }
}

if ($existing -and $ForceRestart) {
  Stop-If-Running $existing.apiPid
  Stop-If-Running $existing.webPid
}

$python = "C:\Users\shiqing peng\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $python)) {
  throw "未找到 Python: $python"
}

$apiProc = Start-Process -FilePath $python `
  -ArgumentList "-m uvicorn app.main:app --reload --port 8000 --app-dir apps/api" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $apiLog `
  -RedirectStandardError $apiLog `
  -PassThru

$webProc = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run dev:web" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $webLog `
  -RedirectStandardError $webLog `
  -PassThru

$pids = [pscustomobject]@{
  apiPid = $apiProc.Id
  webPid = $webProc.Id
  startedAt = (Get-Date).ToString("s")
}
$pids | ConvertTo-Json | Set-Content -Encoding UTF8 $pidsFile

Write-Host "开发环境已启动。" -ForegroundColor Green
Write-Host "Web: http://localhost:3000"
Write-Host "API: http://localhost:8000/docs"
Write-Host "API PID: $($apiProc.Id)"
Write-Host "WEB PID: $($webProc.Id)"
Write-Host "日志:"
Write-Host "  $apiLog"
Write-Host "  $webLog"
Write-Host "停止命令: powershell -ExecutionPolicy Bypass -File scripts/dev-stop.ps1"
