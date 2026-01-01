package edge.capabilities.gpa.search

uses edge.jsonrpc.IRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.capabilities.helpers.PolicyUtil
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.search.dto.SearchResultsDTO
uses edge.capabilities.gpa.search.dto.SearchRequestDTO
uses java.util.ArrayList
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin

class SearchHandler implements IRpcHandler {
  var _searchPlugin: ISearchPlugin
  var _policyHelper: PolicyUtil
  var _accountRetrievalPlugin: IAccountRetrievalPlugin
  var _iftsPlugin: IFTSPlugin
  @InjectableNode
  construct(aSearchPlugin: ISearchPlugin,
            aPolicyHelper: PolicyUtil,
            anAccountRetrievalPlugin: IAccountRetrievalPlugin,
            anFTSPlugin: IFTSPlugin) {
    this._searchPlugin = aSearchPlugin
    this._policyHelper = aPolicyHelper
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
    this._iftsPlugin = anFTSPlugin
  }

  /**
   * Get account by account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(dto.SearchParam)</code> -  To return list of accounts for SearchParam</dd>
   * <dd> <code>ISearchPlugin#searchResultsToDTO(accounts, null)</code> -  To return SearchResultsDTO</dd>
   * </dl>
   * @param   dto    SearchRequestDTO
   * @returns SearchResultsDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountByAccountNumber(dto: SearchRequestDTO): SearchResultsDTO {
    final var accounts = new Account[]{_accountRetrievalPlugin.getAccountByNumber(dto.SearchParam)}

    return _searchPlugin.searchResultsToDTO(accounts, null)
  }

  /**
   * Get account with free text search
   *
   * @param   aSearchRequestDTO    SearchRequestDTO
   * @returns SearchResultsDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAccountsByFreeText(aSearchRequestDTO: SearchRequestDTO): SearchResultsDTO {

    var accounts = new ArrayList<Account>()

    if (aSearchRequestDTO.SearchParam != null && !aSearchRequestDTO.SearchParam.Empty) {

      if (gw.api.system.PLConfigParameters.FreeTextSearchEnabled.Value) {

        var accountList = _iftsPlugin.performAccountSearch(aSearchRequestDTO.SearchParam)

        foreach(acc in accountList) {
          var account = _accountRetrievalPlugin.getAccountByNumber(acc)
          if (account != null) {
            accounts.add(account)
          }
        }
      }
    }

    return _searchPlugin.searchResultsToDTO(accounts.toTypedArray(), null)
  }

  /**
   * Get policy by policy number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>PolicyUtil#getPolicyByPolicyNumber(dto.SearchParam)</code> - To return list of policies for SearchParam</dd>
   * <dd> <code>ISearchPlugin#searchResultsToDTO(null, policies)</code> - To return SearchResultsDTO</dd>
   * </dl>
   * @param   dto    SearchRequestDTO
   * @returns SearchResultsDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicyByPolicyNumber(dto: SearchRequestDTO): SearchResultsDTO {
    final var policies = new Policy[]{_policyHelper.getPolicyByPolicyNumber(dto.SearchParam)}

    return _searchPlugin.searchResultsToDTO(null, policies)
  }

  /**
   * Get policy with free text search
   *
   * @param   aSearchRequestDTO    SearchRequestDTO
   * @returns SearchResultsDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPoliciesByFreeText(aSearchRequestDTO: SearchRequestDTO): SearchResultsDTO {
    var policies = new ArrayList<Policy>()

    if (aSearchRequestDTO.SearchParam != null && !aSearchRequestDTO.SearchParam.Empty) {

      if (gw.api.system.PLConfigParameters.FreeTextSearchEnabled.Value) {

        var policyList = _iftsPlugin.performPolicySearch(aSearchRequestDTO.SearchParam)
        foreach(pol in policyList){
          var policy = _policyHelper.getPolicyByPolicyNumber(pol)
          if(policy != null){
            policies.add(policy)
          }
        }
      }
    }

    return _searchPlugin.searchResultsToDTO(null, policies.toTypedArray())
  }

  /**
   * Search account or policy based on search request
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ISearchPlugin#search(dto.SearchParam)</code> - To return SearchResultsDTO</dd>
   * </dl>
   * @param   dto    SearchRequestDTO
   * @returns SearchResultsDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function search(dto: SearchRequestDTO): SearchResultsDTO {
    return _searchPlugin.search(dto.SearchParam)
  }
}
