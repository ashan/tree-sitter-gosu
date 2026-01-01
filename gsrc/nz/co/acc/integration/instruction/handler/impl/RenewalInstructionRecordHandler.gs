package nz.co.acc.integration.instruction.handler.impl

uses gw.lang.reflect.ReflectUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.record.impl.RenewalInstructionRecord
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil

class RenewalInstructionRecordHandler extends InstructionRecordHandler<RenewalInstructionRecord> {
  final var LOG = StructuredLogger_ACC.INTEGRATION.withClass(this)

  construct(instructionRecord : RenewalInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {

    var period = InstructionRecordHandlerUtil.findMostRecentPolicyTerm(
        InstructionRecord.ACCID,
        InstructionRecord.ProductCode.Code)

    if (period == null) {
      return
    }

    var currentLevyYear = Date.Now.LevyYear_ACC

    LOG.info("Renewing period ${period} to levy year ${currentLevyYear}")

    while (period.LevyYear_ACC < currentLevyYear) {
      period = renew(period)
    }
  }

  private function renew(period: PolicyPeriod) : PolicyPeriod {
    LOG.info("Starting renewal for period ${period}")
    var renewalPeriod: PolicyPeriod

    // ignore instruction bundle and process renewals in separate transactions
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var renewal = new Renewal(bundle)
      ActionsUtil.setIRFlags(renewal)
      renewal.startJob(period.Policy)
      renewalPeriod = renewal.LatestPolicyPeriod

      // JUNO-16507 - Renewal included previous years earnings
      // Fix copied from EarningsUpdatePolicyActions.doPolicyRenew
      // Issue does not affect RenewalAPIHandler
      ReflectUtil.invokeStaticMethod("rules.Renewal.RenewalAutoUpdate", "invoke", {renewalPeriod})

      renewalPeriod.RenewalProcess.requestQuote()
      renewalPeriod.RenewalProcess.issueJob(true)
    })

    LOG.info("Finished renewal for period ${period}")
    return renewalPeriod
  }

}