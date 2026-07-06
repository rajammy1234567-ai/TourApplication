# Explore platform — start backend, admin, user app, vendor app (Windows)
# Usage: .\scripts\start-all.ps1

$Root = Split-Path -Parent $PSScriptRoot

function Start-ExploreWindow($title, $command) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; $command" -WindowStyle Normal
  Write-Host "Started $title"
}

Write-Host "=== Explore Platform Startup ===" -ForegroundColor Cyan
Write-Host ""

Start-ExploreWindow "Backend (5000)" "cd ExploreApp-backend; npm run dev"
Start-Sleep -Seconds 3

Start-ExploreWindow "Admin (5173)" "cd ExploreApp-admin; npm run dev"
Start-Sleep -Seconds 2

Start-ExploreWindow "User App (Expo)" "cd ExploreApp-frontend; npm start"
Start-Sleep -Seconds 1

Start-ExploreWindow "Vendor App (Expo)" "cd ExploreApp-vendor; npm start"

Write-Host ""
Write-Host "Services:" -ForegroundColor Green
Write-Host "  Backend API   -> http://localhost:5000"
Write-Host "  Admin Panel   -> http://localhost:5173"
Write-Host "  User App      -> Expo QR in new window"
Write-Host "  Vendor App    -> Expo QR in new window"
Write-Host ""
Write-Host "Default logins:" -ForegroundColor Yellow
Write-Host "  Admin   -> admin@explore.com / admin123"
Write-Host "  Vendor  -> 9876543210 / vendor123"
Write-Host ""
Write-Host "Complete flow:" -ForegroundColor Yellow
Write-Host "  1. User: Register -> Profile -> Become a Vendor"
Write-Host "  2. Admin: Partner Applications -> Approve (set password)"
Write-Host "  3. User: See credentials in Partner Application + notifications"
Write-Host "  4. Vendor app: Login with phone + password -> Add tour/stay"
Write-Host "  5. Admin: Listings -> Approve tour/stay"
Write-Host "  6. User: Book tour (Razorpay 10%) or hotel (Reserve)"
Write-Host "  7. User: My Bookings + Admin: Bookings panel"