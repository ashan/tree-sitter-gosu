package edge.capabilities.quote.streamlined

uses edge.capabilities.quote.draft.account.IDraftAccountPlugin
uses java.util.Date

uses edge.capabilities.quote.draft.util.SubmissionUtil
uses gw.api.productmodel.QuestionSet
uses edge.capabilities.quote.questionset.util.QuestionSetUtil
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses edge.util.helper.JurisdictionUtil
uses edge.exception.DtoValidationException
uses edge.capabilities.policycommon.availability.IProductAvailabilityPlugin
uses edge.capabilities.quote.draft.dto.DraftDataDTO
uses edge.capabilities.quote.lob.ILobDraftPlugin
uses edge.capabilities.quote.lob.dto.DraftLobDataDTO
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.address.IAddressCompletionPlugin
uses edge.capabilities.quote.streamlined.dto.StreamlinedQuoteDTO
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO
uses edge.capabilities.quote.quoting.IQuotePlugin
uses edge.capabilities.quote.lob.personalauto.draft.dto.VehicleDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.quote.lob.personalauto.draft.dto.DriverDTO
uses edge.capabilities.quote.person.util.PersonUtil
uses gw.api.util.JurisdictionMappingUtil
uses edge.capabilities.quote.lob.personalauto.draft.dto.PaDraftDataExtensionDTO
uses edge.time.LocalDateUtil
uses edge.PlatformSupport.Bundle

/*
 * Default implementation of streamlined submission plugin.
 */

class DefaultStreamlinedSubmissionPlugin implements IStreamlinedSubmissionPlugin {
  private var _accountPlugin : IDraftAccountPlugin
  private var _availabilityPlugin : IProductAvailabilityPlugin
  private var _lobPlugin : ILobDraftPlugin <DraftLobDataDTO>
  private var _addressPlugin : IAddressPlugin
  private var _addressCompletion : IAddressCompletionPlugin
  private var _quotingPlugin : IQuotePlugin
  @ForAllGwNodes
  @Param("accountPlugin", "Plugin used to deal with accounts")
  @Param("availabilityPlugin", "Plugin used to ensure product availability")
  @Param("lobPlugin", "Line-of-business management plugin")
  @Param("addressPlugin", "Address manipulation plugin")
  @Param("addressCompletion", "Plugin used for the addresses completion")
  @Param("draftPlugin", "Plugin used to create the submission after data is gathered and prefilled")
  @Param("quotePlugin", "Plugin used to quote the submission after data is gathered and prefilled")
  construct(
      accountPlugin : IDraftAccountPlugin,
      availabilityPlugin : IProductAvailabilityPlugin,
      lobPlugin : ILobDraftPlugin <DraftLobDataDTO>,
      addressPlugin : IAddressPlugin,
      addressCompletion : IAddressCompletionPlugin,
      quotePlugin : IQuotePlugin) {
    this._accountPlugin = accountPlugin
    this._availabilityPlugin = availabilityPlugin
    this._lobPlugin = lobPlugin
    this._addressPlugin = addressPlugin
    this._addressCompletion = addressCompletion
    this._quotingPlugin = quotePlugin
  }

  override function createSubmission(data : StreamlinedQuoteDTO) : Submission {
    if (data.ProductCode == null) {
      throw new IllegalArgumentException("Ineligible online product")
    }

    if (data.PolicyAddress == null) {
      throw new DtoValidationException() { :Message="Policy address required for initial submission" }
    }

    validateAddress(data.PolicyAddress)

    var anAccount : Account
    var aSubmission : Submission

    if (data.SubmissionNumber != null && data.SubmissionNumber.HasContent) {
      var bundle = Bundle.getCurrent()
      aSubmission = bundle.add(gw.api.database.Query.make(Submission).compare("JobNumber", Equals, data.SubmissionNumber).select().AtMostOneRow)
      aSubmission.LatestPeriod.SubmissionProcess.edit()
      anAccount = bundle.add(aSubmission.Policy.Account)
      _accountPlugin.updateOrCreateNewQuoteAccount(anAccount, data.ProductCode, createStreamlinedAccountInfo(data), data.PolicyAddress)
    } else {
      //need to run in new transaction to resolve PublicIDs for account
      anAccount = Bundle.resolveInTransaction( \ bundle ->
          _accountPlugin.updateOrCreateNewQuoteAccount(null, data.ProductCode, createStreamlinedAccountInfo(data), data.PolicyAddress)
      )

      ensureProductAvailable(anAccount, data)
      aSubmission = SubmissionUtil.newSubmission(anAccount, data.ProductCode, Date.Today, data.PolicyAddress, data.TermType, _addressPlugin)
    }

    aSubmission.ActivePeriods.each(\period -> period.syncQuestions(draftQuestions(aSubmission)))

    data.Lobs = new DraftLobDataDTO()
    data.Lobs.PersonalAuto = new PaDraftDataExtensionDTO()
    data.Lobs.PersonalAuto.Drivers = new DriverDTO[]{createStreamlinedDriver(aSubmission.Policy.Account.AccountHolderContact as Person)}
    data.Lobs.PersonalAuto.Drivers.first().PublicID = aSubmission.LatestPeriod.PersonalAutoLine.PolicyDrivers.first()?.PublicID // If updating an existing streamline driver
    data.Lobs.PersonalAuto.Vehicles = new VehicleDTO[]{createStreamlinedVehicle(data)}

    _lobPlugin.updateNewDraftSubmission(aSubmission.SelectedVersion, data.Lobs)

    return aSubmission
  }



  /**
   * Used to prefill data required to create an account that is not present in the StreamlinedQuoteDTO (firstName, lastName).
  */
  override function createStreamlinedAccountInfo(data : StreamlinedQuoteDTO) : AccountContactDTO{
    return new AccountContactDTO(){
      :FirstName = "0streamlinedquote0",
      :LastName = "0streamlinedquote0",
      :DateOfBirth = LocalDateUtil.toDTO(Date.Today.addYears(-data.Age)),
      :EmailAddress1 = data.Email,
      :Subtype = "Person"
    }
  }

  override function createStreamlinedVehicle(data: StreamlinedQuoteDTO) : VehicleDTO{
    return new VehicleDTO(){
      :Make = data.Make,
      :Model = data.Model,
      :Year = data.Year,
      :Vin = data.Vin != null ? data.Vin : "0streamlinedquote0",
      :CostNew = new AmountDTO(){:Amount = 9000},
      :LicenseState = data.PolicyAddress.State,
      :License = "0streamlinedquote0"
    }
  }

  override  function createStreamlinedDriver(accountHolder : Person) : DriverDTO{
    return new DriverDTO(){
      :Person = PersonUtil.toDTO(accountHolder),
      :YearLicensed = Date.Now.YearOfDate,
      :Violations = typekey.NumberOfAccidents.TC_0,
      :Accidents = typekey.NumberOfAccidents.TC_0,
      :LicenseState = JurisdictionMappingUtil.getJurisdiction(accountHolder.PrimaryAddress),
      :LicenseNumber = "0streamlinedquote0",
      :DateOfBirth = LocalDateUtil.toDTO(accountHolder.DateOfBirth),
      :Gender = GenderType.TC_F,
      :isPolicyHolder = true
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

  protected function selectProducerCode(account:Account, productCode : String):ProducerCode {
    return account.ProducerCodes.first().ProducerCode
  }



  protected function selectUWCompany(branch:PolicyPeriod) {
    var uwCompanies = branch.getUWCompaniesForStates(false)
    branch.UWCompany = uwCompanies.first()
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
  private function ensureProductAvailable(account : Account, data : StreamlinedQuoteDTO) {
    if (!_availabilityPlugin.isProductAvailable(data.ProductCode, Date.Today, data.PolicyAddress).isImmediatelyAvailable()) {
      throw new IllegalArgumentException("Quote request is incompatible with the existing quote, product is not available at the given date.")
    }
  }

}
