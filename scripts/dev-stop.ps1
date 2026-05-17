$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pidsFile = Join-Path $root ".dev\pids.json"

function Stop-If-Running($pid) {
  if (-not $pid) { return }
  try {
    Get-Process -Id $pid -ErrorAction Stop | Out-Null
    Stop-Process -Id $pid -Force
    Write-Host "已停止进程 PID=$pid"
  } catch {
    Write-Host "进程不存在或已停止 PID=$pid"
  }
}

if (-not (Test-Path $pidsFile)) {
  Write-Host "未找到 PID 文件，可能未通过脚本启动。"
  exit 0
}

$pids = Get-Content -Raw $pidsFile | ConvertFrom-Json
Stop-If-Running $pids.apiPid
Stop-If-Running $pids.webPid

Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
Write-Host "开发环境已停止。"
