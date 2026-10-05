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
Start-Process 'http://localhost:3000'
npm start
