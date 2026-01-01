package nz.co.acc.integration.junoinformationservice.model.policy

uses nz.co.acc.integration.junoinformationservice.model.AbstractDocument

uses java.math.BigDecimal

class GSONPolicyTerm extends AbstractDocument {

  public var publicId : String
  public var createTime: String
  public var updateTime: String

  public var accId : String
  public var accPolicySuffix : String
  public var policyNumber : String
  public var policyType: String

  public var cancellationDate : String
  public var ceasedTradingDate : String
  public var effective : String
  public var expiration : String
  public var levyYear: Integer

  public var policyStatus : String
  public var status : String
  public var validForClaimsRegistration: Boolean
  public var activeTerm: Boolean

  public var isAepMemberPolicy: Boolean
  public var aepMasterAccId: String
  public var aepPlanStartDate: String
  public var aepPlanEndDate: String
  public var aepMidTermStartDate: String
  public var aepAuditCompletionDate: String

  public var levyCost : BigDecimal
  public var totalPremium : BigDecimal
//  public var gst: BigDecimal
  public var accreditedEmployerLevy: BigDecimal

  public var policyLines : Map<String, IGSONPolicyLine>
}