Patch 02 - clean GitHub Actions

Why:
- GitHub Pages was intentionally skipped.
- The deploy-pages workflow was still triggered on push and produced a red failed Action.
- CI itself is successful.

How to apply:
1. Extract this Patch_02_clean_github_actions folder directly inside:
   C:\Users\shata\Desktop\MAX_GreenAPI_React_Test
2. Open PowerShell in the patch folder.
3. Run:
   Set-ExecutionPolicy -Scope Process Bypass
   .\apply_patch.ps1
4. Return to the project folder and push:
   cd ..
   .\03_push_updates.ps1 -Message "chore: remove unused GitHub Pages deployment"

The patch deletes:
- .github\workflows\deploy-pages.yml
- 04_open_github_pages.ps1

It updates:
- README.md
- docs\SUBMISSION.md
- 02_publish_github.ps1
