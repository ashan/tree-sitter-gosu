package nz.co.acc.plm.integration.bulkupload.csvtypes

uses typekey.AccountContactRole

/**
 * Created by andersc3 on 27/01/2020.
 */
class RemoveContactDetailsDTO {

  public var accNumber : String as ACCNumber = null
  public var emailAddress : String = null
  public var phoneNumber : String = null
  public var contactRole : AccountContactRole = null


  override function toString() : String {
    return "RemoveContactDetailsDTO{" +
        "ACCNumber='" + ACCNumber + '\'' +
        ", emailAddress='" + emailAddress + '\'' +
        ", phoneNumber='" + phoneNumber + '\'' +
        ", contactRole='" + contactRole.toString() + '\'' +
        '}'
  }
}