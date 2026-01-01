package edge.capabilities.gpa.contact.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.address.dto.AddressDTO
uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.annotations.Augment
uses edge.aspects.validation.annotations.NotSet
uses edge.aspects.validation.annotations.Phone
uses edge.aspects.validation.Validation
uses edge.el.Expr

abstract class ContactBaseDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _displayName : String as DisplayName

  @JsonProperty @Size(0, 60) @Required
  var _contactName : String as ContactName

  @JsonProperty @Size(0, 60)
  var _contactNameKanji : String as ContactNameKanji

  @JsonProperty
  var _subtype : String as Subtype

  @JsonProperty
  @Augment({"AddressLine1","PostalCode"}, {new Required()})
  var _primaryAddress : AddressDTO as PrimaryAddress

  @JsonProperty
  var _primaryPhoneType : typekey.PrimaryPhoneType as PrimaryPhoneType

  @Required(Expr.eq(Expr.getProperty("PrimaryPhoneType", Validation.PARENT),PrimaryPhoneType.TC_HOME))
  @JsonProperty @Size(0, 30) @Phone
  var _homeNumber : String as HomeNumber

  @JsonProperty @Size(0, 30) @Phone
  var _workNumber : String as WorkNumber

  @JsonProperty @Size(0, 30) @Phone
  var _faxNumber : String as FaxNumber

  @JsonProperty @Size(0, 60) @Email
  var _emailAddress1 : String as EmailAddress1

  @JsonProperty
  var _primaryContactName : String as PrimaryContactName

  @JsonProperty @Required
  var _producerCode : String as ProducerCode
}
