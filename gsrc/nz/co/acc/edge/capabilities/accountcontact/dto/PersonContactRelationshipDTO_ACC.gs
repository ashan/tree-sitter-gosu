package nz.co.acc.edge.capabilities.accountcontact.dto

uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty
uses typekey.AccountContactRole

/**
 * Created by Mike Ourednik on 11/03/2019.
 */
class PersonContactRelationshipDTO_ACC {

  @JsonProperty
  @Size(8, 8)
  var contactAccNumber : String as ContactACCNumber

  @JsonProperty
  @Size(1, 100)
  var firstName : String as ContactFirstName

  @JsonProperty
  @Size(1, 100)
  var middleName : String as ContactMiddleName

  @JsonProperty
  @Size(1, 100)
  var lastName : String as ContactLastName

  @JsonProperty
  var dateOfBirth : Date as ContactDateOfBirth

  @JsonProperty
  @Size(1, 100)
  var emailAddress : String as ContactEmailAddress

  @JsonProperty
  @Size(1, 100)
  var phoneNumber : String as ContactPhoneNumber

  @JsonProperty
  var accountRole : AccountContactRole as AccountRole

  @JsonProperty
  var thirdPartyRelation : Auth3rdPartyRelations_ACC as ThirdPartyRelation

  @JsonProperty
  var employeeRelation : AuthCompEmpRelation_ACC as EmployeeRelation

  override function toString() : String {
    return "PersonContactRelationshipDTO_ACC{" +
        "contactAccNumber='" + contactAccNumber + '\'' +
        ", firstName='" + firstName + '\'' +
        ", middleName='" + middleName + '\'' +
        ", lastName='" + lastName + '\'' +
        ", dateOfBirth=" + dateOfBirth +
        ", emailAddress=" + emailAddress +
        ", phoneNumber=" + phoneNumber +
        ", accountRole=" + accountRole +
        ", thirdPartyRelation=" + thirdPartyRelation +
        ", employeeRelation=" + employeeRelation +
        '}'
  }
}