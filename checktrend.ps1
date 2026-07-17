cd X:\reps
$raw = docker compose exec -T app sh -c "curl -s -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@elite-realty.com\",\"password\":\"Admin123!\"}'" 2>$null | Out-String
Write-Output "RAW_LOGIN: $raw"
$token = ($raw | ConvertFrom-Json).access_token
Write-Output "TOKEN_LEN=$($token.Length)"
$out = docker compose exec -T app sh -c "curl -s 'http://localhost:4000/api/reports/revenue-trend?months=6' -H 'Authorization: Bearer $token'" 2>$null | Out-String
Write-Output "TREND: $out"
