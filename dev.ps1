$ErrorActionPreference = "Stop"

Write-Host "Checking for .env file..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host ".env file found." -ForegroundColor Green
}

Write-Host "Starting infrastructure services (Postgres, MongoDB, Redis, MinIO) in Docker..." -ForegroundColor Cyan
# This starts only the backend infrastructure and skips the 'app' container, 
# keeping the ports available for your host workstation.
docker-compose up -d postgres mongodb redis minio

Write-Host "Starting all development servers (API, Admin Web, Owner Web, Resident Web)..." -ForegroundColor Cyan
npm run dev
