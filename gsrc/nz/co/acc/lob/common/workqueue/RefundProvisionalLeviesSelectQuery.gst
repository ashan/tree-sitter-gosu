<%@ params( policyLine: String, levyYear: int ) %>
SELECT * FROM  (
    SELECT
            pp.id,
            pp.accpolicyid_acc,
            pp.levyyear_acc,
            pp.totalcostrpt,
            pp.periodend,
            Row_number() OVER (partition BY pp.accpolicyid_acc, pp.levyyear_acc ORDER BY CASE WHEN pst.NAME='Completed' THEN 1 ELSE 0 END, pp.updatetime DESC, pp.mostrecentmodel DESC) IdxPerLevyYear,
            Sum(CASE WHEN pst.NAME = 'Completed' THEN 1 ELSE 0 END) OVER ( partition BY pp.accpolicyid_acc, pp.levyyear_acc) HasCurrentFinalAudit
    FROM   pc.dbo.pc_account a
            INNER JOIN pc.dbo.pc_policy p
                    ON p.accountid = a.id
            INNER JOIN pc.dbo.pc_policyperiod pp
                    ON pp.policyid = p.id
            INNER JOIN pc.dbo.pctl_policyperiodstatus pst
                    ON pst.id = pp.status
            INNER JOIN pc.dbo.pc_job pj
                    ON pj.id = pp.jobid
            INNER JOIN pc.dbo.pctl_job pjo
                    ON pjo.id = pj.subtype
    WHERE  p.productcode = '${policyLine}'
            AND pst.NAME IN ( 'Bound', 'Completed' )
) x
WHERE  x.IdxPerLevyYear = 1
       AND Isnull(x.totalcostrpt, 0) > 0
       AND x.HasCurrentFinalAudit = 0
       AND x.levyyear_acc = ${levyYear}
ORDER  BY accpolicyid_acc,
          levyyear_acc