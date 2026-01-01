package nz.co.acc.accountcontact.relationship

uses typekey.AccountContactRole

/**
 * Represents an instruction to link an existing Company contact to an account.
 * <p>
 * Created by OurednM on 25/06/2018.
 */
class CompanyContactRelationship {

  var contactAccNumber: String as ContactACCNumber
  var contactName: String as ContactName

  var accountAccNumber: String as AccountACCNumber
  var accountRole: AccountContactRole as AccountRole

  public function getNameAndACCID(): String {
    return "Company contact: ACCID=${contactAccNumber}, Name=${contactName}"
  }

  override function toString(): String {
    return "CompanyContactRelationship{" +
        "contactAccNumber='" + contactAccNumber + '\'' +
        ", contactName='" + contactName + '\'' +
        ", accountAccNumber='" + accountAccNumber + '\'' +
        ", accountRole=" + accountRole +
        '}'
  }
}