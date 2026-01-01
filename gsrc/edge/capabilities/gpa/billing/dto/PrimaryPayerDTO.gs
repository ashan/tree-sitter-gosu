package edge.capabilities.gpa.billing.dto

uses edge.jsonmapper.JsonProperty

class PrimaryPayerDTO {


  @JsonProperty
  var _name : String as Name

  @JsonProperty
  var _address : String as Address

  @JsonProperty
  var _phoneNumber : String as PhoneNumber

}
