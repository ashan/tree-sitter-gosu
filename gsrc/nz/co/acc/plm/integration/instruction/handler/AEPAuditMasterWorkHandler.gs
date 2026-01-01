package nz.co.acc.plm.integration.instruction.handler

uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * WorkHandler for AEPAuditMaster
 */
class AEPAuditMasterWorkHandler extends WorkHandlerBase {
  final var LOG = StructuredLogger_ACC.CONFIG.withClass(this)

  private var _levyYear : Integer

  /**
   * Load the Parameters.
   *
   * The expected value is "[PolicyNumber],[LevyYear]"
   */
  override public function loadParameters() {
    var values : String[]
    var parameters = this.InstructionWorker.Parameters

    if (parameters != null) {
      values = parameters.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 2) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }

    _policyNumber = values[0]
    _levyYear = Integer.valueOf(values[1])

  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    LOG.info("doWork: PolicyNumber=${_policyNumber}, LevyYear=${_levyYear}")
    doAudit(_policyNumber, _levyYear, bundle)
  }

}