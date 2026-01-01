package nz.co.acc.integration.junoinformationservice.model.policy

/**
 * Created by Mike Ourednik on 20/08/20.
 */
class GSONPolicy {

  public var publicId: String
  public var policyType: String

  public var issueDate: String
  public var updateTime: String

  public var validForClaimsRegistration : Boolean
  public var legacyEmployerId: String
  public var legacyEmployerId2: String

  public var policyTerm: GSONPolicyTerm
}