package edge.capabilities.quote.draft.account
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO

/**
 * Plugin to deal with quote accounts.
 */
interface IDraftAccountPlugin {
  
  /**
   * Converts account into dto.
   */
  function toDto(account : Account) : AccountContactDTO
  
  /**
   * Fetches (and updates) or creates a new account for the quote. Actual logic
   * may depend on the implementation. 
   * <p>Implementation should set product codes for a new accounts. It may use 
   * product code to determine eligible producers.
   * <p><em>Address handling.</em>
   * Implementation could find an existing account or create a new account using provided policyAddress. Users
   * of this interface should consider that an existing account is returned and its address could be different from
   * the provided policy address.
   * </p>
   */
  @Param("anAccount", "Account to be updated")
  @Param("productCode", "Target product for quoting")
  @Param("person", "Account holder person")
  @Param("policyAddress", "Policy address which would be automatically inherited by the policy.")
  function updateOrCreateNewQuoteAccount(anAccount : Account, productCode: String, person : AccountContactDTO, policyAddress : AddressDTO) : Account
  
  /**
   * Updates account to match passed DTO.
   */
  function updateQuoteAccount(account : Account, dto : AccountContactDTO)
}
