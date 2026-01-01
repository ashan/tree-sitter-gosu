package edge.capabilities.policy.local

uses edge.capabilities.policy.document.local.IIdCardPlugin
uses java.util.Date
uses edge.capabilities.policy.dto.PolicySummaryDTO
uses edge.capabilities.policy.dto.PolicyPeriodSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.document.dto.DocumentReferenceDTO
uses edge.capabilities.policy.util.PolicyUtil
uses edge.capabilities.policy.lob.ILobPolicySummaryPlugin
uses edge.capabilities.currency.dto.AmountDTO

/**
 * Default implementation of policy summary plugin.
 */
final class DefaultPolicySummaryPlugin implements IPolicySummaryPlugin {
  
  private var _lineSummaryPlugin : ILobPolicySummaryPlugin
  private var _idCardPlugin : IIdCardPlugin
  
  @ForAllGwNodes
  @Param("lineSummaryPlugin", "Plugin to fetch a policy-line (lob) related summary")
  @Param("idCardPlugin", "Plugin used to fetch ID card for the given policy")
  construct(lineSummaryPlugin : ILobPolicySummaryPlugin, idCardPlugin : IIdCardPlugin) {
    this._lineSummaryPlugin = lineSummaryPlugin
    this._idCardPlugin = idCardPlugin
  }


  override function getPolicySummary(policy : Policy, nowDate : Date) : PolicySummaryDTO {
    final var result = new PolicySummaryDTO()
    result.Periods = 
      getEffectivePeriods(policy, nowDate)
        .map(\period -> summarizePeriod(period))
    return result
  }

  
  private function summarizePeriod(period : PolicyPeriod) : PolicyPeriodSummaryDTO {
    final var result = new PolicyPeriodSummaryDTO()
    
    fillPeriodBaseProperties(result, period)
    
    result.Overview = _lineSummaryPlugin.getPolicyLineOverview(period)
    
    updateIdCardProperties(result, _idCardPlugin.getIdCardDocument(period))
    
    return result
  }
  
  /** Updates a card-related properties on the document summary. */
  public static function updateIdCardProperties(result : PolicyPeriodSummaryDTO, idCard : DocumentReferenceDTO) {
    if (idCard != null) {
      result.IdCardPublicID = idCard.DocumentId
      result.IdCardSessionID = idCard.SessionId
    }   
  }
  
    
  /**
   * Fills a basic (period-based) properties on the policy summary.
   */
  public static function fillPeriodBaseProperties(result : PolicyPeriodSummaryDTO, period : PolicyPeriod) {
    result.Lines = period.Lines.map(\line -> line.Subtype).toSet().toTypedArray()
    result.PolicyId = period.PolicyNumber
    result.Effective = period.PeriodStart
    result.Expiration = period.EndOfCoverageDate
    result.Premium = PolicyUtil.getPolicyPeriodPremium(period)
  }


  
  /**
   * Fetches an effective policy periodn for the policy. Returns empty array if there is
   * no period in effect.
   * @param policy policy to get periods from
   * @param nowDate date to filter inactive policies.
   */
  public static function getEffectivePeriods(policy : Policy, nowDate : Date) : PolicyPeriod[] {
    var endOfSelectedDate = gw.api.util.DateUtil.endOfDay(nowDate)
    var newPeriod = entity.Policy.finder.findPolicyPeriodByPolicyAndAsOfDate( policy, endOfSelectedDate )
    return newPeriod == null ? {} : {newPeriod}
  }

}
