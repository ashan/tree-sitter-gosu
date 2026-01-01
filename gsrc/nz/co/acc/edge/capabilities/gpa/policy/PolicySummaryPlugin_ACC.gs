package nz.co.acc.edge.capabilities.gpa.policy

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.gpa.policy.DefaultPolicySummaryPlugin
uses edge.capabilities.gpa.policy.IPolicyLinePlugin
uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO
uses edge.capabilities.gpa.product.IProductPlugin
uses edge.di.annotations.ForAllNodes
uses nz.co.acc.edge.capabilities.gpa.policy.dto.PolicySummaryDTO_ACC

/**
 * Created by nitesh.gautam on 6/03/2017.
 */
class PolicySummaryPlugin_ACC extends DefaultPolicySummaryPlugin {
  private var _policyLinePlugin: IPolicyLinePlugin
  private var _productPlugin: IProductPlugin

  @ForAllNodes
  construct(aPolicyLinePlugin: IPolicyLinePlugin, aProductPlugin: IProductPlugin) {
    super(aPolicyLinePlugin, aProductPlugin);
    _policyLinePlugin = aPolicyLinePlugin
    this._productPlugin = aProductPlugin;
  }

  override function toDTO(aPolicyPeriod: PolicyPeriod, checkDelinquency: boolean): PolicySummaryDTO {
    if (aPolicyPeriod == null) {
      return null
    }

    final var dto = new PolicySummaryDTO_ACC()
    dto.ACCPolicyId = aPolicyPeriod.ACCPolicyID_ACC
    dto.MemberACCID_ACC = aPolicyPeriod.getMemberACCNumber()
    dto.PolicyNumber = aPolicyPeriod.PolicyNumber
    dto.LevyYear = aPolicyPeriod.LevyYear_ACC
    dto.PrimaryInsuredName = aPolicyPeriod.PrimaryInsuredName
    dto.Effective = aPolicyPeriod.EditEffectiveDate
    dto.Expiration = aPolicyPeriod.PeriodEnd
    dto.PolicyLines = _policyLinePlugin.getPolicyLines(aPolicyPeriod)
    dto.DisplayStatus = aPolicyPeriod.PeriodDisplayStatus
    dto.isCancelled = aPolicyPeriod.CancellationDate != null
    dto.isIssued = aPolicyPeriod.Policy.Issued
    dto.CanUserView = perm.PolicyPeriod.view(aPolicyPeriod)
    dto.ProducerCodeOfRecord = aPolicyPeriod.ProducerCodeOfRecord.Code
    dto.ProducerCodeOfService = aPolicyPeriod.Policy.ProducerCodeOfService.Code
    dto.CreatedByMe = aPolicyPeriod.CreateUser == User.util.CurrentUser
    dto.Premium = AmountDTO.fromMonetaryAmount(aPolicyPeriod.TotalPremiumRPT)
    dto.AccountNumber = aPolicyPeriod.Policy.Account.AccountNumber
    dto.AccountHolderName = aPolicyPeriod.Policy.Account.AccountHolderContact.DisplayName
    dto.Product = _productPlugin.toDTO(aPolicyPeriod.Policy.Product)

    if (checkDelinquency) {
      try {
        dto.Delinquent = getPolicyPeriodBillingInfo(aPolicyPeriod.PolicyNumber, aPolicyPeriod.TermNumber).Delinquent
      } catch (ex: Exception) {
        dto.Delinquent = false
      }
    } else {
      dto.Delinquent = false
    }

    dto.TaxesAndFees = aPolicyPeriod.TotalCostRPT_amt - aPolicyPeriod.TotalPremiumRPT_amt
    if(!aPolicyPeriod.Policy.Account.AEPContractAccount_ACC) {
      dto.ACCPolicySuffix = aPolicyPeriod.ACCPolicyID_ACC.substring(aPolicyPeriod.ACCPolicyID_ACC.length - 1)
    }

    dto.ActiveTerm = aPolicyPeriod.PolicyTerm.ActiveTerm_ACC
    if (aPolicyPeriod.IsAEPMasterPolicy_ACC and aPolicyPeriod.AltBillingAccountNumber != null) {
      var altBillingAccount = Account.finder.findAccountByAccountNumber(aPolicyPeriod.AltBillingAccountNumber)
      dto.AEPPrimeAccountACCID_ACC = altBillingAccount?.ACCID_ACC
    }
    return dto
  }

  override function toDTOArray(policies: Policy[], checkDelinquency: boolean): PolicySummaryDTO[] {
    if (policies != null && policies.HasElements) {
      return policies.orderByDescending(\p -> p.LatestPeriod.LevyYear_ACC).thenBy(\p -> p.LatestPeriod.ACCPolicyID_ACC).map(\aPolicy -> toDTO(aPolicy.LatestPeriod, checkDelinquency)).toTypedArray()
    }

    return null
  }


}