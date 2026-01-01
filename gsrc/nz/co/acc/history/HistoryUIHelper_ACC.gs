package nz.co.acc.history

uses entity.History
uses entity.Job


/**
 * Created by Chris Anderson on 17/02/2020.
 * JUNO-1331 Add Policy Change Detail to Account File History
 */
class HistoryUIHelper_ACC {

  function addReasonToPolicyChangeDescription(history : History, job : Job) : String {
    var historyDescription = ""
    if (job.Subtype == typekey.Job.TC_POLICYCHANGE) {
      historyDescription = history.Description.concat(" for Levy Year ${job.PolicyTerm.AEPFinancialYear_ACC}")
      if (job.TriggerReason_ACC != null) {
        historyDescription = historyDescription.concat(" - ${job.TriggerReason_ACC.DisplayName}")
      }
      if (job.LatestPeriod.CeasedTradingDate_ACC != null) {
        // There could be a trigger reason
        // and the ceased trading flag may have been set at the time
        historyDescription = historyDescription.concat(" - Policy Ceased")
      }
    } else {
      historyDescription = history.Description
    }
    return historyDescription
  }
}