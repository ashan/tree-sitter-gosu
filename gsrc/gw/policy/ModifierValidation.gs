package gw.policy
uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationBase
uses gw.validation.PCValidationContext

uses java.math.BigDecimal

@Export
class ModifierValidation extends PCValidationBase {

  var _modifier : Modifier

  construct(valContext : PCValidationContext, modifier : Modifier) {
    super(valContext)
    _modifier = modifier
  }

  override protected function validateImpl() {
    Context.addToVisited(this, "validateImpl")
    if (_modifier.DataType == TC_TYPEKEY) {
      var validTypeCodes = _modifier.Pattern.TypeListAsTypeList.getTypeKeys(false).map(\ t -> t.Code)
      validTypeCodes.add(null)  //none selected
      if (not validTypeCodes.contains(_modifier.TypeKeyModifier)) {
        Result.addError(_modifier, TC_QUOTABLE, DisplayKey.get("Web.Modifier.Validation.InvalidModifierCode", _modifier.Pattern.PublicID, _modifier.TypeKeyModifier))
      }
    }
    if (_modifier.ScheduleRate) {
      for (rate in _modifier.RateFactors) {
        var verifyFactor = verifyRateFactor(rate)
        var verifyAssessment = checkValueRanges(rate, rate.AssessmentWithinLimits)
        if (verifyFactor != null) Result.addError(rate, TC_QUOTABLE, verifyFactor)
        if (verifyAssessment != null) Result.addError(rate, TC_QUOTABLE, verifyAssessment)
      }
    }
  }

  static function verifyRateFactor(rate : RateFactor): String {
    if (rate.Assessment != 0 and rate.Pattern.ModifierPattern.DisplayJustification == true and rate.Justification == null) {
      return DisplayKey.get("Web.RatingFactors.JustificationNeeded")
    }
    return null
  }

  static function checkValueRanges(rate : RateFactor, value : java.math.BigDecimal) : String {
    if (!rate.isValueWithinRange( value as String )) {
      return DisplayKey.get("Web.Policy.RateFactor.OutOfRange", value, rate.Minimum, rate.Maximum)
    }
    return null
  }

  public static function checkExpRatingRunNumberModifierInput_ACC(modifier : Modifier) : String {
    //Rate Modifier Range check
    if (modifier.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate")) {
      if(modifier.RateModifier == null) return null
      if(modifier.RateModifier < -1 or modifier.RateModifier > 1) {
        return DisplayKey.get("Web.CoverPlus_ACC.Experience.Rating.ModifierRateRange")
      }
    }

    //Run Number Range Check
    if (modifier.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber")) {
      if (modifier.RateModifier == null) return null
      // The second condition below is for Decimal check in the Run Number
      if((modifier.RateModifier < -999999 or modifier.RateModifier > 999999) or
          (modifier.RateModifier.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0)) {
        return DisplayKey.get("Web.ModifiersScreen.Validator.ERRunNumber")
      }
    }
    return null
  }

  public static function getHelpTextForExpRatingModifiers_ACC(modifier : Modifier) : String{
    if (modifier.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate")) {
      return DisplayKey.get("Web.CoverPlus_ACC.Experience.Rating.ModifierRateRange")
    }
    if (modifier.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber")) {
      return DisplayKey.get("Web.ModifiersScreen.Validator.ERRunNumber")
    }
    return null
  }
}

