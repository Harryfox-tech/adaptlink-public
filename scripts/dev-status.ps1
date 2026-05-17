$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pidsFile = Join-Path $root ".dev\pids.json"

if (-not (Test-Path $pidsFile)) {
  Write-Host "未检测到脚本启动记录。"
  exit 0
}

$pids = Get-Content -Raw $pidsFile | ConvertFrom-Json

function Show-State($name, $pid) {
  try {
    $p = Get-Process -Id $pid -ErrorAction Stop
    Write-Host "$name PID=$pid 运行中 CPU=$($p.CPU)"
  } catch {
    Write-Host "$name PID=$pid 未运行"
  }
}

Show-State "API" $pids.apiPid
Show-State "WEB" $pids.webPid
Write-Host "startedAt=$($pids.startedAt)"
