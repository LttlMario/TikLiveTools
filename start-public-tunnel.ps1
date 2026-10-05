$ErrorActionPreference = 'Stop'

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host 'cloudflared nu este instalat.' -ForegroundColor Yellow
  Write-Host 'Instalează Cloudflare cloudflared, apoi rulează din nou acest script.'
  Write-Host 'Nu se deschide niciun port automat și serverul rămâne local până atunci.'
  exit 1
}

Write-Host 'Se expune temporar doar TikLiveTools pe http://127.0.0.1:3000.' -ForegroundColor Cyan
Write-Host 'Copiază URL-ul https://*.trycloudflare.com afișat de cloudflared și introdu-l în Setup > Backend public.' -ForegroundColor Cyan
Write-Host 'Pentru oprire, apasă Ctrl+C.' -ForegroundColor DarkGray
& $cloudflared.Source tunnel --url http://127.0.0.1:3000
