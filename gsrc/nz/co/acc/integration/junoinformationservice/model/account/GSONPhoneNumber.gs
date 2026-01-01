package nz.co.acc.integration.junoinformationservice.model.account

class GSONPhoneNumber {
  public var country : String
  public var countryCode : String
  public var phoneNumber : String
  public var extension : String

  construct(c : String, cc : String, pn : String, ext : String) {
    this.country = c
    this.countryCode = cc
    this.phoneNumber = pn
    this.extension = ext
  }

}