# Start backend + admin panel together
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "ExploreApp-backend"
$Admin = Join-Path $Root "ExploreApp-admin"

Write-Host "Resetting admin password..."
Push-Location $Backend
node scripts/reset-admin.js
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  Write-Host "Failed to reset admin. Check MONGODB_URI in ExploreApp-backend/.env"
  exit 1
}
Pop-Location

Write-Host ""
Write-Host "Starting backend on http://localhost:5000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; npm run dev"

Start-Sleep -Seconds 4

Write-Host "Starting admin panel on http://localhost:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Admin'; npm run dev"

Write-Host ""
Write-Host "=========================================="
Write-Host "  Admin Panel: http://localhost:5173"
Write-Host "  Email:       admin@explore.com"
Write-Host "  Password:    admin123"
Write-Host "=========================================="
Write-Host "Wait 5-10 seconds, then open the URL above."