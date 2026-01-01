package edge.capabilities.gpa.account

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.capabilities.gpa.contact.IContactPlugin
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses edge.capabilities.gpa.policy.IPolicySummaryPlugin
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses java.util.Date
uses edge.capabilities.gpa.billing.IAccountBillingSummaryPlugin
uses edge.capabilities.gpa.contact.dto.ContactBaseDTO
uses java.lang.Exception
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.user.local.IProducerCodePlugin
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.exception.EntityNotFoundException
uses gw.pl.currency.MonetaryAmount
uses gw.product.ProducerCodeSearchCriteria
uses edge.capabilities.policycommon.accountcontact.IAccountContactPlugin

class DefaultAccountPlugin implements IAccountPlugin {
  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultAccountPlugin))
  private var _contactPlugin: IContactPlugin
  private var _policySummaryPlugin: IPolicySummaryPlugin
  private var _billingSummaryPlugin: IAccountBillingSummaryPlugin
  private var _claimSummaryPlugin: IClaimSummaryPlugin
  private var _producerCodePlugin: IProducerCodePlugin
  private var _accContactPlugin : IAccountContactPlugin
  private var _currencyPlugin : ICurrencyPlugin
  private var _jobHelper: JobUtil

  @ForAllGwNodes
  construct(aContactPlugin: IContactPlugin, accContactPlugin : IAccountContactPlugin, aPolicySummaryPlugin: IPolicySummaryPlugin, aBillingSummaryPlugin: IAccountBillingSummaryPlugin, aProducerCodePlugin: IProducerCodePlugin, aClaimSummaryPlugin: IClaimSummaryPlugin,aCurrencyPlugin: ICurrencyPlugin, aJobHelper: JobUtil) {
    this._contactPlugin = aContactPlugin
    this._accContactPlugin = accContactPlugin
    this._policySummaryPlugin = aPolicySummaryPlugin
    this._billingSummaryPlugin = aBillingSummaryPlugin
    this._claimSummaryPlugin = aClaimSummaryPlugin
    this._producerCodePlugin = aProducerCodePlugin
    this._currencyPlugin = aCurrencyPlugin

    this._jobHelper = aJobHelper
  }

  override function toDTO(anAccount: Account): AccountDTO {
    final var dto = accountBaseDetailsToDTO(anAccount)

    try {
      dto.NumberOfOpenActivities = anAccount.AllOpenActivities.where(\anActivity -> perm.Activity.view(anActivity)).Count
    } catch (e: Exception) {
      dto.NumberOfOpenActivities = 0
    }
    dto.NumberOfNotes = anAccount.Notes.where(\aNote -> perm.Note.view(aNote)).Count
    try {
      dto.NumberOfDocuments = anAccount.Documents.where(\aDocument -> perm.Document.view(aDocument)).Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }

    final var accountJobs = getAccountJobs(anAccount, false)
    dto.NumberOfWorkOrders = accountJobs.Count

    dto.NumberOfOpenQuotes = accountJobs
        .whereTypeIs(Submission).Count

    dto.NumberOfOpenPolicyCancellations = accountJobs
        .whereTypeIs(Cancellation).Count

    dto.NumberOfOpenPolicyChanges = accountJobs
        .whereTypeIs(PolicyChange).Count

    dto.NumberOfOpenPolicyRenewals = accountJobs
        .whereTypeIs(Renewal).Count

    dto.TotalPremium = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(calculateTotalPremium(anAccount)))


    try {
      dto.NumberOfOpenClaims = _claimSummaryPlugin.getAccountClaims(anAccount).Count
    } catch (e: EntityNotFoundException) {
      dto.NumberOfOpenClaims = 0
    } catch (e: Exception) {
      LOGGER.logError(e)

      // Do not mislead users into thinking there are no claims if actually an error happened
      dto.NumberOfOpenClaims = null
    }


    try {
      dto.AccountBillingSummary = _billingSummaryPlugin.getAccountBillingSummary(anAccount)
    } catch (e: Exception) {
      LOGGER.logError(e)
    }

    return dto
  }

  override function accountBaseDetailsToDTO(anAccount: Account): AccountDTO {
    if (anAccount == null){
      return null
    }
    final var dto = new AccountDTO()
    dto.PublicID = anAccount.PublicID
    dto.AccountNumber = anAccount.AccountNumber
    dto.StatusDisplayName = anAccount.AccountStatus.DisplayName
    dto.AccountCreatedDate = anAccount.CreateTime
    dto.CanUserView = perm.Account.view(anAccount)
    if (anAccount.AccountHolderContact != null) {
          dto.AccountHolder = _accContactPlugin.toDTO(anAccount.AccountHolderContact)
    }

    dto.ProducerCodes = _producerCodePlugin.toDTOArray(anAccount.ProducerCodes*.ProducerCode)
    var policies = anAccount.Policies.where(\aPolicy -> (aPolicy.LatestPeriod.Status == PolicyPeriodStatus.TC_BOUND || aPolicy.LatestPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE) && perm.PolicyPeriod.view(aPolicy.LatestPeriod))
    dto.PolicySummaries = _policySummaryPlugin.toDTOArray(policies.sortByDescending(\aPolicy -> aPolicy.CreateTime), false)
    dto.CanUserCreateSubmission = perm.Account.newSubmission(anAccount) and !anAccount.Frozen and anAccount.AccountStatus != AccountStatus.TC_WITHDRAWN

    return dto
  }

  override function accountBaseDetailsToDTOArray(accounts: Account[]): AccountDTO[] {
    if (accounts != null && !accounts.IsEmpty){
      return accounts.map(\acc -> accountBaseDetailsToDTO(acc))
    }
    return new AccountDTO[]{}
  }

  override function toDTOArray(accounts: Account[]): AccountDTO[] {
    if (accounts != null && !accounts.IsEmpty){
      return accounts.map(\acc -> toDTO(acc))
    }
    return new AccountDTO[]{}
  }

  override function updateAccount(anAccount: Account, dto: AccountDTO) {
    var accountHolder: ContactBaseDTO = null
    if (dto.AccountHolder != null) {
      _accContactPlugin.updateContact(anAccount.AccountHolderContact, dto.AccountHolder)
    }
  }

  override function createAccount(dto: AccountDTO): Account {
    var accountHolder: Contact
    if (dto.AccountHolder.Subtype.equals("Person")) {
      accountHolder = new Person()
      _accContactPlugin.updateContact(accountHolder, dto.AccountHolder)
    } else if (dto.AccountHolder.Subtype.equals("Company")){
      accountHolder = new Company()
      _accContactPlugin.updateContact(accountHolder, dto.AccountHolder)
    } else {
      throw new IllegalArgumentException("Account Holder must be of type Person or Company.")
    }

    var account = entity.Account.createAccountForContact(accountHolder)
    account.OriginationDate = Date.Today

    final var user : User = User.util.CurrentUser
    if (dto.ProducerCodes != null && dto.ProducerCodes.Count > 0) {
      account.addToProducerCodes(retrieveProducerCode(dto.ProducerCodes.first().Code))

    } else if (user.UserProducerCodes*.ProducerCode.Count > 0) {
      account.addToProducerCodes(retrieveProducerCode(user.UserProducerCodes*.ProducerCode.first().Code))
    }
    account.updateAccountHolderContact()

    return account
  }

  /**
   * Returns the AccountProducerCode entity to be used for new accounts
   */
  protected function retrieveProducerCode(producerCode: String): AccountProducerCode {
    var producerCodeCriteria = new ProducerCodeSearchCriteria(User.util.CurrentUser.getOrganization())
    producerCodeCriteria.Code = producerCode

    var producerCodeResult = producerCodeCriteria.performSearch().FirstResult
    var accountProducerCode = new AccountProducerCode()
    accountProducerCode.ProducerCode = producerCodeResult

    return accountProducerCode
  }

  protected function getAccountJobs(anAccount: Account, complete: boolean): Job[] {
    try {
      return _jobHelper.findJobsByAccount(anAccount, complete, null, User.util.CurrentUser)
    } catch (e: EntityNotFoundException) {
      return new Job[]{}
    }
  }

  protected function calculateTotalPremium(anAccount: Account) : MonetaryAmount {

    var latestBoundPeriods = anAccount.Policies.where( \ elt -> elt.Issued == true && elt.LatestPeriod.CancellationDate == null
                                                                 && elt.LatestPeriod.PeriodEnd.after(Date.Today))*.LatestPeriod

    var totalPremiums = latestBoundPeriods*.TotalPremiumRPT.where( \ premium -> premium != null )
    return totalPremiums.sum()
  }
}
