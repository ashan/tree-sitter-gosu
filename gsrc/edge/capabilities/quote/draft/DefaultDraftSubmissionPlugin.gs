package edge.capabilities.quote.draft
uses edge.capabilities.quote.draft.account.IDraftAccountPlugin
uses java.util.Date
uses edge.capabilities.quote.draft.dto.TrackingCodeDTO
uses gw.api.productmodel.QuestionSet
uses edge.capabilities.quote.questionset.util.QuestionSetUtil
uses edge.util.MapUtil
uses java.util.Arrays
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses edge.exception.DtoValidationException
uses edge.capabilities.policycommon.availability.IProductAvailabilityPlugin
uses edge.capabilities.quote.draft.dto.DraftDataDTO
uses edge.capabilities.quote.lob.ILobDraftPlugin
uses edge.capabilities.quote.lob.dto.DraftLobDataDTO
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.address.IAddressCompletionPlugin
uses edge.capabilities.quote.draft.util.SubmissionUtil
uses edge.PlatformSupport.Bundle
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.exception.EntityPermissionException
uses edge.time.LocalDateUtil

/*
 * Default implementation of draft submission plugin.
 */
/*
 * Aspect checklist (each method should be aware of these, should match Draft DTO):
 * <ul>
 *   <li>Account
 *   <li>Policy address (could be different from account address)
 *   <li>Period start date
 *   <li>Question sets
 *   <li>LOB extension points
 * </ul>
 *
 */
class DefaultDraftSubmissionPlugin implements IDraftSubmissionPlugin {
  /**
   * Account management plugin.
   */
  private var _accountPlugin : IDraftAccountPlugin
  private var _availabilityPlugin : IProductAvailabilityPlugin
  private var _lobPlugin : ILobDraftPlugin <DraftLobDataDTO>
  private var _addressPlugin : IAddressPlugin
  private var _addressCompletion : IAddressCompletionPlugin
  private var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  @Param("accountPlugin", "Plugin used to deal with accounts")
  @Param("availabilityPlugin", "Plugin used to ensure product availability")
  @Param("lobPlugin", "Line-of-business management plugin")
  @Param("addressPlugin", "Address manipulation plugin")
  @Param("addressCompletion", "Plugin used for the addresses completion")
  @Param("aUserProvider", "Plugin used for the providing users")
  construct(
      accountPlugin : IDraftAccountPlugin, 
      availabilityPlugin : IProductAvailabilityPlugin,
      lobPlugin : ILobDraftPlugin <DraftLobDataDTO>,
      addressPlugin : IAddressPlugin,
      addressCompletion : IAddressCompletionPlugin,
      aUserProvider:EffectiveUserProvider) {
    this._accountPlugin = accountPlugin
    this._availabilityPlugin = availabilityPlugin
    this._lobPlugin = lobPlugin
    this._addressPlugin = addressPlugin
    this._addressCompletion = addressCompletion
    this._userProvider = aUserProvider
  }

  override function createSubmission(productCode : String, data : DraftDataDTO) : Submission {
    if (data.ProductCode == null) {
      throw new IllegalArgumentException("Ineligible online product")
    }
    
    if (data.AccountHolder == null) {
      throw new DtoValidationException() { :Message="Account required for initial submission" }
    }

    if (data.PolicyAddress == null) {
      throw new DtoValidationException() { :Message="Policy address required for initial submission" }
    }

    validateAddress(data.PolicyAddress)

    var existingAccount : Account = null;

    // If an account number was provided with the submission then the submission will be created using
    // the existing account for that account number
    if (data.AccountNumber != null) {
      var bundle = Bundle.getCurrent()

      // If there are further authorization checks to be done on a new submission then it would
      // be recommended to provide an authenticated endpoint in the handler rather than making the checks
      // in the plugin as is done here
      if (this._userProvider.EffectiveUser?.hasAuthority(AuthorityType.ACCOUNT, data.AccountNumber)) {
        existingAccount = bundle.add(Account.finder.findAccountByAccountNumber(data.AccountNumber))
      } else {
        throw new EntityPermissionException() { :Message="Not authorized to access this account" }
      }
    }

    final var account = _accountPlugin.updateOrCreateNewQuoteAccount(existingAccount, productCode, data.AccountHolder, data.PolicyAddress)
    ensureProductAvailable(account, data)

    final var aSubmission = SubmissionUtil.newSubmission(account, productCode, LocalDateUtil.toMidnightDate(data.PeriodStartDate), data.PolicyAddress, data.TermType, _addressPlugin)
    aSubmission.ActivePeriods.each(\period -> period.syncQuestions(draftQuestions(aSubmission)))
    _lobPlugin.updateNewDraftSubmission(aSubmission.SelectedVersion, data.Lobs)
    aSubmission.SelectedVersion.TrackingCode = fromCampaignCodeDto(data.TrackingCode)
    return aSubmission
  }



  override function updateSubmission(submission : Submission, data : DraftDataDTO) {
    if (submission.Policy.ProductCode != data.ProductCode) {
      throw new IllegalArgumentException("Quote request is incompatible with the existing quote")
    }

    validateAddress(data.PolicyAddress)

    //For product avaibility check
    final var postCodeChanged = data.PolicyAddress.PostalCode != submission.SelectedVersion.PolicyAddress.Address.PostalCode
    //For address change persistence
    final var addressChanged = _addressPlugin.doAddressesDiffer(data.PolicyAddress, _addressPlugin.toDto(submission.SelectedVersion.PolicyAddress.Address))

    if (submission.SelectedVersion.PeriodStart.trimToMidnight() != LocalDateUtil.toMidnightDate(data.PeriodStartDate) || postCodeChanged) {
      ensureProductAvailable(submission.Policy.Account, data)
    }

    _accountPlugin.updateQuoteAccount(submission.Policy.Account, data.AccountHolder)
    if (addressChanged) {
      _addressPlugin.updateFromDTO(submission.SelectedVersion.PolicyAddress.Address, data.PolicyAddress)
    }

    final var qsAnswers = MapUtil.groupUnique(Arrays.asList(data.PreQualQuestionSets), \ i -> i.Code, \ i -> i)

    if (submission.SelectedVersion.PeriodStart.trimToMidnight() != LocalDateUtil.toMidnightDate(data.PeriodStartDate)){

       updatePeriodDates(submission, LocalDateUtil.toMidnightDate(data.PeriodStartDate))
    }

    QuestionSetUtil.update(submission.SelectedVersion, draftQuestions(submission), qsAnswers)
    
    _lobPlugin.updateExistingDraftSubmission(submission.SelectedVersion, data.Lobs)
  }

  /**
   *  Method to update the period dates once effective date is changed
   *  See also gw.pcf.job.PolicyInfoHelper.setPeriodDates
  */
  protected function updatePeriodDates(submission : Submission, effectiveDate: Date){

    var policyPeriod = submission.SelectedVersion
    var termType = submission.Policy.Product.DefaultTermType

    if (submission != null and !policyPeriod.HasWorkersComp) {
      policyPeriod.SubmissionProcess.beforePeriodStartChanged(effectiveDate)
    }
    if (termType == TermType.TC_OTHER) {
      policyPeriod.PeriodStart = effectiveDate
    } else {
      var expirationDate = PeriodEndUtil.calculatePeriodEnd(effectiveDate, termType, policyPeriod)
      policyPeriod.setPeriodWindow( effectiveDate, expirationDate )
    }
  }

  override function toDTO(period : PolicyPeriod) : DraftDataDTO {
    final var res = new DraftDataDTO()
    final var submission = period.Submission
    res.AccountHolder = _accountPlugin.toDto(submission.Policy.Account)
    res.PolicyAddress = _addressPlugin.toDto(period.PolicyAddress.Address)
    res.PeriodStartDate = LocalDateUtil.toDTO(period.PeriodStart)
    res.PeriodEndDate = LocalDateUtil.toDTO(period.PeriodEnd)
    res.ProductCode = submission.Policy.Product.CodeIdentifier
    res.ProductName = submission.Policy.Product.DisplayName
    res.AccountNumber = submission.Policy.Account.AccountNumber
    res.TermType = period.TermType

    res.PreQualQuestionSets = draftQuestions(submission)
      .map(\q -> QuestionSetUtil.toAnswersDTO(q, period))
    res.Lobs = _lobPlugin.toDraftDTO(period)
    return res
  }



  /**
   * Calculates all policy-level questions.
   */
  protected function draftQuestions(sub : Submission) : QuestionSet[] {
    return {}
  }

  /**
   * Validates address and ensures it is consistent.
   */
  protected function validateAddress(dto : AddressDTO) {
    final var addressDTO = _addressCompletion.getAddressFromZipCode(dto.PostalCode)
    if (!matchAddresses(addressDTO, dto)) {
      throw new IllegalArgumentException("Attempt to perform incompatible address change")
    }
  }


  /**
   * Checks address compatibility between request and response. Do not allow to make
   * "definitely-incorrect" input.
   */
  protected function matchAddresses(addr: AddressDTO, dto: AddressDTO): boolean {
    if (addr.PostalCode != null && addr.PostalCode != dto.PostalCode) {
      return false
    }
    if (addr.Country != null && addr.Country != dto.Country) {
      return false
    }
    if (addr.State != null && addr.State != dto.State) {
      return false
    }
    if (addr.City != null && !addr.City.trim().equalsIgnoreCase(dto.City.trim())) {
      return false
    }

    return true
  }


  /**
   * Ensures that product is available at given date to a given account.
   */
  private function ensureProductAvailable(account : Account, data : DraftDataDTO) {
    if (!_availabilityPlugin.isProductAvailable(data.ProductCode, LocalDateUtil.toMidnightDate(data.PeriodStartDate), data.PolicyAddress).isImmediatelyAvailable()) {
      throw new IllegalArgumentException("Quote request is incompatible with the existing quote, product is not available at the given date.")
    }
  }

  /**
  * Provides external campaign's details for tracking purposes
  */
  private function fromCampaignCodeDto(dto: TrackingCodeDTO[]): entity.TrackingCode_Ext[] {
    return (dto != null)
        ? dto.map(\data -> new TrackingCode_Ext(){:Name = data.CodeName, :Value = data.CodeValue})
        : {}
  }
}
