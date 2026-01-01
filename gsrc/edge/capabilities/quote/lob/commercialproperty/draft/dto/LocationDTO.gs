package edge.capabilities.quote.lob.commercialproperty.draft.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Augment
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Phone

class LocationDTO {
  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _buildings : BuildingDTO[] as Buildings

  @JsonProperty
  @Augment({"AddressLine1","PostalCode"}, {new Required()})
  var _address : AddressDTO as Address

  @JsonProperty
  var _territoryCode : String  as TerritoryCode

  @JsonProperty
  var _displayName : String  as DisplayName

  @JsonProperty
  var _name : String  as LocationName

  @JsonProperty @Phone
  var _phone : String  as Phone

  @JsonProperty
  var _fireProtection : typekey.FireProtectClass  as FireProtection

  @JsonProperty
  var _locationCode : String  as LocationCode

  @JsonProperty
  var _isPrimary : Boolean  as IsPrimary

  @JsonProperty
  var _description : String  as Description

}
