[CmdletBinding()]
param(
    [string]$Message = "chore: update project"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed."
}
if (-not (Test-Path (Join-Path $PSScriptRoot ".git"))) {
    throw "This folder is not a Git repository. Run .\02_publish_github.ps1 first."
}

& git add .
if ($LASTEXITCODE -ne 0) { throw "git add failed." }

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

& git commit -m $Message
if ($LASTEXITCODE -ne 0) { throw "git commit failed." }

& git push
if ($LASTEXITCODE -ne 0) { throw "git push failed." }

Write-Host "Changes pushed successfully." -ForegroundColor Green
