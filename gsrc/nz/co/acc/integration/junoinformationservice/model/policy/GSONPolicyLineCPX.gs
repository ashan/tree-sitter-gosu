package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 11/05/20.
 */
class GSONPolicyLineCPX extends GSONPolicyLineBase implements IGSONPolicyLine {
  public var coverages : List<GSONCPXCoverage>
  public var businessStructure : String
  public var employmentStatus : String
  public var maximumCoverPermitted : BigDecimal
  public var minimumCoverPermitted : BigDecimal
  public var bicCodes : List<GSONBICCode>
}