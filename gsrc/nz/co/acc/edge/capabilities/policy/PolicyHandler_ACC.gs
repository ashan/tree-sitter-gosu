package nz.co.acc.edge.capabilities.policy

uses edge.capabilities.policy.PolicyHandler
uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses edge.capabilities.policy.local.IPolicyPlugin
uses edge.capabilities.policy.local.IPolicySummaryPlugin

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.exception.NoAuthorityException
uses gw.api.locale.DisplayKey
uses gw.api.webservice.exception.BadIdentifierException
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.document.DocumentDTO_ACC
uses nz.co.acc.edge.capabilities.gpa.document.IDocumentPlugin_ACC
uses nz.co.acc.edge.capabilities.policy.dto.PolicyPeriodDTO_ACC
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * ACC Policy Handler API.
 */
class PolicyHandler_ACC extends PolicyHandler {
  private var _policyAccessPlugin: IPolicyAccessPlugin
  private var _policyPlugin: IPolicyPlugin
  private var _policyPluginACC : IPolicyPlugin_ACC
  private var _documentPlugin  : IDocumentPlugin_ACC

  @InjectableNode
  @Param("policySummaryPlugin", "Plugin used to get a policy summary information")
  @Param("policyPlugin", "Plugin used to fetch detailed information about policy periods")
  @Param("policyAccessPlugin", "Plugin used to validate policy access rules")
  construct(policySummaryPlugin: IPolicySummaryPlugin, policyPlugin: IPolicyPlugin, policyAccessPlugin: IPolicyAccessPlugin,
            aUserProvider: EffectiveUserProvider, policyPluginACC : IPolicyPlugin_ACC, documentPlugin  : IDocumentPlugin_ACC) {
    super(policySummaryPlugin, policyPlugin, policyAccessPlugin, aUserProvider)
    this._policyAccessPlugin = policyAccessPlugin
    this._policyPlugin = policyPlugin
    this._policyPluginACC = policyPluginACC
    this._documentPlugin = documentPlugin
  }

  /**
   * Gets the latest policy period details for a policy.
   * @param policyNumber the policy number
   * @return the policy period details.
   */
  @JsonRpcMethod
  public function getPolicyDetails(policyNumber: String): PolicyPeriodDTO {
    final var period = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, DateUtil_ACC.currentLevyYear())

    if (!_policyAccessPlugin.hasAccess(period)) {
      throw new NoAuthorityException()
    }

    if (period == null) {
      throw new BadIdentifierException(DisplayKey.get("Edge.Capabilities.Helpers.Exception.BadPolicyNumber", policyNumber))
    }

    return _policyPluginACC.getPolicyPeriodDetails(period)
  }

  /**
   * Gets the policy contacts for a policy.
   * @param policyNumber the policy number
   * @return the policy contact details.
   */
  @JsonRpcMethod
  function getPolicyContacts(policyNumber : String) : AccountContactDTO_ACC[] {
    var policyPeriod = PolicyUtil_ACC.getLatestPolicyPeriodByPolicyNumber(policyNumber, _policyAccessPlugin)
    return _policyPluginACC.getPolicyContacts(policyPeriod)
  }

  /**
   * Returns all history records of given policy
   *
   * @param      policyNumber the target policy number
   * @returns    HistoryDTO_ACC[] the collection History record
   */
  @JsonRpcMethod
  function getPolicyJourney(policyNumber: String) : HistoryDTO_ACC[] {
    final var period = PolicyUtil_ACC.getLatestPolicyPeriodByPolicyNumber(policyNumber, _policyAccessPlugin)

    return _policyPluginACC.getPolicyHistory(period)
  }

  /**
   * returns all documents for provided policy number
   * @author nitesh.gautam
   * @param policyNumber
   * @return DocumentDTO_ACC
   */
  @JsonRpcMethod
  function getDocumentsForPolicy(policyNumber: String): DocumentDTO_ACC[] {
    final var policy = PolicyUtil_ACC.findPolicyByPolicyNumber(policyNumber, _policyAccessPlugin)

    final var policyDocuments = _documentPlugin.getDocumentsForPolicy(policy)
    return _documentPlugin.toDTOArray(policyDocuments)
  }

  /**
   * returns policy details for provided policy number and levy year
   * @param policyNumber the policy number
   * @param levyYear the levy year
   * @return the policy details for the levy year
   */
  @JsonRpcMethod
  function getPolicyDetailsByLevyYear(policyNumber : String, levyYear : int) : PolicyPeriodDTO{
    var policyPeriod = PolicyUtil_ACC.getMostRecentPeriodByLevyYear_ACC(policyNumber, levyYear)

    if (!_policyAccessPlugin.hasAccess(policyPeriod.Policy)) {
      throw new NoAuthorityException()
    }

    return _policyPluginACC.getPolicyPeriodDetails(policyPeriod)
  }

  /**
   * returns retrieve all the draft
   * @param policyNumber the policy number
   * @param levyYear the levy year
   * @return the policy details for the levy year
   */
  @JsonRpcMethod
  function getUnboundTransactions(policyNumber : String, levyYear : int) : PolicyPeriodDTO_ACC[] {
    var policyPeriods = PolicyUtil_ACC.getTransactionByStatus(policyNumber, levyYear, {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTED, PolicyPeriodStatus.TC_RENEWING})
    var periodsList = new ArrayList<PolicyPeriodDTO_ACC>()
    for(pp in policyPeriods) {
      periodsList.add(_policyPluginACC.getPolicyPeriodDetails(pp.getSlice(pp.EditEffectiveDate)))
    }

    return periodsList.toTypedArray()
  }
}