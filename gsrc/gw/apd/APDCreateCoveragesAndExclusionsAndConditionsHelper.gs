package gw.apd

uses gw.api.web.job.JobWizardHelper

@Export
class APDCreateCoveragesAndExclusionsAndConditionsHelper {

  static function createCoveragesExclusionsAndConditions(patterns: gw.api.productmodel.ClausePattern[], coverable : Coverable, jobWizardHelper : JobWizardHelper) {
    var callOnChange = false
    for (pattern in patterns) {
      coverable.createCoverageConditionOrExclusion(pattern)
      if (!callOnChange) {
        callOnChange = gw.web.rules.APDRulesHelper.hasDependents(coverable, pattern)
      }
    }
    if (callOnChange) {
      gw.web.rules.APDRulesHelper.onChange(coverable, jobWizardHelper)
    }
  }
}