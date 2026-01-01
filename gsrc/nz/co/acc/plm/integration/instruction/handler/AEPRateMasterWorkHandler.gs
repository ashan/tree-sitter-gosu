package nz.co.acc.plm.integration.instruction.handler

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

/**
 * The work handler class for "AEPRateMaster"
 */
class AEPRateMasterWorkHandler extends WorkHandlerBase {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)

  /**
   * Load the Parameters.
   *
   * The expected value is "[PolicyNumber],[EffDate]"
   */
  override public function loadParameters() {
    this.loadPolicyNumberAndEffDate(InstructionWorker.Parameters)
  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    LOG.info("doWork: PolicyNumber=${_policyNumber}, EffDate=${_effDate}")
    doPolicyChange(_policyNumber, _effDate, bundle)
  }
}
