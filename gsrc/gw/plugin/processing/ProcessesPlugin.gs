package gw.plugin.processing
uses gw.integration.document.production.bulk.BulkSubmission
uses gw.processes.BatchProcess
uses gw.processes.PolicyRenewalClearCheckDate
uses gw.processes.SolrDataImportBatchProcess

uses edge.capabilities.quote.session.QuoteSessionCleanupBatchProcess
uses edge.capabilities.document.DocumentSessionCleanupBatchProcess
uses nz.co.acc.common.integration.files.outbound.BaseOutboundFileBatchProcess
uses nz.co.acc.dashboard_acc.UpdateDashboardHistory_ACC
uses nz.co.acc.er.batch.ERRecalcBatch_ACC
uses nz.co.acc.gwer.batch.ERProcessRunRequest_ACC
uses nz.co.acc.gwer.batch.ERRunBatches_ACC
uses nz.co.acc.plm.integration.ir.stats.UpdateIRInboundWorkQueueStatsBatch_ACC
uses nz.co.acc.gwer.batch.ERClaimsExtractInboundFileBatch_ACC
@Export
class ProcessesPlugin implements IProcessesPlugin {

  construct() {
  }

  override function createBatchProcess(type : BatchProcessType, arguments : Object[]) : BatchProcess {
    switch(type) {
      case BatchProcessType.TC_POLICYRENEWALCLEARCHECKDATE:
        return new PolicyRenewalClearCheckDate()
      case BatchProcessType.TC_SOLRDATAIMPORT:
        return new SolrDataImportBatchProcess()
      case BatchProcessType.TC_PORTALQUOTESESSION_MPEXT:
        return new QuoteSessionCleanupBatchProcess()
      case BatchProcessType.TC_BULKSUBMISSION:
        return new BulkSubmission()
      case BatchProcessType.TC_PORTALDOCUMENTSESSION_MPEXT:
          return new DocumentSessionCleanupBatchProcess()
      case BatchProcessType.TC_UPDATEIRINBOUNDWORKQUEUESTATS_ACC:
          return new UpdateIRInboundWorkQueueStatsBatch_ACC()
      // CPX Letters - Outbound file
      case BatchProcessType.TC_OUTBOUNDMAILHOUSELETTERSFILE_ACC:
        return new BaseOutboundFileBatchProcess(type)
      case BatchProcessType.TC_UPDATEDASHBOARDHISTORY_ACC:
        return new UpdateDashboardHistory_ACC()
      case BatchProcessType.TC_ERRECALCREQUEST_ACC:
        return new ERRecalcBatch_ACC()
      case BatchProcessType.TC_ERPROCESSRUNREQUEST_ACC:
        return new ERProcessRunRequest_ACC()
      case BatchProcessType.TC_ERCLAIMSEXTRACTINBOUNDFILEBATCH_ACC:
        return new ERClaimsExtractInboundFileBatch_ACC()
      case BatchProcessType.TC_ERRUNBATCHES_ACC:
        return new ERRunBatches_ACC()
      default:
        return null
    }
  }

}
