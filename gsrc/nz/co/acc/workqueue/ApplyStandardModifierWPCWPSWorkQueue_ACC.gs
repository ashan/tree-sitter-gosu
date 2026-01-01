package nz.co.acc.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.processes.WorkQueueBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.impl.ModifierInstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.ModifierInstructionRecord
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.integration.instruction.recordmapper.impl.ModifierInstructionRecordMapper
uses typekey.PolicyLine

uses java.math.BigDecimal

class ApplyStandardModifierWPCWPSWorkQueue_ACC extends WorkQueueBase<PolicyTerm, StandardWorkItem> {
  final var LOG = StructuredLogger.CONFIG.withClass(this)

  construct() {
    super(BatchProcessType.TC_APPLYSTANDARDMODIFIERWPCWPS_ACC, StandardWorkItem, PolicyTerm)
  }


  override function findTargets() : Iterator<PolicyTerm> {
      var ptQuery = Query.make(PolicyTerm).withDistinct(true)
      ptQuery
          .compare(PolicyTerm#AEPFinancialYear_ACC, Relop.GreaterThanOrEquals, DateUtil_ACC.currentLevyYear())
          .compare(PolicyTerm#ModifierApplied_ACC, Relop.Equals, false)
      var ppQuery = ptQuery.join("ID", PolicyPeriod, "PolicyTerm")
      var plQuery = ppQuery.join("ID", entity.PolicyLine, "Branch")
      plQuery.compareIn(entity.PolicyLine#Subtype, {PolicyLine.TC_CWPSLINE,PolicyLine.TC_EMPWPCLINE})
      return ptQuery.select().iterator()
  }

  override function processWorkItem(item : StandardWorkItem) {
    var policyTerm = extractTarget(item)
    var record = new ModifierInstructionRecord(
        policyTerm.Policy.Account.ACCID_ACC,
        policyTerm.Policy.ProductCode_ACC.Suffix.toString(),
        policyTerm.getAEPFinancialYear_ACC(),
        0,
        BigDecimal.ZERO,
        "STD",
        false,
        "",
        InstructionConstantHelper.JOB_POLICYCHANGE,
        InstructionSource_ACC.TC_BATCH
    )

    LOG.info("Creating instruction record for ${policyTerm.DisplayName}")
    var mapper = new ModifierInstructionRecordMapper()
    var file : InstructionFile_ACC
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var instructionEntity = mapper.createEntity(bundle, record, Optional.ofNullable(file))
    })
  }

  private function processBulkModifierRecord(record : ModifierInstructionRecord) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      new ModifierInstructionRecordHandler(record).processInstructionRecord(bundle)
    })
  }

}