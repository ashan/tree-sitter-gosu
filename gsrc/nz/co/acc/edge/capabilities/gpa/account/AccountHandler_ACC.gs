package nz.co.acc.edge.capabilities.gpa.account

uses edge.PlatformSupport.Bundle
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.aspects.validation.annotations.Context
uses edge.capabilities.gpa.account.AccountHandler
uses edge.capabilities.gpa.account.IAccountJobsPlugin
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.capabilities.gpa.account.IAccountSummaryPlugin
uses edge.capabilities.gpa.account.IAccountViewHistoryPlugin
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.capabilities.gpa.account.search.IAccountSearchPlugin
uses edge.capabilities.gpa.billing.IAccountBillingPlugin
uses edge.capabilities.gpa.billing.IBillingInvoicePlugin
uses edge.capabilities.gpa.billing.IPolicyPeriodBillingSummaryPlugin
uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses edge.capabilities.gpa.job.submission.ISubmissionPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.helpers.ProducerCodeUtil
uses edge.di.annotations.InjectableNode
uses edge.el.Expr
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.exception.JsonRpcApplicationException
uses edge.security.EffectiveUserProvider
uses edge.security.permission.IPermissionCheckPlugin
uses gw.api.validation.EntityValidationException
uses nz.co.acc.edge.capabilities.accountcontact.IAccountContactPlugin_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.CompanyContactRelationshipDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.PersonContactRelationshipDTO_ACC
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.AccountUpdateDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC

/**
 * ACC Account Handler API.
 */
@Context("ProducerCodeRequired", Expr.const(true))
class AccountHandler_ACC extends AccountHandler {
  private static var LOGGER = new Logger(Reflection.getRelativeName(AccountHandler_ACC))
  private var _accountRetrievalPlugin : IAccountRetrievalPlugin
  private var _accountPlugin : IAccountPlugin_ACC
  private var _accountContactPlugin : IAccountContactPlugin_ACC
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  construct(accountPlugin : IAccountPlugin_ACC, accountSearchPlugin : IAccountSearchPlugin,
            submissionPlugin : ISubmissionPlugin, notePlugin : INotePlugin, aJobPlugin : IJobPlugin,
            aDocumentPlugin : IDocumentPlugin, aBillingInvoicePlugin : IBillingInvoicePlugin,
            aBilledPolicyPlugin : IPolicyPeriodBillingSummaryPlugin, aPermissionCheckPlugin : IPermissionCheckPlugin,
            aClaimSummaryPlugin : IClaimSummaryPlugin, anAccountSummaryPlugin : IAccountSummaryPlugin,
            anAccountJobsPlugin : IAccountJobsPlugin,
            aJobSummaryPlugin : IJobSummaryPlugin, anAccountBillingPlugin : IAccountBillingPlugin,
            aJobHelper : JobUtil, aProducerCodeHelper : ProducerCodeUtil,
            anAccountViewHistoryPlugin : IAccountViewHistoryPlugin, anAccountRetrievalPlugin : IAccountRetrievalPlugin,
            accountContactPlugin : IAccountContactPlugin_ACC,
            aUserProvider : EffectiveUserProvider) {
    super(accountPlugin, accountSearchPlugin, submissionPlugin, notePlugin, aJobPlugin, aDocumentPlugin,
        aBillingInvoicePlugin, aBilledPolicyPlugin, aPermissionCheckPlugin, aClaimSummaryPlugin,
        anAccountSummaryPlugin, anAccountJobsPlugin, aJobSummaryPlugin, anAccountBillingPlugin,
        aJobHelper, aProducerCodeHelper, anAccountViewHistoryPlugin, anAccountRetrievalPlugin)
    this._accountPlugin = accountPlugin
    this._accountContactPlugin = accountContactPlugin
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
    this._userProvider = aUserProvider
  }

  /**
   * Returns or creates and returns the given account
   * <p>
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>IAccountPlugin#createAccount(edge.capabilities.gpa.account.dto.AccountDTO)</code> -
   * If account number doesn't exist, create an account using the provided DTO</dd>
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
    return super.getOrCreateAccount(anAccountDTO)
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
  function getAccountDetails(accNumber : String) : AccountDTO {
    final var account = _accountPlugin.findEffectiveUserAccount()
    return _accountPlugin.toDTO(account)
  }

  /**
   * Verifies that the given account exists
   *
   * @param accountNumber the account number for the given account
   * @returns boolean value indicating existence of the account
   */
  @JsonRpcMethod
  function verifyAccountExists(accNumber : String) : Boolean {
    return _accountPlugin.verifyAccountExists(accNumber)
  }

  /**
   * Returns contacts for the given account
   *
   * @param accountNumber the account number for the given account
   * @returns AccountContactDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountContacts(accNumber : String) : AccountContactDTO_ACC[] {
    final var account = _accountPlugin.findEffectiveUserAccount()
    final var accountContactDTOList = new LinkedList<AccountContactDTO_ACC>()
    account.AccountContacts.each(\accountContact -> accountContactDTOList
        .add(_accountPlugin.accountContactDetailsToDTO(accountContact)))
    return accountContactDTOList.toTypedArray()
  }

  /**
   * Returns all the Accounts belonging to the user
   *
   * @param accountNumber the account number for the given account
   * @returns AccountContactDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccounts() : AccountDTO[] {
    return _accountPlugin.Accounts
  }

  /**
   * Delete account contact for account
   *
   * @param accNumber              acc number
   * @param accountContactPublicID account contact to delete
   */
  @JsonRpcMethod
  function deleteAccountContact(accNumber : String, accountContactPublicID : String) {
    _accountPlugin.deleteAccountContact(accNumber, accountContactPublicID)
  }

  /**
   * Updates the account correspondence details
   *
   * @param accountDTO the correspondence details
   * @return the updated account
   */
  @JsonRpcMethod
  function updateAccountInfo(accountDTO : AccountUpdateDTO_ACC) : AccountDTO {
    var account = _accountPlugin.findEffectiveUserAccount()

    if (accountDTO.Correspondence == null) {
      throw new JsonRpcApplicationException() {
        :Message = "Correspondence is null"
      }
    } else if (accountDTO.Contact.EmailAddress1 == null and accountDTO.Contact.EmailVerifiedDate != null) {
      throw new JsonRpcApplicationException() {
        :Message = "Email address 1 not present"
      }
    } else if (accountDTO.Correspondence.equals(CorrespondencePreference_ACC.TC_EMAIL)) {
      if (accountDTO.Contact.EmailAddress1.Empty) {
        throw new JsonRpcApplicationException() {
          :Message = "Email address 1 not present"
        }
      } else if (accountDTO.Contact.EmailVerifiedDate == null) {
        throw new JsonRpcApplicationException() {
          :Message = "Email Verified date is not present"
        }
      }
    }

    try {
      Bundle.transaction(\bundle -> {
        account = bundle.add(account)
        var contact = bundle.add(account.AccountHolderContact)
        var oldValue = contact.CorrespondencePreference_ACC
        contact.CorrespondencePreference_ACC = accountDTO.Correspondence
        contact.EmailAddress1 = accountDTO?.Contact?.EmailAddress1
        contact.EmailVerifiedDate_ACC = accountDTO?.Contact?.EmailVerifiedDate

      })
    } catch (ex : EntityValidationException) {
      LOGGER.logError(ex.AllErrorMessages.toString())
      throw new JsonRpcApplicationException() {
        :Message = ex.AllErrorMessages.first()
      }
    } catch (ex : Exception) {
      LOGGER.logError(ex.Message)
      throw new JsonRpcApplicationException() {
        :Message = ex.Message
      }
    }

    return _accountPlugin.toDTO(account)
  }


  /**
   * Updates the account contact with the accountContactDTO data.
   *
   * @param accNumber         the account with the account contact to update
   * @param accountContactDTO the account contact data
   * @return the updated account contact
   */
  @JsonRpcMethod
  function updateAccountContact(accNumber : String, accountContactDTO : AccountContactDTO_ACC, reason:String) : AccountContactDTO_ACC {
    return _accountPlugin.updateAccountContact(accNumber, accountContactDTO, reason)
  }

  /**
   * Returns all history records of given ACC customer
   *
   * @param accountNumber the account number for the given account
   * @returns HistoryDTO_ACC[] the collection History record
   */
  @JsonRpcMethod
  function getAccountJourney(accNumber : String) : HistoryDTO_ACC[] {
    return _accountPlugin.getAccountHistory(accNumber)
  }

  /**
   * Creates a new address for the account holder of the account which the
   * logged in portal user has access to.
   *
   * @param addressDTO Details of the new account to be added
   */
  @JsonRpcMethod
  public function createAccountHolderAddress(addressDTO : AddressDTO_ACC) : AddressDTO_ACC {
    return _accountPlugin.createAccountHolderAddress(addressDTO)
  }

  /**
   * Updates an existing address for the account holder of the account which the
   * logged in portal user has access to.
   *
   * @param addressDTO Details of the new account to be added
   */
  @JsonRpcMethod
  public function updateAccountHolderAddress(addressDTO : AddressDTO_ACC) : AddressDTO_ACC {
    return _accountPlugin.updateAccountHolderAddress(addressDTO)
  }

  /**
   * Creates a company contact relationship.
   *
   * @param contactRelationshipDTO
   * @return an error message if one occurred, else null
   */
  @JsonRpcMethod
  public function createCompanyContactRelationship(contactRelationshipDTO : CompanyContactRelationshipDTO_ACC) : String {
    final var account = _accountPlugin.findEffectiveUserAccount()
    return _accountContactPlugin.createCompanyContactRelationship(account, contactRelationshipDTO)
  }

  /**
   * Deletes a company contact relationship.
   *
   * @param contactRelationshipDTO
   * @return an error message if one occurred, else null
   */
  @JsonRpcMethod
  public function deleteCompanyContactRelationship(contactRelationshipDTO : CompanyContactRelationshipDTO_ACC) : String {
    final var account = _accountPlugin.findEffectiveUserAccount()
    return _accountContactPlugin.deleteCompanyContactRelationship(account, contactRelationshipDTO)
  }

  /**
   * Creates a person contact relationship.
   *
   * @param contactRelationshipDTO
   * @return an error message if one occurred, else null
   */
  @JsonRpcMethod
  public function createPersonContactRelationship(contactRelationshipDTO : PersonContactRelationshipDTO_ACC) : String {
    final var account = _accountPlugin.findEffectiveUserAccount()
    return _accountContactPlugin.createPersonContactRelationship(account, contactRelationshipDTO)
  }

  /**
   * Deletes a person contact relationship.
   *
   * @param contactRelationshipDTO
   * @return an error message if one occurred, else null
   */
  @JsonRpcMethod
  public function deletePersonContactRelationship(contactRelationshipDTO : PersonContactRelationshipDTO_ACC) : String {
    final var account = _accountPlugin.findEffectiveUserAccount()
    return _accountContactPlugin.deletePersonContactRelationship(account, contactRelationshipDTO)
  }

  /**
   * JUNO-2885 Update MYACC registration Status from Portal
   *
   * @param accountNumber the account number for the given account
   * @param status        MYACC registartion status which needs to be updated on account level
   * @returns String
   */

  @JsonRpcMethod
  function updateRegistrationStatus(status : String) : String {
    var account = _accountPlugin.findEffectiveUserAccount()
    new AccountHandlerUtil_ACC().updateMyACCStatus(account, status)
    return "The MyACC registration status ${status} is updated to the account"
  }

}