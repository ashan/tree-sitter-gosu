package nz.co.acc.plm.integration.irbulk.inbound

uses java.math.BigDecimal

/**
 * Script parameters for the IR Bulk Email Feed inbound process.
 */
enhancement ScriptParametersEnhancement_ACC: ScriptParameters {

  /**
   * Enables regex email address validation in the IRD contact bulk email address updater
   */
  public static property get IRBulkEmailFeedEmailValidationEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("IRBulkEmailFeedEmailValidationEnabled_ACC") as boolean
  }

  /**
   * The IR Bulk handlers will reject incoming files exceeding this number of lines (not including headers/blank lines)
   */
  public static property get IRBulkLinesPerFile_ACC(): Integer {
    return (ScriptParameters.getParameterValue("IRBulkLinesPerFile_ACC") as BigDecimal).intValue()
  }
}
