[CmdletBinding()]
param(
    [string]$RepoName = "max-green-api-react-test",
    [ValidateSet("public", "private")]
    [string]$Visibility = "public",
    [string]$Description = "React chat client for MAX via GREEN-API",
    [switch]$SkipPages
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Assert-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is not installed. $Hint"
    }
}

function Invoke-Native {
    param([string]$Label, [scriptblock]$Action)
    Write-Host "`n=== $Label ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

Assert-Command "git" "Install Git for Windows: https://git-scm.com/download/win"
Assert-Command "gh" "Install GitHub CLI: https://cli.github.com/"

& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub CLI is not authenticated. Run: gh auth login" -ForegroundColor Yellow
    & gh auth login
    if ($LASTEXITCODE -ne 0) { throw "GitHub authentication failed." }
}

if (-not (Test-Path (Join-Path $PSScriptRoot ".git"))) {
    Invoke-Native "Initialize Git repository" { & git init -b main }
}
else {
    & git branch -M main
}

# Use a repository-local GitHub noreply identity so a personal Git email is not exposed
# in public commit metadata. This does not modify the user's global Git configuration.
$owner = (& gh api user --jq .login).Trim()
$userId = (& gh api user --jq .id).Trim()
if (-not $owner -or -not $userId) {
    throw "Could not determine the GitHub account identity."
}
& git config --local user.name $owner
& git config --local user.email "$userId+$owner@users.noreply.github.com"
if ($LASTEXITCODE -ne 0) { throw "Could not configure repository-local Git identity." }

Invoke-Native "Stage files" { & git add . }
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Invoke-Native "Create commit" { & git commit -m "feat: complete GREEN-API MAX React test assignment" }
}
else {
    Write-Host "`nNothing new to commit." -ForegroundColor DarkGray
}

$origin = (& git remote get-url origin 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $origin) {
    & gh repo view "$owner/$RepoName" *> $null
    if ($LASTEXITCODE -eq 0) {
        Invoke-Native "Attach existing GitHub repository" {
            & git remote add origin "https://github.com/$owner/$RepoName.git"
        }
    }
    else {
        $visibilityFlag = "--$Visibility"
        Invoke-Native "Create GitHub repository" {
            & gh repo create "$owner/$RepoName" $visibilityFlag --description $Description --source . --remote origin
        }
    }
}

Invoke-Native "Push main branch" { & git push -u origin main }

$repoInfo = (& gh repo view --json nameWithOwner,url --jq '"\(.nameWithOwner)|\(.url)"').Trim()
$parts = $repoInfo -split '\|', 2
$repoFullName = $parts[0]
$repoUrl = $parts[1]

if (-not $SkipPages -and $Visibility -eq "public") {
    Write-Host "`n=== Enable GitHub Pages (best effort) ===" -ForegroundColor Cyan
    & gh api -X POST "repos/$repoFullName/pages" -f build_type=workflow *> $null
    if ($LASTEXITCODE -ne 0) {
        & gh api -X PUT "repos/$repoFullName/pages" -f build_type=workflow *> $null
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub Pages is configured to use the Actions workflow." -ForegroundColor Green
    }
    else {
        Write-Host "Could not enable Pages automatically. Open Settings -> Pages and choose GitHub Actions." -ForegroundColor Yellow
    }
}

$repoNameResolved = ($repoFullName -split '/', 2)[1]
$ownerResolved = ($repoFullName -split '/', 2)[0]
$pagesUrl = "https://$ownerResolved.github.io/$repoNameResolved/"

Write-Host "`nDONE" -ForegroundColor Green
Write-Host "Repository:   $repoUrl" -ForegroundColor Green
if ($Visibility -eq "public") {
    Write-Host "GitHub Pages: $pagesUrl" -ForegroundColor Green
    Write-Host "Wait for the 'Deploy GitHub Pages' action to finish after the first push." -ForegroundColor DarkGray
}
