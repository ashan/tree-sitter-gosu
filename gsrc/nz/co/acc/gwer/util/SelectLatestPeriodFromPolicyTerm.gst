SELECT TOP 1 pp.ID
FROM pc_policyperiod pp
JOIN pctl_policyperiodstatus pps ON pps.ID = pp.Status
JOIN pc_job pj ON pj.ID = pp.JobID
LEFT JOIN pc_auditinformation pa ON pa.ID = pj.AuditInformationID
LEFT JOIN pctl_revisiontype art ON art.ID = pa.RevisionType 
LEFT JOIN pc_policyperiod app ON app.ID = pp.BasedOnID
LEFT JOIN pc_job apj ON apj.ID = app.JobID
LEFT JOIN pc_auditinformation apa ON apa.ID = apj.AuditInformationID
WHERE pps.TYPECODE IN ('bound', 'auditcomplete')
AND pa.ReversalDate IS NULL
AND pp.PolicyTermID = ?
AND pp.Retired = 0
ORDER BY 
IIF(pps.TYPECODE='bound', pp.ModelDate, pa.AuditPeriodEndDate) DESC,
IIF(pps.TYPECODE='bound', 0, pa.AuditScheduleType) DESC,
IIF(pps.TYPECODE='bound', CAST('1900-01-01' as datetime2), IIF(art.TYPECODE='Reversal',apa.CreateTime, pa.CreateTime)) DESC,

IIF(pps.TYPECODE='bound', 0, IIF(pa.ReversalDate IS NOT NULL,1,IIF(art.TYPECODE='Reversal',2,3))) DESC