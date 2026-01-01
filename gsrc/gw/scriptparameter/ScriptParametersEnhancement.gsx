package gw.scriptparameter

enhancement ScriptParametersEnhancement: ScriptParameters {

  public static property get EnableDisplayBasicSearchTab(): Boolean {
    return ScriptParameters.getParameterValue("EnableDisplayBasicSearchTab") as Boolean
  }

  public static property get HOPQuoteLevel1Indent(): Integer {
    return ScriptParameters.getParameterValue("HOPQuoteLevel1Indent") as Integer
  }

  public static property get HOPQuoteLevel2Indent(): Integer {
    return ScriptParameters.getParameterValue("HOPQuoteLevel2Indent") as Integer
  }

  public static property get HOPQuoteLevel3Indent(): Integer {
    return ScriptParameters.getParameterValue("HOPQuoteLevel3Indent") as Integer
  }

  public static property get APDProductLinesGosuPackage(): String {
    return ScriptParameters.getParameterValue("APDProductLinesGosuPackage") as String
  }

  //Whether or not digital auto generation is allowed for products in APD
  public static property get APDEnableDigitalAutoGenConfig(): boolean {
    return ScriptParameters.getParameterValue("APDEnableDigitalAutoGenConfig") as boolean
  }

  /**
   * When set to true, APD will:
   *   1) block activation of preloaded editions when invalid rules loaded
   *   2) throw an exception when an invalid rule is executed
   * When set to false, APD will:
   *   1) allow activation of preloaded editions with invalid rules loaded
   *   2) skip execution of invalid rule and log an error
   * This parameter is ignored when running in production server mode;
   * preloaded editions with invalid rules are always blocked from activation and
   * evaluating invalid rules will always throw an execution exception in this case.
   */
  public static property get APDBlockInvalidEditionsInDev(): boolean {
    return ScriptParameters.getParameterValue("APDBlockInvalidEditionsInDev") as boolean
  }
}
