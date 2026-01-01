package edge.capabilities.gpa.account


uses edge.capabilities.gpa.account.dto.AccountJobsSummaryDTO
uses edge.aspects.validation.annotations.Context
uses edge.el.Expr
uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.capabilities.gpa.account.search.dto.AccountSearchCriteriaDTO
uses edge.capabilities.gpa.account.search.IAccountSearchPlugin
uses edge.capabilities.gpa.job.submission.dto.ProductSelectionDTO
uses edge.capabilities.gpa.job.submission.dto.NewSubmissionDTO
uses edge.capabilities.gpa.job.submission.ISubmissionPlugin
uses edge.capabilities.gpa.note.dto.NoteDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.capabilities.gpa.billing.dto.BillingInvoiceDTO
uses edge.capabilities.gpa.billing.IBillingInvoicePlugin
uses edge.capabilities.gpa.billing.IPolicyPeriodBillingSummaryPlugin
uses edge.capabilities.gpa.billing.dto.PolicyPeriodBillingSummaryDTO

uses java.lang.Exception

uses edge.security.permission.IPermissionCheckPlugin

uses java.lang.SecurityException

uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.capabilities.gpa.claim.dto.ClaimSummaryDTO
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses edge.exception.EntityNotFoundException
uses edge.capabilities.helpers.ProducerCodeUtil
uses edge.capabilities.gpa.account.dto.AccountSummaryDTO
uses edge.capabilities.gpa.account.dto.AccountJobsDTO

uses java.lang.Integer

uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses edge.capabilities.gpa.billing.IAccountBillingPlugin
uses edge.capabilities.gpa.billing.dto.AccountBillingDTO
uses edge.capabilities.gpa.account.search.dto.AccountSearchSummaryDTO
uses gw.api.database.Query
uses edge.PlatformSupport.Bundle
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO
uses edge.aspects.validation.annotations.Context
uses edge.el.Expr

/**
 * Handles the RPC request to do with a Account
 */

@Context("ProducerCodeRequired", Expr.const(true))
class AccountHandler implements IRpcHandler {

  private static var LOGGER = new Logger(Reflection.getRelativeName(AccountHandler))

  private var _jobHelper : JobUtil
  private var _producerCodeHelper : ProducerCodeUtil
  private var _accountPlugin : IAccountPlugin
  private var _accountSearchPlugin : IAccountSearchPlugin
  private var _submissionPlugin : ISubmissionPlugin
  private var _notePlugin : INotePlugin
  private var _jobPlugin : IJobPlugin
  private var _documentPlugin : IDocumentPlugin
  private var _billingInvoicePlugin : IBillingInvoicePlugin
  private var _billedPolicyPlugin : IPolicyPeriodBillingSummaryPlugin
  private var _permissionCheckPlugin : IPermissionCheckPlugin
  private var _claimSummaryPlugin : IClaimSummaryPlugin
  private var _accountSummaryPlugin : IAccountSummaryPlugin
  private var _accountJobsPlugin : IAccountJobsPlugin
  private var _jobSummaryPlugin : IJobSummaryPlugin
  private var _accountBillingPlugin : IAccountBillingPlugin
  private var _accountViewHistoryPlugin : IAccountViewHistoryPlugin
  private var _accountRetrievalPlugin : IAccountRetrievalPlugin


  @InjectableNode
  @Param("accountPlugin", "plugin used to access account data")
  construct(accountPlugin : IAccountPlugin, accountSearchPlugin : IAccountSearchPlugin,
            submissionPlugin : ISubmissionPlugin, notePlugin : INotePlugin, aJobPlugin : IJobPlugin,
            aDocumentPlugin : IDocumentPlugin, aBillingInvoicePlugin : IBillingInvoicePlugin,
            aBilledPolicyPlugin : IPolicyPeriodBillingSummaryPlugin, aPermissionCheckPlugin : IPermissionCheckPlugin,
            aClaimSummaryPlugin : IClaimSummaryPlugin, anAccountSummaryPlugin : IAccountSummaryPlugin, anAccountJobsPlugin : IAccountJobsPlugin,
            aJobSummaryPlugin : IJobSummaryPlugin, anAccountBillingPlugin : IAccountBillingPlugin, aJobHelper : JobUtil, aProducerCodeHelper : ProducerCodeUtil,
            anAccountViewHistoryPlugin : IAccountViewHistoryPlugin, anAccountRetrievalPlugin : IAccountRetrievalPlugin) {
    this._accountPlugin = accountPlugin
    this._accountSearchPlugin = accountSearchPlugin
    this._submissionPlugin = submissionPlugin
    this._notePlugin = notePlugin
    this._jobPlugin = aJobPlugin
    this._documentPlugin = aDocumentPlugin
    this._billingInvoicePlugin = aBillingInvoicePlugin
    this._billedPolicyPlugin = aBilledPolicyPlugin
    this._permissionCheckPlugin = aPermissionCheckPlugin
    this._claimSummaryPlugin = aClaimSummaryPlugin
    this._accountSummaryPlugin = anAccountSummaryPlugin
    this._accountJobsPlugin = anAccountJobsPlugin
    this._jobSummaryPlugin = aJobSummaryPlugin
    this._accountBillingPlugin = anAccountBillingPlugin
    this._jobHelper = aJobHelper
    this._producerCodeHelper = aProducerCodeHelper
    this._accountViewHistoryPlugin = anAccountViewHistoryPlugin
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
  }


  /**
   * Returns or creates and returns the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountPlugin#createAccount(edge.capabilities.gpa.account.dto.AccountDTO)</code> - If account number doesn't exist, create an account using the provided DTO</dd>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To get the given account</dd>
   * <dd> <code>IAccountPlugin#toDTO(entity.Account)</code> - To map the new or existing Account to a DTO</dd>
   * </dl>
   *
   * @param anAccountDTO the account number for the given account
   * @returns an AccountDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getOrCreateAccount(anAccountDTO : AccountDTO) : AccountDTO {
    if (anAccountDTO.AccountNumber == null) {
      final var newAccount = _accountPlugin.createAccount(anAccountDTO)
      return _accountPlugin.accountBaseDetailsToDTO(newAccount)
    }

    final var account = _accountRetrievalPlugin.getAccountByNumber(anAccountDTO.AccountNumber)

    return _accountPlugin.accountBaseDetailsToDTO(account)
  }

  /**
   * Returns the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To get the given Account</dd>
   * <dd> <code>IAccountPlugin#toDTO(entity.Account)</code> - To map the new or existing Account to a DTO</dd>
   * </dl>
   *
   * @param accountNumber the account number for the given account
   * @returns an AccountDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountDetails(accountNumber : String) : AccountDTO {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
    return _accountPlugin.toDTO(account)
  }


  /**
   * Updates address and contact details for an Account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To get the given Account</dd>
   * <dd> <code>IAccountPlugin#updateAccount(entity.Account, edge.capabilities.gpa.account.dto.AccountDTO)</code> -  To map the information from the DTO to the Account</dd>
   * <dd> <code>IAccountPlugin#toDTO(entity.Account)</code> - To map the new or existing account to a DTO</dd>
   * </dl>
   *
   * @param anAccountDTO the updated account
   * @returns an AccountDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function updateAccountDetails(anAccountDTO : AccountDTO) : AccountDTO {
    if (!_permissionCheckPlugin.hasSystemPermission(SystemPermissionType.TC_EDITACCOUNTSUMMARY)) {
      throw new SecurityException("User does not have permission to edit account details")
    }

    try {
      Bundle.transaction(\bundle -> {
        var account = bundle.add(_accountRetrievalPlugin.getAccountByNumber(anAccountDTO.AccountNumber))

        _accountPlugin.updateAccount(account, anAccountDTO)
      })
    } catch (ex : Exception) {
      LOGGER.logError(ex.LocalizedMessage)
    }

    final var account = _accountRetrievalPlugin.getAccountByNumber(anAccountDTO.AccountNumber)
    return _accountPlugin.toDTO(account)
  }

  /**
   * Returns a list of potentially existing accounts
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#createSearchCriteria(edge.capabilities.gpa.account.search.dto.AccountSearchCriteriaDTO)</code> - To create a search criteria object</dd>
   * <dd> <code>IAccountPlugin#updateAccount(entity.Account, edge.capabilities.gpa.account.dto.AccountDTO)</code> -  To map the information from the DTO to the Account</dd>
   * </dl>
   *
   * @param accountSearchCriteriaDTO the search criteria to be used to get potentially existing accounts
   * @returns AccountDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPotentialExistingAccounts(accountSearchCriteriaDTO : AccountSearchCriteriaDTO) : AccountDTO[] {
    var anAccountSearchCriteria = _accountSearchPlugin.createSearchCriteria(accountSearchCriteriaDTO)

    if (accountSearchCriteriaDTO.ContactType == ContactType.TC_COMPANY) {
      /*If company name is greater than 5 characters then do an exact match*/
      anAccountSearchCriteria.CompanyNameExact = (anAccountSearchCriteria.CompanyName.length < 5)
    } else if (accountSearchCriteriaDTO.ContactType == ContactType.TC_PERSON) {
      anAccountSearchCriteria.LastNameExact = (anAccountSearchCriteria.LastName.length < 5)
      anAccountSearchCriteria.FirstNameExact = (anAccountSearchCriteria.FirstName.length < 5)
    }

    final var potentialAccounts = anAccountSearchCriteria.performSearch()*.Account

    return _accountPlugin.toDTOArray(potentialAccounts)
  }


  /**
   * Returns the products available to the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>ISubmissionPlugin#getAvailableProducts(Account, NewSubmissionDTO)</code> -  To return the available products for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns ProductSelectionDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAvailableProductsForAccount(newSubmissionDTO : NewSubmissionDTO) : ProductSelectionDTO[] {
    if (newSubmissionDTO.AccountNumber == null) {
      return null
    }

    final var account = _accountRetrievalPlugin.getAccountByNumber(newSubmissionDTO.AccountNumber)

    return _submissionPlugin.getAvailableProducts(account, newSubmissionDTO)
  }

  /**
   * Returns the notes on the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>INotePlugin#getNotesForAccount(entity.Account)</code> -  To return the notes for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForAccount(accountNumber : String) : NoteDTO[] {
    if (accountNumber == null) {
      return null
    }
    var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    return _notePlugin.getNotesForAccount(account)
  }

  /**
   * Creates a note for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>INotePlugin#createNoteForAccount(entity.Account, edge.capabilities.gpa.note.dto.NoteDTO)</code> - To create the note on the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @param noteDTO       the details of the note to be created
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForAccount(accountNumber : String, noteDTO : NoteDTO) : NoteDTO {
    final var bundle = Bundle.getCurrent()
    final var account = bundle.add(_accountRetrievalPlugin.getAccountByNumber(accountNumber))
    final var note = _notePlugin.createNoteForAccount(account, noteDTO)

    return _notePlugin.toDTO(note)
  }

  /**
   * Returns policy transactions for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To return the policy transactions for the given Account</dd>
   * <dd> <code>IJobSummaryPlugin#toDTOArray(entity.Job[])</code> - To map the policy transactions to DTOs</dd>
   * </dl>
   *
   * @param accountNumber the account number
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicyTransactionsForAccount(accountNumber : String) : JobSummaryDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    try {
      final var jobs = _jobHelper.findJobsByAccount(account, null, null, User.util.CurrentUser)
      return _jobSummaryPlugin.toDTOArray(jobs)
    } catch (e : EntityNotFoundException) {
      if (LOGGER.debugEnabled()) {
        LOGGER.logError(e)
      } else {
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch (e : Exception) {
      LOGGER.logError(e)
    }
    return null
  }

  /**
   * Returns the open policy transactions for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To return the policy transactions for the given Account</dd>
   * <dd> <code>IJobSummaryPlugin#toDTOArray(entity.Job[])</code> - To map the policy transactions to DTOs</dd>
   * </dl>
   *
   * @param accountNumber the account number
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getOpenPolicyTransactionsForAccount(accountNumber : String) : JobSummaryDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    try {
      final var jobs = _jobHelper.findJobsByAccount(account, false, null, User.util.CurrentUser)
      return _jobSummaryPlugin.toDTOArray(jobs)
    } catch (e : EntityNotFoundException) {
      if (LOGGER.debugEnabled()) {
        LOGGER.logError(e)
      } else {
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch (e : Exception) {
      LOGGER.logError(e)
    }
    return null
  }


  /**
   * Returns the documents for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForAccount(entity.Account)</code> - To return the documents for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns DocumentDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getDocumentsForAccount(accountNumber : String) : DocumentDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
    final var accountDocuments = _documentPlugin.getDocumentsForAccount(account)

    return _documentPlugin.toDTOArray(accountDocuments)
  }


  /**
   * Returns the invoices for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IPolicyPeriodBillingSummaryPlugin#getPolicyInvoicesForAccount(entity.Account)</code> - To return the policy invoices for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns BillingInvoiceDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getInvoicesForAccount(accountNumber : String) : BillingInvoiceDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    return _billedPolicyPlugin.getPolicyInvoicesForAccount(account)
  }

  /**
   * Returns the owned billed policies for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IPolicyPeriodBillingSummaryPlugin#getAccountBilledOwnedPolicies(entity.Account)</code> - To return the owned billed policies for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns PolicyPeriodBillingSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getOwnedBilledPoliciesForAccount(accountNumber : String) : PolicyPeriodBillingSummaryDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    try {
      return _billedPolicyPlugin.getAccountBilledOwnedPolicies(account)
    } catch (e : JsonRpcInternalErrorException) {
      if (LOGGER.debugEnabled()) {
        LOGGER.logError(e)
      } else {
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch (e : Exception) {
      LOGGER.logError(e)
    }
    return null
  }

  /**
   * Returns the unowned billed policies for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IPolicyPeriodBillingSummaryPlugin#getAccountBilledUnownedPolicies(entity.Account)</code> - To return the unowned billed policies for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns PolicyPeriodBillingSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getUnownedBilledPoliciesForAccount(accountNumber : String) : PolicyPeriodBillingSummaryDTO[] {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    try {
      return _billedPolicyPlugin.getAccountBilledUnownedPolicies(account)
    } catch (e : JsonRpcInternalErrorException) {
      if (LOGGER.debugEnabled()) {
        LOGGER.logError(e)
      } else {
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch (e : Exception) {
      LOGGER.logError(e)
    }
    return null
  }

  /**
   * Returns the billing data for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IAccountBillingPlugin#getAccountBillingData(entity.Account)</code> -  To return the billing data for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns AccountBillingDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountBillingData(accountNumber : String) : AccountBillingDTO {
    final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    try {
      return _accountBillingPlugin.getAccountBillingData(account)
    } catch (e : JsonRpcInternalErrorException) {
      if (LOGGER.debugEnabled()) {
        LOGGER.logError(e)
      } else {
        LOGGER.logError(e.LocalizedMessage)
      }
    } catch (e : Exception) {
      LOGGER.logError(e)
    }

    return null
  }

  /**
   * Returns the claim summary information for the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To return the given Account</dd>
   * <dd> <code>IClaimSummaryPlugin#getAccountClaims(entity.Account)</code> -   To return the claims for the given Account</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns ClaimSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountClaims(accountNumber : String) : ClaimSummaryDTO[] {
    final var anAccount = _accountRetrievalPlugin.getAccountByNumber(accountNumber)

    return _claimSummaryPlugin.getAccountClaims(anAccount)
  }

  /**
   * Returns account summaries for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO {
    try {
      return _accountSearchPlugin.getAccountsForCurrentUser(createdInLastXDays, queryOptions, queryParameters)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns account summaries for the given producer code
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @param aProducerCode      the producer code for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountsForProducerCode(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, aProducerCode : String) : AccountSearchSummaryDTO {
    try {
      final var producerCode = Query.make(ProducerCode).compare("Code", Equals, aProducerCode).select().AtMostOneRow
      return _accountSearchPlugin.getAccountsForProducerCode(createdInLastXDays, producerCode, queryOptions)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns personal account summaries for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPersonalAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO {
    try {
      return _accountSearchPlugin.getPersonalAccountsForCurrentUser(createdInLastXDays, queryOptions, queryParameters)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns personal account summaries for the given producer code
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @param aProducerCode      optional producerCode for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPersonalAccountsForProducerCode(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, aProducerCode : String) : AccountSearchSummaryDTO {
    try {
      final var producerCode = Query.make(ProducerCode).compare("Code", Equals, aProducerCode).select().AtMostOneRow
      return _accountSearchPlugin.getPersonalAccountsForProducerCode(createdInLastXDays, queryOptions, producerCode)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns commercial account summaries for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getCommercialAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO {
    try {
      return _accountSearchPlugin.getCommercialAccountsForCurrentUser(createdInLastXDays, queryOptions, queryParameters)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns commercial account summaries for the given producer code
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> - To return an an array of accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> - To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param createdInLastXDays the number of days to limit the account search to
   * @param queryOptions       the query options for the account search
   * @param aProducerCode      optional producerCode for the account search
   * @returns AccountSearchSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getCommercialAccountsForProducerCode(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, aProducerCode : String) : AccountSearchSummaryDTO {
    try {
      final var producerCode = Query.make(ProducerCode).compare("Code", Equals, aProducerCode).select().AtMostOneRow
      return _accountSearchPlugin.getCommercialAccountsForProducerCode(createdInLastXDays, queryOptions, producerCode)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSearchSummaryDTO()
  }

  /**
   * Returns the recently viewed accounts for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountViewHistoryPlugin#getRecentlyViewedAccounts(java.lang.String)</code> -  To return an an array of recently viewed accounts</dd>
   * <dd> <code>IAccountPlugin#toDTOArray(entity.Account[])</code> -  To map the array of accounts to DTOs</dd>
   * </dl>
   *
   * @param accountNumber the account number
   * @returns AccountSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getRecentlyViewedAccounts() : AccountSummaryDTO[] {
    try {
      final var accounts = _accountViewHistoryPlugin.getRecentlyViewedAccounts(User.util.CurrentUser)

      return _accountSummaryPlugin.toDTOArray(accounts)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountSummaryDTO[]{}
  }

  /**
   * Adds an account to the recently viewed accounts list for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> -  To return an account</dd>
   * <dd> <code>IAccountViewHistoryPlugin#addRecentlyViewedAccount(entity.User, entity.Account)</code> -  To add the account to the recently viewed</dd>
   * </dl>
   *
   * @param accountNumber the account number
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function addRecentlyViewedAccounts(accountNumber : String) {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      _accountViewHistoryPlugin.addRecentlyViewedAccount(User.util.CurrentUser, account)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }
  }

  /**
   * Returns the account jobs for the currently logged in user
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAccountsForCurrentUser(java.lang.Integer)</code> -  To return a list of all accounts for the current user</dd>
   * <dd> <code>IAccountJobsPlugin#toDTOArray(entity.Account[], java.lang.Integer)</code> -  To generate a DTO array of the Account Jobs</dd>
   * </dl>
   *
   * @param createdInLastXDays an int containing the number of days in the past the plugin should retrieve the account jobs for, defaults to 30
   * @return An array of AccountJobsDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountJobsForCurrentUser(createdInLastXDays : Integer) : AccountJobsDTO[] {
    try {
      final var accounts = _accountSearchPlugin.getAllAccountsForCurrentUser()

      return _accountJobsPlugin.toDTOArray(accounts, createdInLastXDays)
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return new AccountJobsDTO[]{}
  }

  /**
   * Returns the account jobs summary for the current user.
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountSearchPlugin#getAllAccountsForCurrentUser(java.lang.Integer)</code> -  To return a list of all accounts for the current user</dd>
   * <dd> <code>IAccountJobsPlugin#accountJobsSummaryToDTOArray(entity.ProducerCode[], entity.Job[])</code> -  To generate an array of AccountJobSummaryDTOs</dd>
   * <dd> <code>JobUtil#findJobsByAccountProducerCodeCreatedInLastXDays(entity.Account, java.lang.Boolean, typekey.Job, entity.User, java.lang.Integer)</code> -  To find jobs related to the current user</dd>
   * </dl>
   *
   * @param createdInLastXDays an int containing the number of days in the past the plugin should retrieve the account jobs for, defaults to 30
   * @return An array of AccountJobsSummaryDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountJobsSummariesForCurrentUser(createdInLastXDays : Integer) : AccountJobsSummaryDTO[] {
    final var allJobs = new ArrayList<Job>()

    try {
      final var accounts = _accountSearchPlugin.getAllAccountsForCurrentUser()

      if (accounts != null && !accounts.IsEmpty) {
        accounts.each(\anAccount -> {
          try {
            allJobs.addAll(_jobHelper.findJobsByAccountCreatedInLastXDays(anAccount, false, null, User.util.CurrentUser, createdInLastXDays).toList())
          } catch (ex : Exception) {

          }
        })
      }

      return _accountJobsPlugin.accountJobsSummaryToDTOArray(User.util.CurrentUser.UserProducerCodes*.ProducerCode, allJobs.toTypedArray())
    } catch (ex : Exception) {
      LOGGER.logError(ex)
    }

    return _accountJobsPlugin.accountJobsSummaryToDTOArray(null, allJobs.toTypedArray())
  }

}
