# Woechentliche Pruefung auf dem eigenen PC (Windows-Aufgabenplanung, sonntags).
# Holt den neuesten Stand, liest die Seiten, die GitHub nicht lesen darf, und speichert das Ergebnis.
$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\cmd\git.exe"
Set-Location (Split-Path $PSScriptRoot -Parent)

& $git pull --ff-only origin main
python scripts\pc_pruefung.py

& $git add data/quellen-status.json docs/AENDERUNGEN_PC.md
& $git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    $msg = Join-Path $env:TEMP "pc_commit.txt"
    "Wochenpruefung vom PC: Seiten, die GitHub nicht lesen darf`n`nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" | Set-Content $msg -Encoding utf8
    & $git commit -F $msg
    & $git push origin main
}
