package edge.capabilities.gpa.search

uses edge.capabilities.gpa.search.dto.SearchResultsDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.account.IAccountPlugin
uses edge.capabilities.gpa.policy.IPolicyPlugin
uses edge.capabilities.helpers.PolicyUtil
uses java.lang.Exception
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses java.util.ArrayList
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin

class DefaultSearchPlugin implements ISearchPlugin {
  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultSearchPlugin))
  var _accountPlugin: IAccountPlugin
  var _policyPlugin: IPolicyPlugin
  var _policyHelper: PolicyUtil
  var _accountRetrievalPlugin: IAccountRetrievalPlugin
  var _iftsPlugin: IFTSPlugin
  @ForAllGwNodes
  construct(anAccountPlugin: IAccountPlugin, aPolicyPlugin: IPolicyPlugin,
            aPolicyHelper: PolicyUtil,
            anAccountRetrievalPlugin: IAccountRetrievalPlugin,
            anFTSPlugin: IFTSPlugin) {
    this._accountPlugin = anAccountPlugin
    this._policyPlugin = aPolicyPlugin
    this._policyHelper = aPolicyHelper
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
    this._iftsPlugin = anFTSPlugin
  }

  override function searchResultsToDTO(accounts: Account[], policies: Policy[]): SearchResultsDTO {
    final var dto = new SearchResultsDTO()
    dto.Accounts = _accountPlugin.accountBaseDetailsToDTOArray(accounts)
    dto.Policies = _policyPlugin.policyBaseDetailsToDTOArray(policies)

    return dto
  }

  override function search(searchParam: String): SearchResultsDTO {

    // If Free Text Search is enabled then use Free Text search methods
    if (gw.api.system.PLConfigParameters.FreeTextSearchEnabled.Value) {

      //For accounts
      var accountList = _iftsPlugin.performAccountSearch(searchParam)
      var accounts = new ArrayList<Account>()
      foreach(acc in accountList) {
          var account = getAccountByAccountNumber(acc)
          if(account != null){
             accounts.add(account)
          }
      }

      //For policies
      var policyList = _iftsPlugin.performPolicySearch(searchParam)
      var policies = new ArrayList<Policy>()
      foreach(pol in policyList){
          var policy = getPolicyByPolicyNumber(pol)
          if(policy != null){
            policies.add(policy)
          }
      }

      return searchResultsToDTO(accounts.toTypedArray(), policies.toTypedArray())
    }

    //Accounts
    var accounts = new ArrayList<Account>()
    var account = getAccountByAccountNumber(searchParam)
    if (account != null){
      accounts.add(account)
    }

    //Policies
    var policies = new ArrayList<Policy>()
    var policy = getPolicyByPolicyNumber(searchParam)
    if (policy != null){
      policies.add(policy)
    }

    return searchResultsToDTO(accounts.toTypedArray(), policies.toTypedArray())
  }

  protected function getAccountByAccountNumber(accountNumber: String): Account {
    try {
      return _accountRetrievalPlugin.getAccountByNumber(accountNumber)
    } catch (ex: Exception) {
      LOGGER.logDebug(ex)
    }

    return null
  }

  protected function getPolicyByPolicyNumber(policyNumber: String): Policy {
    try {
      return _policyHelper.getPolicyByPolicyNumber(policyNumber)
    } catch (ex: Exception) {
      LOGGER.logDebug(ex)
    }

    return null
  }
}
