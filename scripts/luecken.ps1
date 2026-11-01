# Erzeugt docs/LUECKEN.md: pro Lauf, welche Detailfelder fehlen (Aufruf: powershell -File scripts\luecken.ps1)
$root = Split-Path $PSScriptRoot -Parent
$r = (Get-Content (Join-Path $root 'data\races.json') -Raw -Encoding UTF8 | ConvertFrom-Json).races
$felder = [ordered]@{ fee='Startgeld'; start_time='Startzeit'; reg_close='Meldeschluss'; limit='Limit'; pickup='Startunterlagen'; parking='Parken'; aid='Verpflegung' }

function Fehlt($x) {
    $m = @()
    foreach ($k in $felder.Keys) {
        $hat = $x.PSObject.Properties.Name -contains $k -and $x.$k
        $prevHat = $x.PSObject.Properties.Name -contains 'prev' -and $x.prev -and ($x.prev.PSObject.Properties.Name -contains $k) -and $x.prev.$k
        $na = $x.PSObject.Properties.Name -contains 'na' -and $x.na -and ($x.na -contains $k)
        if (-not $hat -and -not $prevHat -and -not $na) { $m += $felder[$k] }
    }
    $m
}

$out = @('# Lücken pro Lauf', '', "Automatisch erzeugt aus data/races.json. Als vorhanden zählt ein aktueller Wert, ein belegter Vorjahreswert (prev) oder ""Veranstalter macht keine Angabe"" (na).", '')
$rows = foreach ($x in ($r | Sort-Object date)) { [pscustomobject]@{ r = $x; m = @(Fehlt $x) } }
$gesamt = $rows.Count * $felder.Count
$luecken = ($rows | ForEach-Object { $_.m.Count } | Measure-Object -Sum).Sum
$out += "**$($rows.Count) Läufe, $luecken von $gesamt Detailfeldern offen** (" + [math]::Round(100 * (1 - $luecken / $gesamt)) + " % gefüllt)."
$out += ''
$out += '| Feld | offen bei Läufen |'
$out += '|---|---|'
foreach ($k in $felder.Keys) { $n = @($rows | Where-Object { $_.m -contains $felder[$k] }).Count; $out += "| $($felder[$k]) | $n |" }
$out += ''
$stufen = @(
    @{ t = 'Stufe 1: bis 24.01.2027 (nächste 12 Wochen)'; von = '0000'; bis = '2027-01-24' },
    @{ t = 'Stufe 2: 25.01.2027 bis 30.04.2027'; von = '2027-01-25'; bis = '2027-04-30' },
    @{ t = 'Stufe 3: ab 01.05.2027'; von = '2027-05-01'; bis = '9999' }
)
foreach ($s in $stufen) {
    $sel = @($rows | Where-Object { $_.r.date -ge $s.von -and $_.r.date -le $s.bis -and $_.m.Count -gt 0 } | Sort-Object { -$_.m.Count })
    $out += "## $($s.t) ($($sel.Count) Läufe mit Lücken)"
    $out += ''
    foreach ($z in $sel) { $out += "- $($z.r.date) $($z.r.name) ($($z.r.kreis)) - fehlt: $($z.m -join ', ')" }
    $out += ''
}
Set-Content (Join-Path $root 'docs\LUECKEN.md') -Value $out -Encoding UTF8
$out[4]
