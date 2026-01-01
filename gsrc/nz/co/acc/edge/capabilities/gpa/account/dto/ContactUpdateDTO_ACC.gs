package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty

class ContactUpdateDTO_ACC {
  @JsonProperty @Size(0, 60) @Email
  var _emailAddress1 : String as EmailAddress1

  @JsonProperty
  var _emailVerifiedDate : Date as EmailVerifiedDate
}