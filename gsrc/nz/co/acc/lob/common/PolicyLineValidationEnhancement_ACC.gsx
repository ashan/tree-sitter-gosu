package nz.co.acc.lob.common

uses gw.api.locale.DisplayKey
uses gw.policy.ModifierValidation
uses gw.policy.PolicyLineValidation
uses nz.co.acc.lob.util.ModifiersUtil_ACC

/**
 * Created by ManubaF on 23/03/2017.
 */
enhancement PolicyLineValidationEnhancement_ACC: PolicyLineValidation {

  protected function checkExpRatingModifiers() {
    var selectedExpRating = ModifiersUtil_ACC.getSelectedExperienceRating(this.Line.AssociatedPolicyPeriod)
    var modRate = ModifiersUtil_ACC.getExperienceRatingModRateModifier(this.Line.AssociatedPolicyPeriod)
    var runNumber = ModifiersUtil_ACC.getExperienceRatingRunNumberModifier(this.Line.AssociatedPolicyPeriod)

    if (selectedExpRating == null) {
      // TODO ER modifier is not mandatory - for now
      return
      // this.Result.addError(this.Line, TC_DEFAULT, DisplayKey.get("Web.ModifiersScreen.Validator.ER.NotSelected"))
    } else if (selectedExpRating != ExpRatingProgramme_ACC.TC_STANDARD and
        (modRate.RateModifier == null or runNumber.RateModifier == null)) {
      this.Result.addError(this.Line, TC_DEFAULT, DisplayKey.get("Web.ModifiersScreen.Validator.ER.NoRequiredValues"))
    } else if (selectedExpRating != null and runNumber.RateModifier != null) {
      var runNumberError = ModifierValidation.checkExpRatingRunNumberModifierInput_ACC(runNumber)
      if (runNumberError != null) {
        this.Result.addError(this.Line, TC_DEFAULT, runNumberError)
      }
    }
  }
}
