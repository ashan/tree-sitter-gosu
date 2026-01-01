package nz.co.acc.query.builder

uses gw.api.database.ISelectQueryBuilder
uses gw.policy.PolicyPeriodSummaryQueryBuilder

/**
 * Created by HamblyA on 1/06/2017.
 */
class PolicyPeriodSummaryQueryBuilder_ACC extends PolicyPeriodSummaryQueryBuilder {
  var _accPolicyId_ACC: String

  function withACCPolicyId_ACC(value : String) : PolicyPeriodSummaryQueryBuilder_ACC {
    _accPolicyId_ACC = value
    return this
  }

  @Override
  function doRestrictQuery(selectQueryBuilder : ISelectQueryBuilder){
    super.doRestrictQuery(selectQueryBuilder)
    if (_accPolicyId_ACC.NotBlank) {
      selectQueryBuilder.compare(PolicyPeriod#ACCPolicyID_ACC, Equals, _accPolicyId_ACC)
    }
  }

}