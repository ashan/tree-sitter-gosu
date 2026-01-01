SELECT
TOP 1
  pp.ID
FROM pc_policyperiod pp
JOIN pctl_policyperiodstatus pps
  ON pps.ID = pp.Status
JOIN pc_job pj
  ON pj.ID = pp.JobID
LEFT OUTER JOIN pc_auditinformation pa
  ON pa.ID = pj.AuditInformationID
WHERE pps.TYPECODE IN ('bound', 'auditcomplete')
AND pa.ReversalDate IS NULL
AND pp.PolicyTermID = ?
AND pp.Retired = 0
ORDER BY CASE
  WHEN pps.TYPECODE = 'bound' THEN pp.ModelDate
  ELSE pp.UpdateTime
END DESC