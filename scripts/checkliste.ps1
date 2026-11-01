# Erzeugt docs/CHECKLISTE.md aus data/coverage.json (Aufruf: powershell -File scripts\checkliste.ps1)
$root = Split-Path $PSScriptRoot -Parent
$cov = Get-Content (Join-Path $root 'data\coverage.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$k = $cov.kreise
$voll = @($k | Where-Object { $_.status -eq 'vollständig' }).Count
$arb = @($k | Where-Object { $_.status -eq 'in Arbeit' }).Count
$offen = @($k | Where-Object { $_.status -eq 'offen' }).Count

$out = @()
$out += '# Checkliste Landkreise Bayern'
$out += ''
$out += "Automatisch erzeugt aus data/coverage.json (Stand $($cov.updated)). Nicht von Hand ändern, sondern coverage.json pflegen und das Skript neu ausführen."
$out += ''
$out += "**Fortschritt:** $voll von $($k.Count) vollständig, $arb in Arbeit, $offen offen."
$out += ''
$out += '- [x] vollständig  - [~] in Arbeit  - [ ] offen'
foreach ($b in ($k | Group-Object bezirk | Sort-Object { ($_.Group | Select-Object -First 1).prio })) {
    $v = @($b.Group | Where-Object { $_.status -eq 'vollständig' }).Count
    $out += ''
    $out += "## $($b.Name) ($v/$($b.Count))"
    $out += ''
    foreach ($e in ($b.Group | Sort-Object prio)) {
        $m = switch ($e.status) { 'vollständig' { 'x' } 'in Arbeit' { '~' } default { ' ' } }
        $chk = if ($e.checked) { $e.checked } else { 'nie' }
        $out += "- [$m] $($e.kreis) - $($e.races) Läufe, geprüft: $chk"
    }
}
Set-Content (Join-Path $root 'docs\CHECKLISTE.md') -Value $out -Encoding UTF8
"OK: $($k.Count) Einträge ($(@($k | Where-Object typ -eq 'Landkreis').Count) Landkreise, $(@($k | Where-Object typ -eq 'kreisfreie Stadt').Count) kreisfreie Städte)"
