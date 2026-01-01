package edge.capabilities.quote.draft.account
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.quote.person.util.PersonUtil
uses java.util.Date
uses edge.exception.IllegalStateException
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.address.IAddressCompletionPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.util.mapping.RefUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.policycommon.accountcontact.IAccountContactPlugin
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO
uses gw.product.ProducerCodeSearchCriteria

/**
 * Default implementation of quote account plugin. This implementation creates a new
 * account for each quote.
 */
class DefaultQuoteDraftAccountPlugin implements IDraftAccountPlugin {
  
  /**
   * Address management plugin.
   */
  private var _accContactPlugin : IAccountContactPlugin
  private var _addressPlugin : IAddressPlugin
  private var _addressCompletion : IAddressCompletionPlugin

  @ForAllGwNodes
  @Param("accContactPlugin", "Plugin used for creating and updating the account holder")
  @Param("addressPlugin", "Plugin used for the addresses during the quote")
  @Param("addressCompletion", "Plugin used for the addresses completion")
  construct(accContactPlugin : IAccountContactPlugin, addressPlugin : IAddressPlugin, addressCompletion : IAddressCompletionPlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._accContactPlugin = accContactPlugin
    this._addressPlugin = addressPlugin
    this._addressCompletion = addressCompletion
  }

  override function toDto(account : Account) : AccountContactDTO {
    return _accContactPlugin.toDTO(account.AccountHolder.AccountContact.Contact)
  }


  override function updateOrCreateNewQuoteAccount(anAccount : Account, productCode: String, accountHolder: AccountContactDTO, policyAddress: AddressDTO): Account {
    if (anAccount != null) {
      var accountHolderContact = anAccount.AccountHolderContact
      _accContactPlugin.updateContact(accountHolderContact, accountHolder)
      _addressPlugin.updateFromDTO(accountHolderContact.PrimaryAddress, policyAddress)
    } else {
      return createNewAccount(productCode, accountHolder, policyAddress)
    }

    return anAccount
  }


  
  override function updateQuoteAccount(account : Account, dto : AccountContactDTO) {
    if (!(account.AccountHolder.AccountContact.Contact typeis Person || account.AccountHolder.AccountContact.Contact typeis Company)) {
      throw new IllegalStateException() {:Message = "Bad contact type for quoting, contact is not person or company" }
    }
    
    final var contact = account.AccountHolder.AccountContact.Contact
    _accContactPlugin.updateContact(contact, dto)
  }



  /**
   * Returns the AccountProducerCode entity to be used for new accounts
   */
  protected function retrieveProducerCode(productCode : String) : AccountProducerCode {
    final var producerCodeCriteria = new ProducerCodeSearchCriteria(User.util.CurrentUser.getOrganization(), false, null, false)
    producerCodeCriteria.Code = "portal"
    
    final var producerCode = producerCodeCriteria.performSearch().FirstResult
    
    var accountProducerCode = new AccountProducerCode()
    accountProducerCode.ProducerCode = producerCode
    return accountProducerCode
  }

  protected function createNewAccount(productCode: String, accountHolder: AccountContactDTO, policyAddress: AddressDTO) : Account {
    var contact : Contact
    if (accountHolder.Subtype.equals("Person")){
      contact = new Person()
    }
    else if (accountHolder.Subtype.equals("Company")){
      contact = new Company()
    }
    _accContactPlugin.updateContact(contact, accountHolder)

    policyAddress.AddressType = typekey.AddressType.TC_HOME
    var address = new Address()
    _addressPlugin.updateFromDTO(address, policyAddress)
    contact.PrimaryAddress = address

    /** Account is also unique non-referencable entity at this moment. */
    final var account = Account.createAccountForContact(contact)
    account.OriginationDate = Date.Today
    account.addToProducerCodes(retrieveProducerCode(productCode))
    account.updateAccountHolderContact()

    return account
  }

}
