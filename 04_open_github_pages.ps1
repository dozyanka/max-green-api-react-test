[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is not installed."
}
if (-not (Test-Path (Join-Path $PSScriptRoot ".git"))) {
    throw "This folder is not a Git repository. Run .\02_publish_github.ps1 first."
}

$repoFullName = [string](& gh repo view --json nameWithOwner --jq .nameWithOwner)
$repoFullName = $repoFullName.Trim()
if (-not $repoFullName) { throw "Could not determine GitHub repository." }

$parts = $repoFullName -split '/', 2
$url = "https://$($parts[0]).github.io/$($parts[1])/"
Write-Host $url -ForegroundColor Green
Start-Process $url
