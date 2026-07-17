cd X:\reps
foreach ($f in (docker compose exec -T app sh -c "ls /app/admin-web/dist/assets/*.js" 2>$null | Out-String).Split() | Where-Object { $_ -like '*.js' }) {
  $c = docker compose exec -T app sh -c "grep -o -E 'B(?=\\\\d\{3\})|d\{3\}\)|\\\\u20b1|\\\\u00A5|left-3|pl-7' '$f'" 2>$null | Out-String
  $counts = ($c -split "`n" | Where-Object { $_ } | Group-Object | ForEach-Object { "$($_.Name):$($_.Count)" }) -join " "
  Write-Output "$f -> $counts"
}
