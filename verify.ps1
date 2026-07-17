cd X:\reps
$login = docker compose exec -T app sh -c "curl -s -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@elite-realty.com\",\"password\":\"Admin123!\"}'" 2>$null | Out-String
$token = ($login | ConvertFrom-Json).access_token
Write-Output "TOKEN_LEN=$($token.Length)"

$ar = docker compose exec -T app sh -c "curl -s 'http://localhost:4000/api/ar-aging' -H 'Authorization: Bearer $token'" 2>$null | Out-String | ConvertFrom-Json
$kpi = docker compose exec -T app sh -c "curl -s 'http://localhost:4000/api/reports/portfolio-kpis' -H 'Authorization: Bearer $token'" 2>$null | Out-String | ConvertFrom-Json

Write-Output "AR Aging totalReceivable     = $($ar.totalReceivable)"
Write-Output "Analytics totalReceivable    = $($kpi.totalReceivable)"
Write-Output "Analytics monthlyRecurring   = $($kpi.monthlyRecurringRevenue)"
Write-Output "Analytics totalEquity        = $($kpi.totalEquityAccumulated)"
Write-Output "Analytics activeLeases       = $($kpi.activeLeases)"
Write-Output "Analytics activeRtoContracts = $($kpi.activeRtoContracts)"
