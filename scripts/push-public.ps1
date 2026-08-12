# 将当前 main 推送到公开仓库 adaptlink-public
# 用法：在仓库根目录执行 .\scripts\push-public.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Warning "当前不在 main 分支（$branch），请先 checkout main"
    exit 1
}

if (-not (git remote get-url public 2>$null)) {
    git remote add public https://github.com/Harryfox-tech/adaptlink-public.git
}

Write-Host "推送到 public/main ..."
git push public main:main
Write-Host "完成: https://github.com/Harryfox-tech/adaptlink-public"
