$ErrorActionPreference = "Stop"

Write-Host "Checking for .env file..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host ".env file found." -ForegroundColor Green
}

if (-not (Test-Path "apps\api\.env")) {
    Write-Host "Copying .env to API app for Prisma..." -ForegroundColor Yellow
    Copy-Item ".env" "apps\api\.env"
}

Write-Host "Starting infrastructure services (Postgres, MongoDB, Redis, MinIO) in Docker..." -ForegroundColor Cyan
# This starts only the backend infrastructure and skips the 'app' container, 
# keeping the ports available for your host workstation.
docker-compose up -d postgres mongodb redis minio

Write-Host "Starting all development servers (API, Admin Web, Owner Web, Resident Web)..." -ForegroundColor Cyan
Start-Process "vivaldi" -ArgumentList "http://localhost:5173"
npm run dev
