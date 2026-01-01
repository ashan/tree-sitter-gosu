package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 11/05/20.
 */
class GSONPolicyLineWPS extends GSONPolicyLineBase implements IGSONPolicyLine {
  public var earnings : GSONLiableEarningsShareholders
  public var applyInflation : Boolean
  public var bicCodes : List<GSONBICCode>
}