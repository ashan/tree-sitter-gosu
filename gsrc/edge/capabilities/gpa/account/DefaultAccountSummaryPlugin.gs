package edge.capabilities.gpa.account

uses edge.capabilities.gpa.account.dto.AccountSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.billing.IAccountBillingSummaryPlugin
uses java.lang.Exception
uses edge.capabilities.gpa.policy.IPolicySummaryPlugin
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.job.IJobSummaryPlugin

class DefaultAccountSummaryPlugin implements IAccountSummaryPlugin {

  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultAccountSummaryPlugin))

  private var _addressPlugin : IAddressPlugin
  private var _policySummaryPlugin : IPolicySummaryPlugin
  private var _billingSummaryPlugin : IAccountBillingSummaryPlugin
  private var _jobPlugin : IJobSummaryPlugin

  @ForAllGwNodes
  construct(anAddressPlugin : IAddressPlugin, aPolicySummaryPlugin : IPolicySummaryPlugin, aBillingSummaryPlugin : IAccountBillingSummaryPlugin,
            aJobPlugin : IJobSummaryPlugin){
    this._addressPlugin = anAddressPlugin
    this._policySummaryPlugin = aPolicySummaryPlugin
    this._billingSummaryPlugin = aBillingSummaryPlugin
    this._jobPlugin = aJobPlugin
  }

  override function toDTO(anAccount: Account): AccountSummaryDTO {
    final var dto = new AccountSummaryDTO()
    if(anAccount == null){
      return dto
    }

    dto.AccountNumber = anAccount.AccountNumber
    dto.AccountCreatedDate = anAccount.CreateTime
    dto.CreatedByMe = anAccount.CreateUser == User.util.CurrentUser
    if (anAccount.AccountHolderContact != null) {
      dto.AccountHolder = anAccount.AccountHolderContact.DisplayName
      dto.AccountHolderAddress = _addressPlugin.toDto(anAccount.AccountHolderContact.PrimaryAddress)
      dto.IsCommercialAccount = anAccount.AccountHolderContact typeis Company
      dto.IsPersonalAccount = !dto.IsCommercialAccount
    }

    dto.ProducerCodes = anAccount.ProducerCodes.map(\ aProducerCode -> aProducerCode.toString())
    var policies = anAccount.Policies.where( \ aPolicy -> aPolicy.Issued && perm.PolicyPeriod.view(aPolicy.LatestPeriod))
    dto.PolicySummaries = _policySummaryPlugin.toDTOArray(policies.sortByDescending(\aPolicy -> aPolicy.CreateTime), false)
    dto.NumberOfOpenActivities = anAccount.AllOpenActivities.where( \ anActivity -> perm.Activity.view(anActivity)).Count

    return dto
  }

  override function toDTOArray(accounts: Account[]): AccountSummaryDTO[] {
    if(accounts != null && !accounts.IsEmpty){
      return accounts.map( \ acc -> toDTO(acc))
    }
    return new AccountSummaryDTO[]{}
  }
}
