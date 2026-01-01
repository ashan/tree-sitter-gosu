package nz.co.acc.common.enhancements

uses java.math.BigDecimal

/**
 * Script parameters for the API Management integration framework.
 */
enhancement ScriptParametersEnhancement_ACC : ScriptParameters {

  /**
   * Toggle switch to turn on/off indented JSON payloads in log files. {@code false} by default.
   *
   * @return {@code true} if indentation turned on.
   */
  public static property get APIMgmtJSONPayloadBeautify_ACC() : Boolean {
    return ScriptParameters.getParameterValue("APIMgmtJSONPayloadBeautify_ACC") as boolean
  }

  /**
   * Toggle switch to enable/disable the event fired rules for API Management.
   * When turned off none of the events the API Management messaging destination is listening on will be process. {@code True} by default.
   *
   * @return {@code true} if enabled.
   */
  public static property get APIMgmtMessageQueueEnabled_ACC() : Boolean {
    return ScriptParameters.getParameterValue("APIMgmtMessageQueueEnabled_ACC") as boolean
  }

  /**
   * This toggle switch allows you to deactivate OAuth 2.0 in the client code, if API Management does not require the requests to be authenticated & authorised.
   *
   * @return {@code true} if enabled.
   */
  public static property get APIMgmtOAuth2Enabled_ACC() : Boolean {
    return ScriptParameters.getParameterValue("APIMgmtOAuth2Enabled_ACC") as boolean
  }

  public static property get JunoInformationServiceMessageQueueEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceMessageQueueEnabled_ACC") as boolean
  }

  public static property get JunoInformationServiceNotificationsEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceNotificationsEnabled_ACC") as boolean
  }

  public static function setValue(paramName : String, value : Object) {
    var scriptParam = ScriptParameters
        .getParameterPacks()
        .singleWhere(\parameterPack -> parameterPack.Name == paramName)

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var scriptParameter = bundle.add(ScriptParameters.getOrCreateParameter(scriptParam))
      if (value typeis String) {
        scriptParameter.setVarcharValue(value)
      } else if (value typeis Boolean) {
        scriptParameter.setBitValue(value)
      } else if (value typeis Integer) {
        scriptParameter.setIntegerValue(value)
      } else if (value typeis BigDecimal) {
        scriptParameter.setDecimalValue(value.toString())
      }
    })
  }

  public static property get WorkQueueConfigEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("WorkQueueConfigEnabled_ACC") as boolean;
  }

  public static property get UsePrimaryContact_ACC(): boolean {
    return ScriptParameters.getParameterValue("UsePrimaryContact_ACC") as boolean;
  }

}
