$ErrorActionPreference = "Stop"
$patchDir = $PSScriptRoot
$projectDir = Split-Path $patchDir -Parent

if (-not (Test-Path (Join-Path $projectDir "package.json"))) {
    throw "Extract the patch folder directly inside MAX_GreenAPI_React_Test, then run apply_patch.ps1 from the patch folder."
}

Copy-Item (Join-Path $patchDir "README.md") (Join-Path $projectDir "README.md") -Force
Copy-Item (Join-Path $patchDir "02_publish_github.ps1") (Join-Path $projectDir "02_publish_github.ps1") -Force
Copy-Item (Join-Path $patchDir "docs\SUBMISSION.md") (Join-Path $projectDir "docs\SUBMISSION.md") -Force

$obsolete = @(
    (Join-Path $projectDir ".github\workflows\deploy-pages.yml"),
    (Join-Path $projectDir "04_open_github_pages.ps1")
)

foreach ($path in $obsolete) {
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Removed: $path" -ForegroundColor DarkGray
    }
}

Write-Host "Patch applied successfully." -ForegroundColor Green
Write-Host "Next run:" -ForegroundColor Cyan
Write-Host '.\03_push_updates.ps1 -Message "chore: remove unused GitHub Pages deployment"'
