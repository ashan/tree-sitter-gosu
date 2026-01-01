<%@ params( batchID: String ) %>
(
    select
    irs.typecode, count(*)
    from pcx_irinboundrecord_acc ir
    join pctl_irinboundrecordstatus_acc irs on irs.ID = ir.Status
    where ir.IRInboundBatch_ACCID = ${batchID}
    and ir.Retired = 0
    group by irs.typecode
)
union
(
    select
    irt.typecode, count(*)
    from pcx_irinboundrecord_acc ir
    join pctl_irextrecordtype_acc irt on irt.ID = ir.IRExtRecordType_ACC
    where ir.IRInboundBatch_ACCID = ${batchID}
    and ir.Retired = 0
    group by irt.typecode
)
union
(
    select 'GrossEarnings', sum(ir.GrossEarnings)
    from pcx_irinboundrecord_acc ir
    where ir.IRInboundBatch_ACCID = ${batchID}
	and ir.Retired = 0
)

