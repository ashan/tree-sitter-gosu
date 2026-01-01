package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 11/05/20.
 */
class GSONPolicyLineAEP extends GSONPolicyLineBase implements IGSONPolicyLine {
  public var auditResult: String
  public var contractPlanType: String
  public var claimManagementPeriod: String
  public var highCostClaimsCover: Integer
  public var stopLossPercentage: Integer
  public var stopLossLimit: BigDecimal
  public var earnings: GSONLiableEarningsAEP
  public var costs: GSONAEPCost[] = {}
  public var liableEarningsSummaryByMember: List<GSONAEPMemberData> = {}
  public var liableEarningsSummaryByCu: List<GSONAEPRateableCUData> = {}
}