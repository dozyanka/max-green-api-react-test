[CmdletBinding()]
param(
    [int]$Port = 5173,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Assert-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is not installed. $Hint"
    }
}

function Invoke-Step {
    param([string]$Label, [scriptblock]$Action)
    Write-Host "`n=== $Label ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

Assert-Command "node" "Install Node.js 22 LTS: https://nodejs.org/"
Assert-Command "npm" "npm is installed together with Node.js."

$nodeText = (& node --version).TrimStart('v')
$nodeVersion = [version]$nodeText
if ($nodeVersion.Major -lt 20) {
    throw "Node.js 20.19+ is required. Installed: $nodeText"
}

Write-Host "Project: $PSScriptRoot" -ForegroundColor DarkGray
Write-Host "Node.js: $nodeText" -ForegroundColor DarkGray

if (-not (Test-Path (Join-Path $PSScriptRoot "node_modules"))) {
    Invoke-Step "Install npm dependencies" { & npm install }
}
else {
    Write-Host "`nnode_modules already exists; skipping npm install." -ForegroundColor DarkGray
}

if (-not $SkipTests) {
    Invoke-Step "Run unit tests" { & npm test }
}

Write-Host "`nStarting Vite on http://localhost:$Port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the dev server." -ForegroundColor DarkGray
& npm run dev -- --host 127.0.0.1 --port $Port