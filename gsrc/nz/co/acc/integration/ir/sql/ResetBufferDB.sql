-- Reset PC
delete from pc.dbo.pcx_irinboundrecord_acc
delete from pc.dbo.pcx_irinboundbatch_acc
update pc.dbo.pcx_irschedule_acc set ExternalKey = null

-- Reset BufferDB
update bufferdb.ir.irfeedheader set ingestedbytarget = 0
update bufferdb.ir.irfeedpayload set recordstatus = 'ETL_PS'