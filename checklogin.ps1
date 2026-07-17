cd X:\reps
$raw = docker compose exec -T app sh -c "curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@elite-realty.com\",\"password\":\"Admin123!\"}'" 2>$null | Out-String
Write-Output "RAW: $raw"
