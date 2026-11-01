# Startet die App lokal: kopiert die Daten nach app/data und öffnet einen kleinen Webserver auf http://localhost:8080
$root = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force (Join-Path $root 'app\data') | Out-Null
Copy-Item (Join-Path $root 'data\races.json'), (Join-Path $root 'data\plz.json') (Join-Path $root 'app\data') -Force
Write-Host "App läuft auf http://localhost:8080 (beenden mit Strg+C)"
python -m http.server 8080 --directory (Join-Path $root 'app')
