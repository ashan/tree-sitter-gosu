package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 11/05/20.
 */
class GSONPolicyLineBase {
  public var publicId : String
  public var policyType : String
  public var expirationDate : String
  public var effectiveDate : String
  public var totalPremium : BigDecimal
  public var levyCost : BigDecimal
}