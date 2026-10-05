$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$xampp = 'D:\xamppp'

if (Test-Path (Join-Path $xampp 'mysql\bin\mysqld.exe')) {
  $portOpen = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue
  if (-not $portOpen) {
    Start-Process -FilePath (Join-Path $xampp 'mysql\bin\mysqld.exe') -ArgumentList '--defaults-file=mysql\bin\my.ini','--standalone' -WorkingDirectory $xampp -WindowStyle Hidden
    Start-Sleep -Seconds 3
  }
}

Set-Location $project
if (-not (Test-Path (Join-Path $project 'node_modules'))) {
  npm install
}
if (Get-Command py -ErrorAction SilentlyContinue) {
  $ttsReady = py -c "import edge_tts" 2>$null
  if ($LASTEXITCODE -ne 0) { py -m pip install -r (Join-Path $project 'requirements-tts.txt') }
  $ttsScript = Join-Path $project 'tts-service.py'
  $ttsPort = Test-NetConnection -ComputerName 127.0.0.1 -Port 8770 -InformationLevel Quiet -WarningAction SilentlyContinue
  if (-not $ttsPort) { Start-Process py -ArgumentList "-3 `"$ttsScript`"" -WorkingDirectory $project -WindowStyle Hidden }
}
$appPort = 3000
$appReady = Test-NetConnection -ComputerName 127.0.0.1 -Port $appPort -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $appReady) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory $project
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $appReady = Test-NetConnection -ComputerName 127.0.0.1 -Port $appPort -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($appReady) { break }
  }
}
if ($appReady) {
  Start-Process 'http://localhost:3000'
} else {
  Write-Error 'TikLiveTools nu a pornit pe portul 3000. Verifică fereastra Node/npm pentru eroare.'
}
