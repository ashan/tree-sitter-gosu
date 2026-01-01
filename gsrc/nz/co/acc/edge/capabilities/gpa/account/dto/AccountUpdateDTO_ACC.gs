package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.jsonmapper.JsonProperty

class AccountUpdateDTO_ACC {

  @JsonProperty
  var _contact : ContactUpdateDTO_ACC as Contact

  @JsonProperty
  var _correspondence : CorrespondencePreference_ACC as Correspondence
}