# 本地构建并推送镜像（不用 GitHub Actions 时可用）
# 用法示例：
#   .\scripts\sealos-build-push.ps1 -Owner harryfox-tech -ApiBaseUrl "https://你的-api域名/api/v1"
# 需已 docker login ghcr.io（GitHub PAT，权限 write:packages）

param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,

  [string]$ApiBaseUrl = "http://127.0.0.1:8080/api/v1",

  [string]$Registry = "ghcr.io",

  [switch]$ApiOnly,

  [switch]$WebOnly
)

$ErrorActionPreference = "Stop"
$ownerLc = $Owner.ToLowerInvariant()
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $root
try {
  if (-not $WebOnly) {
    Write-Host "==> Building API: $Registry/${ownerLc}/adaptlink-api:latest"
    docker build -f apps/api/Dockerfile -t "${Registry}/${ownerLc}/adaptlink-api:latest" .
    docker push "${Registry}/${ownerLc}/adaptlink-api:latest"
  }

  if (-not $ApiOnly) {
    Write-Host "==> Building Web: $Registry/${ownerLc}/adaptlink-web:latest"
    Write-Host "    NEXT_PUBLIC_API_BASE_URL=$ApiBaseUrl"
    docker build -f apps/web/Dockerfile `
      --build-arg "NEXT_PUBLIC_API_BASE_URL=$ApiBaseUrl" `
      -t "${Registry}/${ownerLc}/adaptlink-web:latest" .
    docker push "${Registry}/${ownerLc}/adaptlink-web:latest"
  }

  Write-Host ""
  Write-Host "Done. Sealos 镜像名填写："
  if (-not $WebOnly) { Write-Host "  API: ${Registry}/${ownerLc}/adaptlink-api:latest" }
  if (-not $ApiOnly) { Write-Host "  Web: ${Registry}/${ownerLc}/adaptlink-web:latest" }
}
finally {
  Pop-Location
}
