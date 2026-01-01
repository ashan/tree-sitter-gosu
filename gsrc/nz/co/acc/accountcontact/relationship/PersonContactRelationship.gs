package nz.co.acc.accountcontact.relationship

uses typekey.AccountContactRole

/**
 * Represents an instruction to link an existing Person contact to an account.
 * <p>
 * Created by OurednM on 25/06/2018.
 */
class PersonContactRelationship {

  var contactAccNumber: String as ContactACCNumber
  var firstName: String as ContactFirstName
  var middleName: String as ContactMiddleName
  var lastName: String as ContactLastName
  var dateOfBirth: Date as ContactDateOfBirth

  var accountAccNumber: String as AccountACCNumber
  var accountRole: AccountContactRole as AccountRole
  var thirdPartyRelation: Auth3rdPartyRelations_ACC as ThirdPartyRelation
  var employeeRelation: AuthCompEmpRelation_ACC as EmployeeRelation

  function getNameAndDOB(): String {
    var sb = new StringBuilder()
    sb.append("Person contact: ")
    sb.append(firstName)
    if (middleName != null) {
      sb.append(" ")
      sb.append(middleName)
    }
    sb.append(" ")
    sb.append(lastName)
    if (dateOfBirth != null) {
      sb.append(", DOB: ")
      sb.append(dateOfBirth)
    }
    return sb.toString()
  }

  override function toString(): String {
    return "PersonContactRelationship{" +
        "contactAccNumber='" + contactAccNumber + '\'' +
        ", firstName='" + firstName + '\'' +
        ", middleName='" + middleName + '\'' +
        ", lastName='" + lastName + '\'' +
        ", dateOfBirth=" + dateOfBirth +
        ", accountAccNumber='" + accountAccNumber + '\'' +
        ", accountRole=" + accountRole +
        ", thirdPartyRelation=" + thirdPartyRelation +
        ", employeeRelation=" + employeeRelation +
        '}'
  }

}