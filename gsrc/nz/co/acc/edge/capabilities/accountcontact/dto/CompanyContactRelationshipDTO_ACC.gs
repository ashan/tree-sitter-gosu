package nz.co.acc.edge.capabilities.accountcontact.dto

uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty
uses typekey.AccountContactRole

/**
 * Created by Mike Ourednik on 11/03/2019.
 */
class CompanyContactRelationshipDTO_ACC {

  @JsonProperty
  @Size(8, 8)
  var contactAccNumber : String as ContactACCNumber

  @JsonProperty
  @Size(1, 100)
  var contactName : String as ContactName

  @JsonProperty
  @Size(1, 100)
  var emailAddress : String as ContactEmailAddress

  @JsonProperty
  @Size(1, 100)
  var phoneNumber : String as ContactPhoneNumber

  @JsonProperty
  var accountRole : AccountContactRole as AccountRole

  override function toString() : String {
    return "CompanyContactRelationshipDTO_ACC{" +
        "contactAccNumber='" + contactAccNumber + '\'' +
        ", contactName='" + contactName + '\'' +
        ", emailAddress=" + emailAddress +
        ", phoneNumber=" + phoneNumber +
        ", accountRole=" + accountRole +
        '}'
  }

}