package gw.web.line.common

uses gw.api.web.job.JobWizardHelper

@Export
class RatingOverrideUIHelper {
  private var _issuesBlockingRatingOverride: UWIssue[]
  private var _applyPremiumThreshold = Boolean.FALSE

  function beforeCommit(line : PolicyLine, jobWizardHelper : JobWizardHelper, applyPremiumThreshold:Boolean) {
    _applyPremiumThreshold = applyPremiumThreshold
    _issuesBlockingRatingOverride = jobWizardHelper.requestRatingOverride(line, applyPremiumThreshold)
  }

  function afterCommit(period : PolicyPeriod, jobWizardHelper : JobWizardHelper) {
    if (_issuesBlockingRatingOverride == null) {
      throw new IllegalStateException("Cannot call 'afterCommit' before calling 'beforeCommit'")
    }
    if (_applyPremiumThreshold == false) {
      period.PremiumThresholdDisabled_ACC = true
    }
    period.Bundle.commit()
    jobWizardHelper.synchronizeWizardStateAfterRealCommit()
    if (_issuesBlockingRatingOverride.HasElements) {
      pcf.UWBlockProgressIssuesPopup.push(period, jobWizardHelper, _issuesBlockingRatingOverride.CurrentBlockingPoint,
          _issuesBlockingRatingOverride)
    }
  }

  static function clearAllOverrides(line : PolicyLine) {
    line.Costs.each(\ cost -> cost.resetOverrides())
  }

  static function hasAnyOverridableCosts(line : PolicyLine) : boolean {
    return line.Costs.hasMatch(\ cost -> cost.Overridable)
  }
}