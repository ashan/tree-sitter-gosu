package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 11/05/20.
 */
class GSONPolicyLineCP extends GSONPolicyLineBase implements IGSONPolicyLine {
  public var employmentStatus : String
  public var earnings : GSONLiableEarningsIndividual
  public var previousYearEarnings: GSONLiableEarningsIndividual
  public var bicCodes : List<GSONBICCode>
}