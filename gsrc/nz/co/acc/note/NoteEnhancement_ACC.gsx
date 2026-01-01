package nz.co.acc.note

uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.web.policy.PolicyBillingUIHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by RaithaJ on 9/03/2017.
 */
enhancement NoteEnhancement_ACC: entity.Note {

  function onTopicChange(policy: Policy): String {
    var currentMethod = "onTopicChange"
    final var ZERO = "0"
    if (this.Topic != NoteTopicType.TC_DELINQUENCY_ACC) {
      this.SubTopic_ACC = null
      return ZERO
    } else {
      if (policy != null) {
        var billingPlugin = gw.plugin.Plugins.get(gw.plugin.billing.IBillingSummaryPlugin)
        try {
          var outStandingBalance_ACC = PolicyBillingUIHelper.retrieveBillingSummary(
              billingPlugin, policy.LatestBoundPeriod).PastDue.Amount.toString().trim()
          return outStandingBalance_ACC
        }catch(e:Exception){
          StructuredLogger.INTEGRATION.error_ACC(this.getClass().getName() + " " + currentMethod + " " +"Calling Billingcenter For Balance.")
          return ZERO
        }
      } else {
        return ZERO
      }
    }
  }

  function onSubTopicChange(policy: Policy, outStandingBalance_ACC: String, isCalledBillingCenter_ACC: Boolean): String {
    var currentMethod = "onSubTopicChange"
    final var ZERO = "0"
    if (!isCalledBillingCenter_ACC && policy != null) {
        var billingPlugin = gw.plugin.Plugins.get(gw.plugin.billing.IBillingSummaryPlugin)
        try {
          outStandingBalance_ACC = PolicyBillingUIHelper.retrieveBillingSummary(
              billingPlugin, policy.LatestBoundPeriod).PastDue.Amount.toString().trim()
        }catch(e:Exception){
          StructuredLogger.INTEGRATION.error_ACC(this.getClass().getName() + " " + currentMethod + " " + "Calling Billingcenter For Balance.")
          outStandingBalance_ACC = ZERO
        }
    }
    this.Subject = this.SubTopic_ACC.Description
    this.setBody(DisplayKey.get("Custom.NewNoteDV.Body_ACC", gw.api.util.DateUtil.currentDate().format("yyyy-MM-dd"),
        this.SubTopic_ACC.Description, outStandingBalance_ACC == null ? ZERO : outStandingBalance_ACC))

    return outStandingBalance_ACC
  }

  function filterTopics(values: typekey.NoteTopicType[], policy: Policy): List<NoteTopicType> {
    if (policy != null) {
      return values.where(\f -> f != NoteTopicType.TC_GENERAL).toList()
    } else {
      return values.where(\f -> f != NoteTopicType.TC_GENERAL and f != NoteTopicType.TC_DELINQUENCY_ACC).toList()
    }
  }

}
