package edge.capabilities.policychange.bind

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException
uses java.lang.Exception
uses gw.api.util.Logger
uses edge.security.authorization.Authorizer
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.policychange.dto.PaymentDetailsDTO
uses edge.capabilities.policychange.bind.dto.PolicyChangeBindDTO
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.capabilities.currency.dto.AmountDTO
uses java.math.BigDecimal

/**
 * Default binding implementation.
 */
class DefaultPolicyChangeBindPlugin implements IPolicyChangeBindPlugin {
  /**
   * The PolicyPeriod authorizer used to check access to a policy period.
   */
  var _policyPeriodAuthorizer : Authorizer<PolicyPeriod> as readonly PolicyPeriodAuthorize

  private var _paymentPlugin : IPolicyChangePaymentPlugin

  private static final var LOGGER = Logger.forCategory(DefaultPolicyChangeBindPlugin.Type.QName)

  @ForAllGwNodes
  construct(authorizerProvider:IAuthorizerProviderPlugin, paymentPlugin:IPolicyChangePaymentPlugin) {
    _policyPeriodAuthorizer = authorizerProvider.authorizerFor(PolicyPeriod)
    _paymentPlugin = paymentPlugin
  }

  override function bind(policyChange : PolicyChange, paymentDetails : PaymentDetailsDTO) : boolean{
    if ( policyChange.SelectedVersion.PolicyChangeProcess.canIssue().Okay &&
         policyChange.SelectedVersion.PolicyChangeProcess.canBind().Okay ) {
      try {
        if (paymentDetails == null || paymentDetails.PaymentMethod == "none") {
          var amt = AmountDTO.fromMonetaryAmount(policyChange.SelectedVersion.TransactionCostRPT)  // Generates AmountDTO to handle differences between Diamond and Emerald
          if ( amt.Amount.compareTo(BigDecimal.ZERO) > 0 ) {
            throw new JsonRpcInvalidRequestException(){
              :Message = "No payment method provided"
            };
          }
        } else if (paymentDetails.PaymentMethod == 'redistribute') {
          policyChange.SelectedVersion.BillImmediatelyPercentage = 0
          policyChange.SelectedVersion.AllocationOfRemainder = BillingRemainderAllocate.TC_SPREADACROSSINSTLMNTS
        } else {
          _paymentPlugin.pay(paymentDetails)
          policyChange.SelectedVersion.DepositCollected = policyChange.SelectedVersion.TransactionCostRPT
        }

        policyChange.SelectedVersion.PolicyChangeProcess.issueJob(true)
        return checkForAndApplyToFutureUnboundRenewal(policyChange.SelectedVersion)
      } catch (e : Exception) {
        LOGGER.error("Exception occured while binding and issuing period", e)
        throw new PolicyChangeUnderwritingException(e)
      }
    } else {
      throw new PolicyChangeUnderwritingException() {
        :Message = "Unable to bind and issue the policy change"
      }
    }
  }

  /**
   *  This function is responsible for automatically applying changes made in the policy change to a future unbound renewal.
   *  Returns true if a renewal exists and changes were applied forward.
   */
  function checkForAndApplyToFutureUnboundRenewal(policyPeriod : PolicyPeriod) : boolean{
    if (!policyPeriod.JobProcess.applyChangeToFutureRenewalAutomatic() && policyPeriod.JobProcess.canApplyChangesToFutureUnboundRenewal()){
      policyPeriod.JobProcess.applyChangesToFutureUnboundRenewal()
      return true
    }
    return false //Implicit
  }

}
