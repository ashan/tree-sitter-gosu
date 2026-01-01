package nz.co.acc.account

uses gw.surepath.suite.integration.logging.StructuredLogger
uses wsi.remote.gw.webservice.bc.bc_acc.bcaccountapi.BCAccountAPI

uses java.math.BigDecimal

class AccountStatusEvaluator {
  final var LOG = StructuredLogger.CONFIG.withClass(this)
  final var _getRemainingBalanceFunc(accID : String) : BigDecimal

  final var _bcAccountAPI = new BCAccountAPI()

  static final var FINAL_STATUSES = {
      StatusOfAccount_ACC.TC_LIQUIDATION,
      StatusOfAccount_ACC.TC_RECEIVERSHIP,
      StatusOfAccount_ACC.TC_BANKRUPT,
      StatusOfAccount_ACC.TC_REMOVED,
      StatusOfAccount_ACC.TC_DECEASED
  }.toSet()

  public construct() {
    _getRemainingBalanceFunc =
        \accID : String -> _bcAccountAPI.getAccountRemainingUnsettledBalance(accID)
  }

  public construct(getRemainingBalanceFunc(accountNumber : String) : BigDecimal) {
    _getRemainingBalanceFunc = getRemainingBalanceFunc
  }

  public static function evaluateNewAccountStatusFromPreupdate(policyInPreupdateBundle : Policy) {
    var account = policyInPreupdateBundle.Account
    if (not canUpdateStatus(account)) {
      return
    }
    account.StatusWorkQueuePending_ACC = true
  }

  public function evaluateNewAccountStatus(account : Account, balance: Optional<BigDecimal>) {
    if (not canUpdateStatus(account)) {
      return
    }

    var policyList = account.Policies.where(\policy -> policy.Active_ACC).toList()

    if (policyList.hasMatch(\policy -> policy.Status_ACC == PolicyStatus_ACC.TC_ACTIVE and policy.ActiveReason_ACC == ActiveReason_ACC.TC_LEVYPAYER)) {
      LOG.info("Account ${account.ACCID_ACC} has Policy with Active Levy Payer status. Setting account status to Active Levy Payer")
      account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_ACTIVE, ActiveReason_ACC.TC_LEVYPAYER, null)

    } else if (policyList.hasMatch(\policy -> policy.Status_ACC == PolicyStatus_ACC.TC_ACTIVE and policy.ActiveReason_ACC == ActiveReason_ACC.TC_EARNER)) {
      LOG.info("Account ${account.ACCID_ACC} has Policy with Active Earner status. Setting account status to Active Earner")
      account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_ACTIVE, ActiveReason_ACC.TC_EARNER, null)

    } else {
      if (not balance.Present) {
        var fetchedBalance = _getRemainingBalanceFunc(account.ACCID_ACC)
        LOG.info("Account ${account.ACCID_ACC} fetched remaining balance ${fetchedBalance}")
        balance = Optional.of(fetchedBalance)
      }
      if (balance.get().IsZero) {
        if (policyList.HasElements and policyList.allMatch(\policy -> policy.Status_ACC == PolicyStatus_ACC.TC_CEASED)) {
          LOG.info("Account ${account.ACCID_ACC} has zero balance and all policies are Ceased. Setting account status to Ceased")
          account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_CEASED, null, null)
        } else {
          var hasActiveNewCustomerPolicies = account.Policies.hasMatch(\policy -> policy.Status_ACC == PolicyStatus_ACC.TC_ACTIVE and policy.ActiveReason_ACC == ActiveReason_ACC.TC_NEWCUSTOMER)
          if (hasActiveNewCustomerPolicies) {
            LOG.info("Account ${account.ACCID_ACC} has active new customer policies. Setting account status to Active New Customer")
            account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_ACTIVE, ActiveReason_ACC.TC_NEWCUSTOMER, null)
          } else {
            LOG.info("Account ${account.ACCID_ACC} has zero balance and no ceased policies. Setting account status to Inactive")
            account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_INACTIVE, null, null)
          }
        }

      } else if (balance.get() < 0) {
        LOG.info("Account ${account.ACCID_ACC} has credit balance. Setting account status to Active - Credit Only ")
        account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_ACTIVE, ActiveReason_ACC.TC_CREDITONLY, null)
      } else {
        LOG.info("Account ${account.ACCID_ACC} has debit balance. Setting account status to Active - Debt Only ")
        account.setAccountStatusAndEndDate(StatusOfAccount_ACC.TC_ACTIVE, ActiveReason_ACC.TC_DEBTONLY, null)
      }
    }
  }

  private static function canUpdateStatus(account : Account) : boolean {
    if (FINAL_STATUSES.contains(account.StatusOfAccount_ACC)) {
      return false
    }
    if (not ScriptParameters.AccountStatusUpdateEnabled_ACC) {
      return false
    }
    if (account.AEPContractAccount_ACC) {
      return false
    }
    return (account.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_ACTIVE or
        account.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_INACTIVE or
        account.StatusOfAccount_ACC == StatusOfAccount_ACC.TC_CEASED)
  }

}