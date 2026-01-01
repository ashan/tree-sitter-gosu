package nz.co.acc.integration.junoinformationservice.model.account

uses nz.co.acc.integration.junoinformationservice.model.AbstractDocument
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONAEPAccountComplianceDetail
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicy

class GSONAccount extends AbstractDocument {
  public var accId : String
  public var accountNumber : String
  public var accountName : String
  public var accountType : String
  public var irdNumber : String
  public var nzbn : String
  public var tradingName : String
  public var isAepContractAccount : Boolean
  public var aepContractNumber : String
  public var aepAgreementSignedDate : String
  public var aepTpaAgreement : String
  public var aepTpaNature : String
  public var organizationType : String
  public var myAccRegistrationStatus : String
  public var status : String
  public var userRoleAssignments : List<GSONAccountUserRoleAssignment> = {}
  public var accountContacts : List<GSONAccountContact>
  public var relatedAccounts : List<GSONRelatedAccount> = {}
  public var policies : List<GSONPolicy>
  public var aepComplianceDetails : List<GSONAEPAccountComplianceDetail> = {}
  public var aepMemberPolicies : List<GSONPolicy> = {}
  public var maoriBusinessInfo : GSONMaoriBusinessInfo
  public var balanceDate : String
}