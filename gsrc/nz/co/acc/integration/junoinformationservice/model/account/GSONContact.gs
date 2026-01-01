package nz.co.acc.integration.junoinformationservice.model.account

class GSONContact {
  public var publicId : String
  public var contactType : String
  public var accId : String

  public var name : String
  public var title : String
  public var firstName : String
  public var middleName : String
  public var lastName : String
  public var gender : String
  public var dateOfBirth : String

  public var homePhone : GSONPhoneNumber
  public var workPhone : GSONPhoneNumber
  public var mobilePhone : GSONPhoneNumber
  public var irCellPhone : String
  public var irCellPhoneVerified : Boolean
  public var primaryPhone : String
  public var primaryEmail : String
  public var secondaryEmail : String
  public var irEmail : String
  public var irEmailVerified : Boolean
  public var emailVerifiedDate : String
  public var correspondencePreference : String


  public var addresses : List<GSONAddress>
  public var accreditations : List<GSONAccreditation> = {}

  public var updateTime : String
  public var claimsEmail : String
  public var claimsEmailVerifiedDate : String
}