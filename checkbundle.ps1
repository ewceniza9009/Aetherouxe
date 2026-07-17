cd X:\reps
foreach ($f in (docker compose exec -T app sh -c "ls /app/admin-web/dist/assets/*.js" 2>$null | Out-String).Split() | Where-Object { $_ -like '*.js' }) {
  $c = docker compose exec -T app sh -c "grep -o -E 'groupThousands|startOfDay|tabular-nums|calendar' '$f'" 2>$null | Out-String
  $counts = ($c -split "`n" | Where-Object { $_ } | Group-Object | ForEach-Object { "$($_.Name):$($_.Count)" }) -join " "
  Write-Output "$f -> $counts"
}
