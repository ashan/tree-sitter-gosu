package nz.co.acc.edge.capabilities.gpa.account

uses edge.PlatformSupport.Bundle
uses edge.capabilities.gpa.account.DefaultAccountPlugin
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.billing.IAccountBillingSummaryPlugin
uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.capabilities.gpa.contact.IContactPlugin
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses edge.capabilities.gpa.policy.IPolicySummaryPlugin
uses edge.capabilities.gpa.user.local.IProducerCodePlugin
uses edge.capabilities.helpers.AccountUtil
uses edge.capabilities.helpers.JobUtil
uses edge.di.annotations.ForAllNodes
uses edge.exception.EntityNotFoundException
uses edge.exception.EntityPermissionException
uses edge.jsonrpc.exception.JsonRpcApplicationException
uses edge.security.EffectiveUserProvider
uses entity.AccountContact
uses entity.Activity
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses nz.co.acc.edge.capabilities.address.IAddressPlugin_ACC
uses nz.co.acc.edge.capabilities.address.dto.AddressDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.AccountDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.ActivityDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.activity.IActivityPlugin_ACC
uses nz.co.acc.edge.capabilities.helpers.AccountUtil_ACC
uses nz.co.acc.edge.capabilities.helpers.HistoryUtil_ACC
uses nz.co.acc.edge.capabilities.accountcontact.IAccountContactPlugin_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses typekey.AccountContactRole
uses wsi.local.gw.wsi.pl.workflowapi.faults.BadIdentifierException

/**
 * Created by nitesh.gautam on 1/03/2017.
 */
class AccountPlugin_ACC extends DefaultAccountPlugin implements IAccountPlugin_ACC {
  private var _accContactPlugin : IAccountContactPlugin_ACC
  private var _userProvider : EffectiveUserProvider
  private var _accountRetrievalPlugin : IAccountRetrievalPlugin
  private var _activityPlugin : IActivityPlugin_ACC
  private var _addressPlugin : IAddressPlugin_ACC


  @ForAllNodes
  construct(aContactPlugin : IContactPlugin, accContactPlugin : IAccountContactPlugin_ACC,
            aPolicySummaryPlugin : IPolicySummaryPlugin, aBillingSummaryPlugin : IAccountBillingSummaryPlugin,
            aProducerCodePlugin : IProducerCodePlugin, aClaimSummaryPlugin : IClaimSummaryPlugin,
            aCurrencyPlugin : ICurrencyPlugin, aJobHelper : JobUtil, aUserProvider : EffectiveUserProvider,
            anAccountRetrievalPlugin : IAccountRetrievalPlugin, anActivityPlugin : IActivityPlugin_ACC,
            addressPlugin : IAddressPlugin_ACC) {

    super(aContactPlugin, accContactPlugin, aPolicySummaryPlugin, aBillingSummaryPlugin,
        aProducerCodePlugin, aClaimSummaryPlugin, aCurrencyPlugin, aJobHelper)

    this._accContactPlugin = accContactPlugin
    this._userProvider = aUserProvider
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
    this._activityPlugin = anActivityPlugin
    this._addressPlugin = addressPlugin
  }

  override function toDTO(anAccount : Account) : AccountDTO_ACC {
    final var dto = accountBaseDetailsToDTO(anAccount)
    return dto
  }

  override function accountBaseDetailsToDTO(anAccount : Account) : AccountDTO_ACC {
    if (anAccount == null) {
      return null
    }
    var accountDTO = new AccountDTO()
    accountDTO = super.accountBaseDetailsToDTO(anAccount)
    final var dto = accountDTOToAccountDTO_ACC(accountDTO)
    dto.ACCAccountHolder = _accContactPlugin.toAccountContactDTO_ACC(anAccount.AccountHolder.AccountContact)
    dto.Nzbn = anAccount.NZBN_ACC
    dto.IrdNumber = anAccount.IRDNumber_ACC
    dto.AccNumber = anAccount.ACCID_ACC
    dto.Correspondence = anAccount.AccountHolderContact.CorrespondencePreference_ACC
    dto.IsAEPAccount = anAccount.AEPContractAccount_ACC
    dto.BalanceDate = anAccount.BalanceDate_ACC
    return dto
  }

  private function accountDTOToAccountDTO_ACC(accountDTO : AccountDTO) : AccountDTO_ACC {
    final var dto = new AccountDTO_ACC()
    dto.PublicID = accountDTO.PublicID
    dto.AccountNumber = accountDTO.AccountNumber
    dto.StatusDisplayName = accountDTO.StatusDisplayName
    dto.AccountCreatedDate = accountDTO.AccountCreatedDate
    dto.CanUserView = accountDTO.CanUserView
    dto.ProducerCodes = accountDTO.ProducerCodes
    dto.PolicySummaries = accountDTO.PolicySummaries
    dto.CanUserCreateSubmission = accountDTO.CanUserCreateSubmission
    dto.NumberOfOpenActivities = accountDTO.NumberOfOpenActivities
    dto.NumberOfNotes = accountDTO.NumberOfNotes
    dto.NumberOfDocuments = accountDTO.NumberOfDocuments
    dto.NumberOfWorkOrders = accountDTO.NumberOfWorkOrders
    dto.NumberOfOpenQuotes = accountDTO.NumberOfOpenQuotes
    dto.NumberOfOpenPolicyCancellations = accountDTO.NumberOfOpenPolicyCancellations
    dto.NumberOfOpenPolicyChanges = accountDTO.NumberOfOpenPolicyChanges
    dto.NumberOfOpenPolicyRenewals = accountDTO.NumberOfOpenPolicyRenewals
    dto.TotalPremium = accountDTO.TotalPremium
    dto.NumberOfOpenClaims = accountDTO.NumberOfOpenClaims
    dto.AccountBillingSummary = accountDTO.AccountBillingSummary
    dto.HasIssuedPolicy = dto.PolicySummaries != null
    return dto
  }

  override function accountContactDetailsToDTO(anAccountContact : entity.AccountContact) : AccountContactDTO_ACC {
    return _accContactPlugin.toAccountContactDTO_ACC(anAccountContact)
  }

  override property get Accounts() : AccountDTO_ACC[] {
    final var userAccountsStrings = AccountUtil_ACC.getTargetUserAccounts(_userProvider.EffectiveUser)
    var accountList = userAccountsStrings.map(\accountNumber -> AccountUtil.getAccountByAccountNumber(accountNumber))
    return accountList.map(\account -> accountBaseDetailsToDTO(account)).toTypedArray()
  }

  override function findEffectiveUserAccount() : Account {
    final var targetAccounts = AccountUtil_ACC.getTargetUserAccounts(_userProvider.EffectiveUser)
    final var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)
    confirmUserAuthority(targetAccounts, account)
    return account
  }

  private function confirmUserAuthority(targetAccounts : Set<String>, account : Account) {
    if (!targetAccounts.contains(account.ACCID_ACC)) {
      throw new EntityPermissionException() {
        :Message = DisplayKey.get("Edge.Capabilities.Account.Exception.NoAccountFound"),
        :Data = account.AccountNumber
      }
    }
  }

  override function deleteAccountContact(accNumber : String, accountContactPublicId : String) {
    final var account = findEffectiveUserAccount()
    var accountContact = findAccountContact(accountContactPublicId)
    if (accountContact == null) {
      throw new EntityNotFoundException() {
        :Message = DisplayKey.get("Edge.Capabilities.Account.Exception.ContactNotFound"),
        :Data = accountContactPublicId
      }
    }
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      accountContact = bundle.add(accountContact)
      accountContact.Account.removeFromAccountContacts(accountContact)
    }, User.util.CurrentUser)
  }

  override function updateAccountContact(accNumber : String, accountContactDto : AccountContactDTO_ACC, reason : String) : AccountContactDTO_ACC {
    final var account = findEffectiveUserAccount()
    var accountContact = findAccountContact(accountContactDto.PublicID)




    return _accContactPlugin.updateContact(accountContact, accountContactDto, reason)
  }

  private function findAccountContact(publicID : String) : AccountContact {
    var result = Query.make(AccountContact)
        .compare(AccountContact#PublicID, Relop.Equals, publicID)
        .select().AtMostOneRow;
    if(result == null){
      throw new BadIdentifierException("Cannot find accountContact with publicID : ${publicID}")
    }
    return result
  }

  override function activityBaseDetailsToDTO(anActivity : Activity) : ActivityDTO_ACC {
    if (anActivity == null) {
      return null
    }

    var activityDTO = new ActivityDTO_ACC()

    activityDTO.ActivityID = anActivity.getPublicID()
    activityDTO.Description = anActivity.getDescription()
    activityDTO.Subject = anActivity.getSubject()
    return activityDTO
  }

  override function getAccountHistory(accNumber : String) : HistoryDTO_ACC[] {
    final var account = findEffectiveUserAccount()
    var historys = HistoryUtil_ACC.getHistory(account)
    return historys.map(\history -> HistoryDTO_ACC.fromHistory(history))
  }

  private function createActivity(dto : ActivityDTO, bundle : Bundle) : Activity {
    final var anAccount = bundle.add(_accountRetrievalPlugin.getAccountByNumber(dto.AccountNumber))
    return _activityPlugin.createStatusActivityForAccount(anAccount, dto)
  }

  override function createAccountHolderAddress(addressDTO : AddressDTO_ACC) : AddressDTO_ACC {

    var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)

    var accountHolder = account.AccountHolder?.AccountContact
    if (accountHolder == null) {
      throw new RuntimeException(
          DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.CreateAddress_ACC.Exception.AccountHolderNotFound_ACC",
              account.ACCID_ACC))
    }

    validateAccountHolderAddressChangeRequest(accountHolder, addressDTO)

    return _addressPlugin.createAddress_ACC(accountHolder, addressDTO)
  }

  override function updateAccountHolderAddress(addressDTO : AddressDTO_ACC) : AddressDTO_ACC {

    var account = AccountUtil.getUniqueAccount(_userProvider.EffectiveUser)

    var accountHolder = account.AccountHolder?.AccountContact
    if (accountHolder == null) {
      throw new RuntimeException(
          DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.CreateAddress_ACC.Exception.AccountHolderNotFound_ACC",
              account.ACCID_ACC))
    }

    validateAccountHolderAddressChangeRequest(accountHolder, addressDTO)

    return _addressPlugin.updateAddress_ACC(accountHolder, addressDTO)
  }

  /**
   * Validates a request to create/update an account holder address
   *
   * @param addressDTO
   * @param accountHolder
   */
  private function validateAccountHolderAddressChangeRequest(accountHolder : AccountContact, addressDTO : AddressDTO_ACC) {

    /**
     * WPS allowed only for Company account holder contact
     */
    if (accountHolder.isPerson() && addressDTO.IsWPSAddress) {
      throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.WPSPerson_ACC"))
    }

    /**
     * Only accept agent, claims, preferred addresses
     */
    if (addressDTO.AddressType != AddressType.TC_AGENTACC
        && addressDTO.AddressType != AddressType.TC_CLAIMSACC
        && addressDTO.AddressType != AddressType.TC_PREFERREDACC) {

      throw new IllegalArgumentException(
          DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.AddressType_ACC",
              addressDTO.AddressType))
    }

    /**
     * A claims address must exist before adding an agent address
     */
    if (addressDTO.AddressType == AddressType.TC_AGENTACC && !AccountUtil_ACC.hasClaimsAddress(accountHolder)) {
      throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.AgentClaimsAddress_ACC"))

    }

    /**
     * Flags can not be set for claims addresses
     */
    if (addressDTO.AddressType == AddressType.TC_CLAIMSACC) {
      if (addressDTO.IsPrimaryAddress) {
        throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.ClaimsPrimaryAddress_ACC"))
      }
      if (addressDTO.IsCPCXAddress) {
        throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.ClaimsCPCXAddress_ACC"))
      }
      if (addressDTO.IsWPCAddress) {
        throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.ClaimsWPCAddress_ACC"))
      }
      if (addressDTO.IsWPSAddress) {
        throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.GPA.Account.AccountPlugin_ACC.ValidateAddressChange_ACC.Exception.ClaimsWPSAddress_ACC"))
      }
    }
  }

  override function verifyAccountExists(accNumber : String) : Boolean {
    try {
      AccountUtil.getAccountByAccountNumber(accNumber)
      return true
    } catch (e : EntityNotFoundException) {
      return false
    }
  }
}