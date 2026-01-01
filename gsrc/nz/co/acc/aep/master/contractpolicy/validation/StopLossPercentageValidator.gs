package nz.co.acc.aep.master.contractpolicy.validation

uses gw.api.locale.DisplayKey
uses gw.api.validation.FieldValidationResult
uses gw.api.validation.FieldValidatorBase
uses gw.api.validation.IFieldValidationResult

class StopLossPercentageValidator extends FieldValidatorBase {

  construct() {}

  override function validate(stopLossPercentage: String, p1: Object, parameters: Map<Object, Object>): IFieldValidationResult {
    var result = new FieldValidationResult()

    if (stopLossPercentage != null) {
      var min = ScriptParameters.getParameterValue("AEPContractStopLossPercentageMin_ACC") as Integer
      var max = ScriptParameters.getParameterValue("AEPContractStopLossPercentageMax_ACC") as Integer

      if ((not stopLossPercentage.Numeric) or
          Integer.parseInt(stopLossPercentage) < min or
          Integer.parseInt(stopLossPercentage) > max) {
        result.addError(DisplayKey.get("Validator.StopLossPercentage_ACC", min, max))
      }
    }

    return result
  }

}