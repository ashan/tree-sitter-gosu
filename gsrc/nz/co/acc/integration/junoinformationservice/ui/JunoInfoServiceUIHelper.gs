package nz.co.acc.integration.junoinformationservice.ui

uses gw.api.util.DisplayableException

uses nz.co.acc.integration.junoinformationservice.messaging.JISMessageEvents
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Created by Mike Ourednik on 30/07/2020.
 */
class JunoInfoServiceUIHelper {

  static var _log = StructuredLogger.INTEGRATION.withClass(JunoInfoServiceUIHelper)

  public function fullRefresh(account : Account) {
    var user = User.util.getCurrentUser().Credential.UserName

    if (not account.HasPolicy_ACC) {
      throw new DisplayableException("Account must have a policy")
    }

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      _log.info(new StringBuilder()
          .append("User '${user}' manually triggered event ${JISMessageEvents.EVENT_ACCOUNT_CHANGE}")
          .append(" for account=${account.ACCID_ACC}")
          .toString())
      account = bundle.add(account)
      account.addEvent(JISMessageEvents.EVENT_ACCOUNT_CHANGE)

      for (document in account.Documents) {
        _log.info(new StringBuilder(256)
            .append("User '${user}' manually triggered event ${JISMessageEvents.EVENT_DOCUMENT_ADDED}")
            .append(" for account=${account.ACCID_ACC}")
            .append(", document=${document.PublicID}")
            .toString())
        document = bundle.add(document)
        document.addEvent(JISMessageEvents.EVENT_DOCUMENT_ADDED)
      }

      for (policy in account.Policies) {
        for (policyPeriod in policy.PolicyTermFinder_ACC.latestPeriodPerPolicyTerm()) {
          _log.info(new StringBuilder(256)
              .append("User '${user}' manually triggered event ${JISMessageEvents.EVENT_POLICY_CHANGE}")
              .append(" for account=${account.ACCID_ACC}")
              .append(", policyPeriod=${policyPeriod.JunoInfoServiceDisplayName_ACC}")
              .toString())
          policyPeriod = bundle.add(policyPeriod)
          policyPeriod.addEvent(JISMessageEvents.EVENT_POLICY_CHANGE)
        }
      }
    })
  }

}