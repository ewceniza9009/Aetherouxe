UPDATE mortgage_amortization_schedules AS mas
SET perioddate = la."startDate" + ((mas."periodNumber" - 1) * INTERVAL '1 month')
FROM mortgage_scenarios ms
JOIN lease_agreements la ON la.id = ms."leaseAgreementId"
WHERE mas."mortgageScenarioId" = ms.id
  AND mas.perioddate IS NULL;
